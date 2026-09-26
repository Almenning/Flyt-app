const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'settings-ui.js'), 'utf8');

test('På tide-oppsettet er eksplisitt navngitt i Innstillinger', () => {
  assert.match(source, /Gjøremål i På tide/);
  assert.doesNotMatch(source, /<strong>Velg forslag<\/strong>/);
  assert.match(source, /Velg hvilke gjøremål som kan foreslås/);
});

test('På tide-oppsettet dempes når funksjonen er slått av, men forblir tilgjengelig', () => {
  assert.match(source, /flytSettingsDueSoonConfigure/);
  assert.match(source, /dueSoonPrefs\(s\)\.enabled\?'':'isMuted'/);
  assert.match(source, /flytSettingsDueSoonConfigure\.isMuted/);
  assert.match(source, /data-settings-due-soon/);
});
