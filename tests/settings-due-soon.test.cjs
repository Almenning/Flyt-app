const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('Innstillinger lar husholdningen styre På tide', () => {
  const source = fs.readFileSync(path.join(root, 'settings-ui.js'), 'utf8');
  assert.match(source, /data-settings-due-soon/);
  assert.match(source, /data-settings-due-soon-master/);
  assert.match(source, /data-settings-due-soon-task/);
  assert.match(source, /data-settings-due-soon-reset/);
  assert.match(source, /appPreferences\?\.household\?\.dueSoon/);
  assert.match(source, /Vis «På tide» i Gjøre/);
  assert.match(source, /Tilbakestill til anbefalte valg/);
  assert.match(source, /task\.type==='flex'\|\|task\.type==='period'/);
});

test('På tide-preferanser påvirker ikke selve oppgavedataene', () => {
  const source = fs.readFileSync(path.join(root, 'settings-ui.js'), 'utf8');
  assert.match(source, /household:\{\.\.\.\(s\.appPreferences\?\.household\|\|\{\}\),dueSoon:/);
  assert.doesNotMatch(source.match(/function setDueSoonTask[\s\S]*?function resetDueSoonTasks/)?.[0] || '', /s\.tasks\s*=/);
});
