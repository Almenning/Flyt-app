'use strict';
/* Real-app iPad layout regression. This supplements, not replaces, the existing
 * Finn ordene drag/tap, persistence and legacy Ordjakt regression matrix. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium, webkit } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = process.env.FIND_WORDS_SCREENSHOTS || '/tmp/laria-find-words';
const seed = {
  version: 7, progressSchemaVersion: 3,
  profile: { grade: 2, onboarded: true, name: 'Eventyrbarn', avatar: 'girl', setupVersion: 2 },
  mastery: {}, mistakes: {}, skillMastery: {}, skillMistakes: {}, skillLastSeen: {},
  masteryEvidence: {}, skillEvidence: {}, preferences: { sound: false, autoRead: false },
  lastMilestone: null, recentCountryWin: null, lastActivity: null,
  journey: { nodes: {}, gradeWins: {}, viewGrades: {} },
  answerLog: [], sessionLog: [], activeSession: null
};
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json'
};

function serve() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      let pathname;
      try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
      catch { response.writeHead(400); response.end(); return; }
      if (pathname.endsWith('/')) pathname += 'index.html';
      const filename = path.resolve(root, '.' + pathname);
      if (!filename.startsWith(root + path.sep)) {
        response.writeHead(403); response.end(); return;
      }
      fs.readFile(filename, (error, buffer) => {
        if (error) { response.writeHead(404); response.end(); return; }
        response.setHeader('Content-Type', mime[path.extname(filename)] || 'application/octet-stream');
        response.setHeader('Cache-Control', 'no-store');
        response.end(buffer);
      });
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve({
      server, url: 'http://127.0.0.1:' + server.address().port + '/laer-litt-mer/?app=laria'
    }));
  });
}

async function inspect(page, name) {
  await page.locator('.fw-scene-image').evaluate(image => image.decode());
  // Observe the settled viewport after rotation, not an intermediate frame.
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const layout = await page.evaluate(() => {
    const bounds = selector => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height, right: r.right, bottom: r.bottom };
    };
    return {
      width: innerWidth, height: innerHeight,
      title: bounds('.fw-title h1'), shell: bounds('.fw-shell'), picture: bounds('.fw-picture'),
      sceneBottom: bounds('.fw-scene-bottom'), footer: bounds('.fw-bottom'),
      companion: bounds('.fw-companion'), fox: bounds('.fw-fox-button'),
      speech: bounds('.fw-speech'), next: bounds('.fw-next'),
      words: [...document.querySelectorAll('.fw-word')].map(node => {
        const r = node.getBoundingClientRect();
        const text = node.querySelector('strong');
        return { w: r.width, h: r.height, right: r.right, y: r.top, bottom: r.bottom,
          font: parseFloat(getComputedStyle(text).fontSize) };
      }),
      targets: [...document.querySelectorAll('.fw-object')].map(node => {
        const r = node.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { id: node.dataset.fwObject, reachable: hit === node || node.contains(hit) };
      }),
      svg: document.querySelector('.fw-scene-image').getAttribute('src'),
      guideLabel:document.querySelector('.fw-fox-button')?.getAttribute('aria-label'),
       guideSymbol:document.querySelector('.fw-fox')?.textContent?.trim(),
       avatar:(()=>{try{return JSON.parse(localStorage.getItem('laerlittmer-v2'))?.profile?.avatar||null}catch{return null}})(),
       guideHit:(()=>{
         const button=document.querySelector('.fw-fox-button');
         const r=button?.getBoundingClientRect();
         if(!r)return false;
         const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
         return hit===button||button.contains(hit);
       })()
    };
  });
  // Save failing frames too. Without this, the first failing device disappears
  // from the artifact precisely when its visual evidence is most useful.
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, name + '.json'), JSON.stringify(layout, null, 2));
  await page.screenshot({ path: path.join(output, name + '.png'), fullPage: false, animations: 'disabled' });
  for (const key of ['title', 'picture', 'fox', 'speech', 'next']) {
    const r = layout[key];
    assert.ok(r && r.y >= -1 && r.x >= -1 && r.right <= layout.width + 1 && r.bottom <= layout.height - 6,
      name + ': ' + key + ' is cut off or has no breathing room: ' + JSON.stringify(layout));
  }
  assert.ok(Math.abs(layout.picture.w / layout.picture.h - 5 / 3) < 0.01,
    name + ': original image/hotspot geometry was changed');
  assert.equal(layout.targets.length, 8, name + ': expected eight scene objects');
  assert.ok(layout.targets.every(target => target.reachable),
    name + ': scene objects became unreachable: ' + JSON.stringify(layout.targets));
  assert.ok(layout.words.every(word => word.h >= 44 && word.font >= 16 && word.right <= layout.width + 1),
    name + ': unreadable or clipped word targets: ' + JSON.stringify(layout.words));
  assert.equal(layout.avatar,'girl',name+': removing the fox changed the saved profile');
   assert.equal(layout.guideLabel,'Få et hint',name+': accessible hint label changed');
   assert.equal(layout.guideSymbol,'✦',name+': Eggenipa magic helper is missing');
   assert.ok(layout.guideHit&&layout.fox.w>=44&&layout.fox.h>=44,
     name+': magical hint control has blocked or undersized touch: '+JSON.stringify(layout));
  if (layout.height > layout.width) {
    const gap = layout.companion.y - layout.sceneBottom.bottom;
    assert.ok(gap >= 0 && gap <= 32,
      name + ': unnecessary empty space separates the fox from the scene: ' + gap);
    const emptyPanelTail = layout.shell.bottom - layout.footer.bottom;
    assert.ok(emptyPanelTail >= 0 && emptyPanelTail <= 28,
      name + ': oversized blank panel remains below the companion: ' + emptyPanelTail);
    assert.ok(layout.picture.w >= layout.width * 0.83, name + ': portrait picture shrank');
    assert.ok(layout.shell.bottom <= layout.height - 8,
      name + ': the panel border is still outside the portrait screen: ' + JSON.stringify(layout.shell));
    assert.ok(layout.words.every(word => word.h >= 54 && word.font >= 20),
      name + ': portrait fit was achieved by shrinking the learning words');
    assert.ok(layout.fox.h >= 44,
      name + ': portrait magical hint control is too small');
  }
  return layout;
}

async function run(engine, name, size, url) {
  const browser = await engine.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: size, hasTouch: true, reducedMotion: 'reduce', serviceWorkers: 'block'
    });
    await context.addInitScript(profile => localStorage.setItem('laerlittmer-v2', JSON.stringify(profile)), seed);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://raw.githubusercontent.com/**', route => route.abort());
    await page.route('https://api.worldbank.org/**', route => route.abort());
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.LARIA_FOX && typeof window.openFindTheWords === 'function');
    await page.evaluate(() => window.openFindTheWords());
    await inspect(page, name + '-forest');
    await page.locator('.fw-word[data-fw-read="sol"]').click();
    await page.locator('.fw-hint').click();
    await page.locator('.fw-fox-button').click();
    await inspect(page, name + '-forest-hint');
    await page.locator('.fw-next').click();
    const garden = await inspect(page, name + '-garden');
    assert.match(garden.svg, /find-the-words-garden-premium\.webp/, name + ': premium garden scene did not load');
    await page.locator('.fw-word[data-fw-read="sommerfugl"]').click();
    await page.locator('.fw-hint').click();
    await page.locator('.fw-fox-button').click();
    await inspect(page, name + '-garden-hint');
    await page.setViewportSize({ width: size.height, height: size.width });
    await inspect(page, name + '-garden-rotated');
    assert.equal(await page.locator('.fw-word[data-fw-read="sommerfugl"]').getAttribute('aria-pressed'), 'true',
      name + ': orientation change lost the chosen word');
    await page.locator('.fw-object[data-fw-object="sommerfugl"]').click();
    assert.equal(await page.locator('.fw-word.is-found').count(), 1,
      name + ': selected word was not playable after rotating');
    await page.setViewportSize(size);
    await inspect(page, name + '-garden-rotated-back');
    assert.equal(await page.locator('.fw-word.is-found').count(), 1,
      name + ': rotating back lost the found word');
    await page.locator('.fw-back').click();
    assert.equal(await page.locator('#find-the-words-overlay:not([hidden])').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), '');
    assert.deepEqual(errors, [], name + ': runtime errors');
    await context.close();
    console.log('PASS Finn ordene tablet layout ' + name);
  } finally { await browser.close(); }
}

(async () => {
  const { server, url } = await serve();
  try {
    await run(webkit, 'tablet-webkit-820', { width: 820, height: 1180 }, url);
    await run(webkit, 'tablet-webkit-768', { width: 768, height: 1024 }, url);
    await run(webkit, 'tablet-webkit-810', { width: 810, height: 1080 }, url);
    await run(chromium, 'tablet-chromium-1180', { width: 1180, height: 820 }, url);
  } finally { await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
