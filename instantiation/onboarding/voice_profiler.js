'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Run voice profiling on captured communications data.
 *
 * @param {object} options
 * @param {object} options.pipelineConfig - for owner emails and person_id
 * @param {object} options.sourceIdentities - for Basecamp person_id
 * @param {string} options.targetWorkspaceRoot - for reading captures
 * @param {string} options.targetVaultRoot - for writing operator/voice.md
 * @param {object} [options.mockCapturedData] - pre-built data for testing
 * @returns {object} Profile result
 */
function runVoiceProfiler({ pipelineConfig, sourceIdentities, targetWorkspaceRoot, targetVaultRoot, mockCapturedData }) {
  // Check if any comms sources are connected
  const hasGmail = pipelineConfig.sync_engines && pipelineConfig.sync_engines.gmail;
  const hasBasecamp = pipelineConfig.sync_engines && pipelineConfig.sync_engines.basecamp;

  if (!hasGmail && !hasBasecamp) {
    return {
      success: true,
      skipped: true,
      reason: 'No communications sources connected',
    };
  }

  // Use mock data or scan real captures
  const sentMessages = mockCapturedData
    ? mockCapturedData.sentMessages || []
    : scanSentMessages(pipelineConfig, sourceIdentities, targetWorkspaceRoot);

  const basecampComments = mockCapturedData
    ? mockCapturedData.basecampComments || []
    : scanBasecampComments(sourceIdentities, targetWorkspaceRoot);

  if (sentMessages.length === 0 && basecampComments.length === 0) {
    return {
      success: true,
      skipped: true,
      reason: 'No sent messages found to profile',
    };
  }

  // Extract patterns
  const profile = extractVoicePatterns(sentMessages, basecampComments, pipelineConfig.owner.name);

  // Write operator/voice.md
  const voicePath = path.join(targetVaultRoot, 'operator', 'voice.md');
  const voiceDir = path.dirname(voicePath);
  if (!fs.existsSync(voiceDir)) {
    fs.mkdirSync(voiceDir, { recursive: true });
  }

  const generationDate = new Date().toISOString().split('T')[0];
  const voiceContent = formatVoiceProfile(profile, pipelineConfig.owner.name, generationDate);
  fs.writeFileSync(voicePath, voiceContent, 'utf8');

  return {
    success: true,
    skipped: false,
    voicePath,
    stats: {
      sentMessages: sentMessages.length,
      basecampComments: basecampComments.length,
    },
  };
}

/**
 * Scan Gmail captures for sent messages from the owner.
 */
function scanSentMessages(pipelineConfig, sourceIdentities, workspaceRoot) {
  const capturesDir = path.join(workspaceRoot, 'state', 'captures', 'gmail');
  if (!fs.existsSync(capturesDir)) return [];

  const ownerEmails = (pipelineConfig.owner && pipelineConfig.owner.emails) || [];
  const messages = [];

  // Walk capture directories
  const entries = fs.readdirSync(capturesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const captureDir = path.join(capturesDir, entry.name);
    const files = fs.readdirSync(captureDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(captureDir, file), 'utf8'));
        const from = (data.normalized_payload && data.normalized_payload.from) || '';
        if (ownerEmails.some(email => from.toLowerCase().includes(email.toLowerCase()))) {
          messages.push(data);
        }
      } catch (_) { /* skip corrupt files */ }
    }
  }

  return messages;
}

/**
 * Scan Basecamp captures for comments by the owner.
 */
function scanBasecampComments(sourceIdentities, workspaceRoot) {
  const capturesDir = path.join(workspaceRoot, 'state', 'captures', 'basecamp');
  if (!fs.existsSync(capturesDir)) return [];

  const personId = sourceIdentities && sourceIdentities.basecamp
    && sourceIdentities.basecamp.owner && sourceIdentities.basecamp.owner.person_id;
  if (!personId) return [];

  const comments = [];
  const entries = fs.readdirSync(capturesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const captureDir = path.join(capturesDir, entry.name);
    const files = fs.readdirSync(captureDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(captureDir, file), 'utf8'));
        if (data.normalized_payload && String(data.normalized_payload.creator_id) === String(personId)) {
          comments.push(data);
        }
      } catch (_) { /* skip */ }
    }
  }

  return comments;
}

/**
 * Extract voice patterns from sent messages and comments.
 */
