const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appDir = path.resolve(__dirname, '../laer-litt-mer');
const read = name => fs.readFileSync(path.join(appDir, name), 'utf8');

test('learning world uses layered 2.5D presentation without changing the journey model', () => {
  const js = read('journey-world-premium.js');
  const css = read('journey-world-premium.css');

  assert.match(js, /premium-world-depth-ready/);
  assert.match(js, /data-world-depth="0\.14"/);
  assert.match(js, /data-world-depth="0\.42"/);
  assert.match(js, /data-world-depth="0\.82"/);
  assert.match(js, /journeyRouteOverlay\(config,route,nextIndex\)/);
  assert.match(js, /installWorldDepthMotion\(host\)/);
  assert.match(js, /keepCurrentMissionVisible\(host,geo\)/);
  assert.match(js, /premium-world-back/);
  assert.match(css, /2\.5D foundation v1/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(js, /journeyLandmarkMarkup\\(subject,node,i,done,next,future\\)/);
  assert.match(js, /premium-landmark-/);
  assert.match(css, /Premium landmarks v1/);
  assert.match(css, /premium-place-state-badge/);
  assert.doesNotMatch(js, /THREE\.|WebGLRenderer|three\.js/i);
});

test('2.5D assets are cache-busted consistently for the PWA', () => {
  const html = read('index.html');
  const sw = read('sw.js');

  assert.match(html, /journey-world-premium\.css\?v=20261004-landmarks1/);
  assert.match(html, /journey-world-premium\.js\?v=20261004-landmarks1/);
  assert.match(sw, /journey-world-premium\.css\?v=20261004-landmarks1/);
  assert.match(sw, /journey-world-premium\.js\?v=20261004-landmarks1/);
  assert.match(sw, /laer-litt-mer-v21-premium-landmarks-2026-10-04/);
});
