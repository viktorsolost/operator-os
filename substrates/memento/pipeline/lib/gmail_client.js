/**
 * Gmail client using gws CLI.
 *
 * Per-message fetch (not thread-level) per capture layer contract.
 */

const fs = require('fs');
const { gws } = require('./gws_client');
const { getGmailAccounts, FALLBACK_GMAIL_ACCOUNTS } = require('./pipeline_config');

const HARDCODED_ACCOUNTS = FALLBACK_GMAIL_ACCOUNTS;

function loadAccounts() {
  return getGmailAccounts();
}

const ACCOUNTS = loadAccounts();

function getAccounts() {
  return loadAccounts();
}

/**
 * Fetch message list from a Gmail account.
 *
 * @param {string} account - Account key (e.g., "gws-ca")
 * @param {string} sinceDate - Date string in YYYY/MM/DD format
 * @param {number} maxResults - Max messages to list
 * @returns {Promise<object[]>} Array of message list entries (id, threadId)
 */
async function listMessages(account, sinceDate, maxResults = 100) {
  const configDir = getAccounts()[account];
  if (!configDir) throw new Error(`Unknown Gmail account: ${account}`);

  const result = await gws('gmail', 'users messages', 'list', {
    userId: 'me',
    maxResults,
    q: `after:${sinceDate} in:inbox`,
  }, configDir);

  return result.messages || [];
}

/**
 * Fetch a single message by ID.
 *
 * @param {string} account - Account key
 * @param {string} messageId - Gmail message ID
 * @returns {Promise<object>} Full message object
 */
async function getMessage(account, messageId) {
  const configDir = getAccounts()[account];
  if (!configDir) throw new Error(`Unknown Gmail account: ${account}`);

  return gws('gmail', 'users messages', 'get', {
    userId: 'me',
    id: messageId,
    format: 'full',
  }, configDir);
}

/**
 * Fetch all messages from one account since a date.
 * Lists messages, then fetches each one in full.
 *
 * @param {string} account - Account key
 * @param {string} sinceDate - Date in YYYY/MM/DD format
 * @param {number} maxResults - Max messages to list
 * @returns {Promise<object[]>} Array of full message objects
 */
async function fetchMessages(account, sinceDate, maxResults = 100) {
  const listed = await listMessages(account, sinceDate, maxResults);
  const messages = [];

  for (const entry of listed) {
    try {
      const msg = await getMessage(account, entry.id);
      msg._account = account;
      messages.push(msg);
    } catch (err) {
      console.error(`[gmail] Failed to fetch message ${entry.id} from ${account}: ${err.message}`);
    }
  }

  return messages;
}

/**
 * Fetch messages from all 4 Gmail accounts.
 *
 * @param {string} sinceDate - Date in YYYY/MM/DD format
 * @returns {Promise<object[]>} All messages across all accounts
 */
async function fetchAllAccounts(sinceDate) {
  const allMessages = [];
  const errors = [];
  const accounts = getAccounts();

  for (const account of Object.keys(accounts)) {
    try {
      console.log(`[gmail] Fetching from ${account} since ${sinceDate}...`);
      const messages = await fetchMessages(account, sinceDate);
      console.log(`[gmail] ${account}: ${messages.length} messages`);
      allMessages.push(...messages);
    } catch (err) {
      console.error(`[gmail] ${account} failed: ${err.message}`);
      errors.push({ account, error: err.message });
    }
  }

  return { messages: allMessages, errors };
}

module.exports = {
  fetchMessages,
  fetchAllAccounts,
  getMessage,
  listMessages,
  getAccounts,
  ACCOUNTS,
};
