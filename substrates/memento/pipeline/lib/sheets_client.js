const { gws } = require('./gws_client');

async function getSpreadsheet(spreadsheetId, configDir) {
  return gws('sheets', 'spreadsheets', 'get', { spreadsheetId }, configDir);
}

async function getValues(spreadsheetId, range, configDir) {
  return gws('sheets', 'spreadsheets values', 'get', { spreadsheetId, range }, configDir);
}

module.exports = { getSpreadsheet, getValues };
