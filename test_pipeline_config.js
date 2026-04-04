'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  CONFIG_PATH,
  DEFAULT_GMAIL_FILTERS,
  loadPipelineConfig,
  getGmailAccounts,
  getBasecampApiBase,
  getCalendarConfig,
  getDriveConfigDir,
  getGmailFilters,
} = require('./pipeline_config');

let passed = 0;
let failed = 0;

function assert(label, condition, detail) {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// --- Helper: write a temp config file ---
function writeTempConfig(data) {
  const tmpPath = path.join(os.tmpdir(), `pipeline_config_test_${Date.now()}.json`);
  fs.writeFileSync(tmpPath, JSON.stringify(data), 'utf8');
  return tmpPath;
}

// ============================================================
// Suite 1: No config file — all getters return null/empty/defaults
// ============================================================
console.log('\nSuite 1: No config file');

const nonExistentPath = path.join(os.tmpdir(), 'does_not_exist_pipeline_config.json');

assert('loadPipelineConfig returns null when file missing',
  loadPipelineConfig(nonExistentPath) === null);

assert('getGmailAccounts returns {} when no config',
  deepEqual(getGmailAccounts(nonExistentPath), {}));

assert('getBasecampApiBase returns null when no config',
  getBasecampApiBase(nonExistentPath) === null);

{
  const cal = getCalendarConfig(nonExistentPath);
  assert('getCalendarConfig.calendarIds is [] when no config',
    deepEqual(cal.calendarIds, []));
  assert('getCalendarConfig.configDir is null when no config',
    cal.configDir === null);
}

assert('getDriveConfigDir returns null when no config',
  getDriveConfigDir(nonExistentPath) === null);

{
  const filters = getGmailFilters(nonExistentPath);
  assert('getGmailFilters returns DEFAULT_GMAIL_FILTERS when no config',
    deepEqual(filters, DEFAULT_GMAIL_FILTERS));
}

// ============================================================
// Suite 2: Valid config file — getters return config values
// ============================================================
console.log('\nSuite 2: Valid config file');

const sampleConfig = {
  owner: {
    emails: ['user@example.com'],
  },
  accounts: {
    gmail: [
      { name: 'work', config_dir: '~/.config/gws-work' },
      { name: 'personal', config_dir: '~/.config/gws-home' },
    ],
    basecamp: {
      api_base: 'https://3.basecampapi.com/9999999',
    },
    calendar: {
      calendars: ['user@example.com', 'team@example.com'],
      config_dir: '~/.config/gws-work',
    },
    drive: {
      config_dir: '~/.config/gws-home',
    },
  },
  gmail_filters: {
    skip_categories: ['promotions'],
    skip_calendar_invites: false,
    personal_noise_accounts: ['gws-home'],
  },
};

const tmpPath = writeTempConfig(sampleConfig);

assert('loadPipelineConfig returns parsed object',
  loadPipelineConfig(tmpPath) !== null && typeof loadPipelineConfig(tmpPath) === 'object');

{
  const accounts = getGmailAccounts(tmpPath);
  assert('getGmailAccounts maps name->config_dir from config',
    accounts['work'] === '~/.config/gws-work' && accounts['personal'] === '~/.config/gws-home');
}

assert('getBasecampApiBase returns api_base from config',
  getBasecampApiBase(tmpPath) === 'https://3.basecampapi.com/9999999');

{
  const cal = getCalendarConfig(tmpPath);
  assert('getCalendarConfig.calendarIds comes from config',
    deepEqual(cal.calendarIds, ['user@example.com', 'team@example.com']));
  assert('getCalendarConfig.configDir comes from config',
    cal.configDir === '~/.config/gws-work');
}

assert('getDriveConfigDir returns config_dir from config',
  getDriveConfigDir(tmpPath) === '~/.config/gws-home');

{
  const filters = getGmailFilters(tmpPath);
  assert('getGmailFilters merges config over defaults (skip_calendar_invites overridden)',
    filters.skip_calendar_invites === false);
  assert('getGmailFilters uses config personal_noise_accounts',
    deepEqual(filters.personal_noise_accounts, ['gws-home']));
}

// ============================================================
// Suite 3: primaryEmail fallback in getCalendarConfig
// ============================================================
console.log('\nSuite 3: primaryEmail fallback in getCalendarConfig');

const configWithOwnerOnly = {
  owner: { emails: ['owner@example.com'] },
  accounts: {},
};
const tmpPath2 = writeTempConfig(configWithOwnerOnly);

{
  const cal = getCalendarConfig(tmpPath2);
  assert('getCalendarConfig falls back to primaryEmail when no calendars list',
    deepEqual(cal.calendarIds, ['owner@example.com']));
  assert('getCalendarConfig.configDir is null when not configured',
    cal.configDir === null);
}

// ============================================================
// Suite 4: DEFAULT_GMAIL_FILTERS has no Viktor-specific values
// ============================================================
console.log('\nSuite 4: DEFAULT_GMAIL_FILTERS is generic');

const filterStr = JSON.stringify(DEFAULT_GMAIL_FILTERS);
assert('DEFAULT_GMAIL_FILTERS.personal_noise_accounts is empty array',
  deepEqual(DEFAULT_GMAIL_FILTERS.personal_noise_accounts, []));
assert('DEFAULT_GMAIL_FILTERS contains no gws-personal',
  !filterStr.includes('gws-personal'));
assert('DEFAULT_GMAIL_FILTERS contains no gws-eterno',
  !filterStr.includes('gws-eterno'));

// ============================================================
// Suite 5: No Viktor-specific strings in pipeline_config.js source
// ============================================================
console.log('\nSuite 5: No Viktor-specific strings in source file');

const sourceText = fs.readFileSync(path.join(__dirname, 'pipeline_config.js'), 'utf8');
const banned = [
  'viktor',
  'gws-personal',
  'gws-eterno',
  'gws-ca',
  'gws-info',
  '3378703',
  'cultural-affairs',
  'eternogallery',
];
for (const term of banned) {
  assert(`Source file does not contain '${term}'`,
    !sourceText.toLowerCase().includes(term.toLowerCase()),
    `Found banned string: ${term}`);
}

// ============================================================
// Suite 6: Exports — no FALLBACK_* constants exported
// ============================================================
console.log('\nSuite 6: Exports');

const mod = require('./pipeline_config');
const exportedKeys = Object.keys(mod);

assert('CONFIG_PATH is exported', exportedKeys.includes('CONFIG_PATH'));
assert('DEFAULT_GMAIL_FILTERS is exported', exportedKeys.includes('DEFAULT_GMAIL_FILTERS'));
assert('loadPipelineConfig is exported', exportedKeys.includes('loadPipelineConfig'));
assert('getGmailAccounts is exported', exportedKeys.includes('getGmailAccounts'));
assert('getBasecampApiBase is exported', exportedKeys.includes('getBasecampApiBase'));
assert('getCalendarConfig is exported', exportedKeys.includes('getCalendarConfig'));
assert('getDriveConfigDir is exported', exportedKeys.includes('getDriveConfigDir'));
assert('getGmailFilters is exported', exportedKeys.includes('getGmailFilters'));

const fallbackKeys = exportedKeys.filter(k => k.startsWith('FALLBACK_'));
assert('No FALLBACK_* constants are exported', fallbackKeys.length === 0,
  `Found: ${fallbackKeys.join(', ')}`);

// ============================================================
// Cleanup
// ============================================================
try { fs.unlinkSync(tmpPath); } catch (_) {}
try { fs.unlinkSync(tmpPath2); } catch (_) {}

// ============================================================
// Summary
// ============================================================
console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
if (failed > 0) {
  process.exit(1);
}
