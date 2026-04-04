'use strict';

/**
 * Replace all {{key}} placeholders in content with values from the map.
 */
function resolvePlaceholders(content, placeholderMap) {
  let result = content;
  for (const [key, value] of Object.entries(placeholderMap)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }
  return result;
}

/**
 * Check for any remaining unresolved {{...}} markers.
 */
function findUnresolvedMarkers(content) {
  const matches = content.match(/\{\{[^}]+\}\}/g);
  return matches || [];
}

module.exports = { resolvePlaceholders, findUnresolvedMarkers };
