const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.resolve(__dirname, '..');

test('Min liste bevarer scroll ved lokal rerender', () => {
  const source = fs.readFileSync(path.join(root, 'personal-tasks-ui.js'), 'utf8');
  assert.match(source, /previous=old\.querySelector\('\.privateTaskScroll'\)/);
  assert.match(source, /next\.scrollTop=wasBottom\?max:Math\.min\(pos,max\)/);
  assert.match(source, /overflowAnchor='none'/);
});

test('Mål og belønning bevarer scroll ved valg som rerendrer samme steg', () => {
  const source = fs.readFileSync(path.join(root, 'rewards-ui.js'), 'utf8');
  assert.match(source, /function restoreFlowScroll/);
  assert.match(source, /data-flow-step="\$\{d\.step\}"/);
  assert.match(source, /if\(sameStep\)restoreFlowScroll\(layer\.querySelector\('\.temptationBody'\),previousScroll\)/);
});

test('kritiske hovedvisninger har eksplisitt scrollbevaring ved full rerender', () => {
  const checks = [
    ['home-ui.js', /settleScroll\(c,pos,resetScroll\)/],
    ['seen-ui.js', /content\.scrollTop=resetScroll\?0:/],
    ['setup-v2.js', /body\.scrollTop=target/],
    ['planned-ui.js', /c\.scrollTop=wasBottom\?max:/],
    ['recurrence-ui.js', /settleScroll\(c,pos,resetScroll\)/],
    ['rewards-ui.js', /c\.scrollTop=pos/],
    ['summary-ui.js', /body\.scrollTop=Number\(page\.scrollTop\)\|\|0/],
  ];
  for (const [file, pattern] of checks) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(source, pattern, file + ' mangler forventet scrollbevaring');
  }
});
