const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'recurrence-ui.js'), 'utf8');

test('På tide? er lukket som standard uten teller', () => {
  assert.match(source, /dueSoonOpen=false/);
  assert.match(source, /function resetDueSoonSession\(\)\{dueSoonOpen=false/);
  assert.match(source, /label:'På tide\?'/);
  const item = source.match(/accordion\(\)\?\.item\?\.\(\{key:'due-soon'[\s\S]*?\}\)/)?.[0] || '';
  assert.doesNotMatch(item, /count:/);
});

test('På tide? skjules når det ikke finnes aktuelle forslag', () => {
  assert.match(source, /if\(!items\.length\)return''/);
});