function extractVoicePatterns(sentMessages, basecampComments, ownerName) {
  const greetings = new Map();
  const signoffs = new Map();
  const phrases = new Map();
  let totalSentenceLength = 0;
  let sentenceCount = 0;
  let emojiCount = 0;
  let messageCount = sentMessages.length + basecampComments.length;

  for (const msg of sentMessages) {
    const snippet = (msg.normalized_payload && msg.normalized_payload.snippet) || '';
    analyzeText(snippet, greetings, signoffs, phrases);
    const sentences = snippet.split(/[.!?]+/).filter(s => s.trim().length > 0);
    totalSentenceLength += sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0);
    sentenceCount += sentences.length;
    emojiCount += (snippet.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
  }

  for (const comment of basecampComments) {
    const content = (comment.normalized_payload && comment.normalized_payload.content) || '';
    analyzeText(content, greetings, signoffs, phrases);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    totalSentenceLength += sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0);
    sentenceCount += sentences.length;
  }

  const avgSentenceLength = sentenceCount > 0 ? Math.round(totalSentenceLength / sentenceCount) : 0;

  return {
    greetings: topN(greetings, 5),
    signoffs: topN(signoffs, 5),
    phrases: topN(phrases, 10),
    avgSentenceLength,
    emojiFrequency: messageCount > 0 ? (emojiCount / messageCount).toFixed(2) : '0',
    messageCount,
  };
}

function analyzeText(text, greetings, signoffs, phrases) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return;

  // Check first line for greeting patterns
  const firstLine = lines[0];
  const greetingPatterns = [/^(Hi|Hey|Hello|Good morning|Good afternoon|Good evening|Dear)\b/i];
  for (const pattern of greetingPatterns) {
    const match = firstLine.match(pattern);
    if (match) {
      const greeting = firstLine.slice(0, Math.min(firstLine.length, 30));
      greetings.set(greeting, (greetings.get(greeting) || 0) + 1);
    }
  }

  // Check last line for sign-off patterns
  const lastLine = lines[lines.length - 1];
  const signoffPatterns = [/^(Best|Thanks|Cheers|Regards|Kind regards|Warm regards|Thank you|Talk soon|Sent from)/i];
  for (const pattern of signoffPatterns) {
    const match = lastLine.match(pattern);
    if (match) {
      const signoff = lastLine.slice(0, Math.min(lastLine.length, 30));
      signoffs.set(signoff, (signoffs.get(signoff) || 0) + 1);
    }
  }

  // Extract 2-3 word phrases
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    phrases.set(bigram, (phrases.get(bigram) || 0) + 1);
  }
}

function topN(map, n) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([text, count]) => ({ text, count }));
}

/**
 * Format voice profile as markdown.
 */
function formatVoiceProfile(profile, ownerName, generationDate) {
  const lines = [
    `# Voice Profile`,
    ``,
    `Generated from ${ownerName}'s communications on ${generationDate}.`,
    ``,
    `## Greeting Patterns`,
    ``,
  ];

  if (profile.greetings.length > 0) {
    for (const g of profile.greetings) {
      lines.push(`- "${g.text}" (${g.count}x)`);
    }
  } else {
    lines.push(`(No clear greeting patterns detected)`);
  }

  lines.push(``, `## Sign-Off Patterns`, ``);
  if (profile.signoffs.length > 0) {
    for (const s of profile.signoffs) {
      lines.push(`- "${s.text}" (${s.count}x)`);
    }
  } else {
    lines.push(`(No clear sign-off patterns detected)`);
  }

  lines.push(``, `## Formality Range`, ``);
  lines.push(`Based on ${profile.messageCount} analyzed messages.`);

  lines.push(``, `## Sentence Structure`, ``);
  lines.push(`- Average sentence length: ${profile.avgSentenceLength} words`);

  lines.push(``, `## Recurring Phrases`, ``);
  if (profile.phrases.length > 0) {
    for (const p of profile.phrases) {
      lines.push(`- "${p.text}" (${p.count}x)`);
    }
  } else {
    lines.push(`(No recurring phrases detected)`);
  }

  lines.push(``, `## Emoji and Punctuation`, ``);
  lines.push(`- Emoji frequency: ${profile.emojiFrequency} per message`);

  lines.push(``, `## Tone Shifts by Context`, ``);
  lines.push(`(Requires more data — refine as the system captures more communications)`);
  lines.push(``);

  return lines.join('\n');
}

module.exports = { runVoiceProfiler, extractVoicePatterns, formatVoiceProfile };
