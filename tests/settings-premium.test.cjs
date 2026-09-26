const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('Innstillinger har tydelig premium-hierarki for handlingsrader', () => {
  const source = fs.readFileSync(path.join(root, 'settings-ui.js'), 'utf8');
  assert.doesNotThrow(() => new Function(source));
  assert.match(source, /Tilpass HverdagsOss til dere\./);
  assert.match(source, /\.flytSettingsLink span\{display:grid;gap:4px/);
  assert.match(source, /\.flytSettingsLink strong\{display:block/);
  assert.match(source, /\.flytSettingsLink\{min-height:64px/);
  assert.match(source, /Gjøremål, rytme og poeng\./);
  assert.match(source, /Velg hvilke gjøremål som kan foreslås\./);
  assert.doesNotMatch(source, /Forslag til anerkjennelse|Mine personlige forslag|Historikk i Sett/, 'Sett-innstillingene skal ikke love gamle eller dupliserte funksjoner');
});

test('Premium-polish beholder eksisterende innstillingshandlinger', () => {
  const source = fs.readFileSync(path.join(root, 'settings-ui.js'), 'utf8');
  for (const marker of ['data-settings-task-setup','data-settings-due-soon','data-settings-toggle','data-settings-history','data-settings-rewards']) {
    assert.match(source, new RegExp(marker));
  }
});
