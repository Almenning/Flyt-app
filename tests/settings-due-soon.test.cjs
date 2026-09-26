const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('settings-ui parses and exposes På tide controls', () => {
  const source = fs.readFileSync(path.join(root, 'settings-ui.js'), 'utf8');
  assert.doesNotThrow(() => new Function(source));
  assert.match(source, /data-settings-due-soon/);
  assert.match(source, /data-settings-due-soon-master/);
  assert.match(source, /data-settings-due-soon-task/);
  assert.match(source, /data-settings-due-soon-reset/);
  assert.match(source, /Vis «På tide» i Gjøre/);
  assert.match(source, /Tilbakestill til anbefalte valg/);
  assert.match(source, /appPreferences\?\.household\?\.dueSoon/);
});

test('På tide-valg lagres som husholdningspreferanser', () => {
  const source = fs.readFileSync(path.join(root, 'settings-ui.js'), 'utf8');
  assert.match(source, /function saveDueSoonPrefs/);
  assert.match(source, /taskOverrides/);
  assert.match(source, /window\.FlytSync\?\.queueSave/);
});
