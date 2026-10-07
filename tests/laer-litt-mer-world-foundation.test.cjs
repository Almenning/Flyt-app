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

test('2.5D assets are cache-busted in HTML while the PWA install stays lightweight', () => {
  const html = read('index.html');
  const sw = read('sw.js');

  const assetVersion=(source,asset)=>{
    const needle=asset+'?v=';
    const at=source.indexOf(needle);
    if(at<0)return null;
    return source.slice(at+needle.length).split(/["'\\s>]/,1)[0]||null;
  };
  for(const asset of ['journey-world-premium.css','journey-world-premium.js','bokskogen-world.css','bokskogen-world.js','world-atlas.css']){
    const htmlVersion=assetVersion(html,asset);
    assert.ok(htmlVersion,asset+' is missing a cache-busted HTML reference');
  }
  assert.match(sw, /const CACHE=['"]laria-runtime-[^'"]+perf\d+['"]/);
  assert.match(sw, /caches\.match\(req\)/);
  assert.match(sw, /if\(cached\)return cached/);
  assert.doesNotMatch(sw, /journey-world-premium\.(?:css|js)|bokskogen-atlas32\.webp|lia-fox-explorer\.webp/);
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
  assert.match(read('bokskogen-world.js'), /bok-v15-fox/);
  assert.match(read('bokskogen-world.css'), /Bokskogen v14/);
  assert.match(read('world-atlas.css'), /bok-v15-fox-bubble/);
  assert.match(read('bokskogen-world.js'), /function modularScene\(\)/);
  assert.match(read('bokskogen-world.js'), /bok-v15-landmark/);
  assert.doesNotMatch(read('bokskogen-world.js'), /bokskogen-verden\.png/);
  assert.match(read('bokskogen-world.css'), /Modular Bokskogen v15/);
  assert.doesNotMatch(read('sw.js'), /bokskogen-verden\.png/);
});
