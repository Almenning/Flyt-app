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
  assert.match(js, /journeyLandmarkMarkup\(subject,node,i,done,next,future\)/);
  assert.match(js, /premium-landmark-/);
  assert.match(css, /Premium landmarks v1/);
  assert.match(css, /premium-place-state-badge/);
  assert.match(js, /journeyAmbientMarkup\(\)/);
  assert.match(js, /premium-world-life/);
  assert.match(js, /has-progress/);
  assert.match(css, /Living world v1/);
  assert.match(css, /premiumFlagWave/);
  assert.match(css, /premiumCloudDriftA/);
  assert.match(js, /premium-world-frontier/);
  assert.match(js, /--focus-x/);
  assert.match(js, /--focus-y/);
  assert.match(css, /Journey frontier v1/);
  assert.match(css, /premiumFrontierPulse/);
  assert.match(js, /--depth-scale/);
  assert.match(js, /--place-z/);
  assert.match(css, /Perspective depth ordering v1/);
  assert.match(css, /var\(--depth-scale,1\)/);
  assert.doesNotMatch(js, /THREE\.|WebGLRenderer|three\.js/i);
});

test('2.5D assets are cache-busted consistently for the PWA', () => {
  const html = read('index.html');
  const sw = read('sw.js');

  assert.match(html, /journey-world-premium\.css\?v=20261004-travel4/);
  assert.match(html, /journey-world-premium\.js\?v=20261004-travel5/);
  assert.match(sw, /journey-world-premium\.css\?v=20261004-travel4/);
  assert.match(sw, /journey-world-premium\.js\?v=20261004-travel5/);
  assert.match(html, /bokskogen-world\.css\?v=20261004-premium14/);
  assert.match(html, /bokskogen-world\.js\?v=20261004-world5/);
  assert.match(sw, /bokskogen-world\.css\?v=20261004-premium14/);
  assert.match(sw, /bokskogen-world\.js\?v=20261004-world5/);
  assert.match(sw, /laer-litt-mer-v28-world-traveler-2026-10-04/);
  assert.match(html, /journeyWasComplete:journeyNodeIsCompleteForWorldReaction/);
  assert.match(html, /function armJourneyWorldReaction\(scope\)/);
  assert.match(read('journey-world-premium.js'), /premium-progress-reaction/);
  assert.match(read('journey-world-premium.css'), /Progression reaction v1/);
  assert.match(read('bokskogen-world.js'), /bok-v13-traveler/);
  assert.match(read('bokskogen-world.css'), /Bokskogen v13/);
  assert.match(read('journey-world-premium.js'), /function animatePremiumTravelerJourney\(host\)/);
  assert.match(read('journey-world-premium.js'), /data-travel-from-x/);
  assert.match(read('journey-world-premium.css'), /Traveler movement v1/);
  assert.match(read('bokskogen-world.js'), /function animateBokskogenTraveler\(host\)/);
  assert.match(read('bokskogen-world.js'), /bok-v14-traveler-character/);
  assert.match(read('bokskogen-world.css'), /Bokskogen v14/);
});
