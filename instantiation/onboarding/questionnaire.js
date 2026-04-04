'use strict';

const { normalizeRuntimeSelection, ALLOWED_RUNTIMES } = require('../shared/runtime_selector');

const REQUIRED_FIELDS = [
  'owner_name', 'system_name', 'primary_role', 'timezone',
  'home_root', 'vault_location', 'workspace_root', 'selected_runtimes'
];

const OPTIONAL_DEFAULTS = {
  tone_profile: 'direct',
  preferred_reporting_style: 'concise',
  business_context: '',
  priority_modes: '',
  brand_categories: [],
  project_categories: [],
  connect_accounts_now: 'later',
  account_connections: [],
  gmail_accounts: [],
  gmail_emails: [],
  basecamp_account_id: '',
  basecamp_person_id: '',
  workflow_tools: {},
  additional_tools: [],
  tool_integration_notes: '',
};

function validateOnboardingInputs(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('validateOnboardingInputs: input must be a non-null object');
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (raw[field] === undefined || raw[field] === null || raw[field] === '') {
      throw new Error(`validateOnboardingInputs: required field "${field}" is missing or empty`);
    }
  }

  // Validate selected_runtimes
  const runtimeSelection = normalizeRuntimeSelection(raw.selected_runtimes);

  // Build validated packet with defaults applied
  const packet = {};

  // Copy required fields
  for (const field of REQUIRED_FIELDS) {
    packet[field] = raw[field];
  }

  // Apply optional defaults
  for (const [field, defaultVal] of Object.entries(OPTIONAL_DEFAULTS)) {
    packet[field] = (raw[field] !== undefined && raw[field] !== null) ? raw[field] : defaultVal;
  }

  // Attach normalized runtime selection
  packet.runtimeSelection = runtimeSelection;

  return Object.freeze(packet);
}

module.exports = { validateOnboardingInputs, REQUIRED_FIELDS, OPTIONAL_DEFAULTS };
