const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'settings-ui.js'), 'utf8');

test('På tide kan slås av direkte i Innstillinger > Gjøre', () => {
  assert.match(source, /flytSettingsDueSoonMaster/);
  assert.match(source, /data-settings-due-soon-master/);
  assert.match(source, /Vis forslag i Dag-visningen/);
  assert.match(source, /dueSoonPrefs\(s\)\.enabled/);
});

test('valg av På tide-gjøremål er fortsatt tilgjengelig separat', () => {
  assert.match(source, /Velg forslag/);
  assert.match(source, /data-settings-due-soon/);
  assert.match(source, /Velg hvilke gjøremål som kan foreslås/);
});

test('masterbryteren finnes bare i hovedvisningen, ikke som duplikat i På tide-undersiden', () => {
  const markup = source.match(/function dueSoonSettingsMarkup\(\)[\s\S]*?function openDueSoonSettings/)?.[0] || '';
  assert.doesNotMatch(markup, /dueSoonMasterMarkup\(\)/);
});
