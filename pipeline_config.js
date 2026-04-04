const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../state/runtime/pipeline_config.json');

const FALLBACK_GMAIL_ACCOUNTS = {
  'gws-ca': '~/.config/gws-ca',
  'gws-eterno': '~/.config/gws-eterno',
  'gws-info': '~/.config/gws-info',
  'gws-personal': '~/.config/gws-personal',
};

const FALLBACK_BASECAMP_API_BASE = 'https://3.basecampapi.com/3378703';
const FALLBACK_CALENDAR_IDS = [
  'viktor.so.lost@gmail.com',
  'viktor@cultural-affairs.com',
  'viktor@eternogallery.com',
];
const FALLBACK_CALENDAR_CONFIG_DIR = '~/.config/gws-personal';
const FALLBACK_DRIVE_CONFIG_DIR = '~/.config/gws-eterno';
const FALLBACK_GMAIL_FILTERS = {
  skip_categories: ['promotions', 'social', 'forums'],
  skip_calendar_invites: true,
  personal_noise_accounts: ['gws-personal'],
};

function loadPipelineConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (_) {
    return null;
  }
}

function getGmailAccounts() {
  const config = loadPipelineConfig();
  const accounts = config?.accounts?.gmail;
  if (Array.isArray(accounts) && accounts.length > 0) {
    const mapped = {};
    for (const account of accounts) {
      if (account?.name && account?.config_dir) {
        mapped[account.name] = account.config_dir;
      }
    }
    if (Object.keys(mapped).length > 0) return mapped;
  }
  return FALLBACK_GMAIL_ACCOUNTS;
}

function getBasecampApiBase() {
  const config = loadPipelineConfig();
  return config?.accounts?.basecamp?.api_base || FALLBACK_BASECAMP_API_BASE;
}

function getCalendarConfig() {
  const config = loadPipelineConfig();
  const calendarConfig = config?.accounts?.calendar || {};
  const primaryEmail = config?.owner?.emails?.[0] || null;
  const calendarIds = Array.isArray(calendarConfig.calendars) && calendarConfig.calendars.length > 0
    ? calendarConfig.calendars
    : (primaryEmail ? [primaryEmail] : FALLBACK_CALENDAR_IDS);
  return {
    calendarIds,
    configDir: calendarConfig.config_dir || FALLBACK_CALENDAR_CONFIG_DIR,
  };
}

function getDriveConfigDir() {
  const config = loadPipelineConfig();
  return config?.accounts?.drive?.config_dir || FALLBACK_DRIVE_CONFIG_DIR;
}

function getGmailFilters() {
  const config = loadPipelineConfig();
  return {
    ...FALLBACK_GMAIL_FILTERS,
    ...(config?.gmail_filters || {}),
  };
}

module.exports = {
  CONFIG_PATH,
  FALLBACK_GMAIL_ACCOUNTS,
  FALLBACK_BASECAMP_API_BASE,
  FALLBACK_CALENDAR_IDS,
  FALLBACK_CALENDAR_CONFIG_DIR,
  FALLBACK_DRIVE_CONFIG_DIR,
  FALLBACK_GMAIL_FILTERS,
  loadPipelineConfig,
  getGmailAccounts,
  getBasecampApiBase,
  getCalendarConfig,
  getDriveConfigDir,
  getGmailFilters,
};
