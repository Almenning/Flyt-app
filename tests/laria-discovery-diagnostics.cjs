'use strict';
/* Test-only preload. Preserve every assertion and timeout; record the actual
   camera and polygon visibility when an offscreen-card check times out. */
const fs = require('node:fs');
const path = require('node:path');
const playwright = require('playwright');
const output = process.env.DISCOVERY_GLOBE_SCREENSHOTS || '/tmp/laria-discovery-globe-phase1';
let captureIndex = 0;
async function capture(page) {
  try {
    return await page.evaluate(() => {
      const canvas = document.getElementById('globe-canvas');
      const screen = document.getElementById('world-screen');
      const w = canvas?._cssW || 0, h = canvas?._cssH || 0;
      const radius = Math.min(w, h) * .455;
      const country = typeof countries !== 'undefined' ? countries.td : null;
      const project = point => {
        const p = globeProject(point[0], point[1], w, h);
        if (!p) return null;
        return {point, depth: p[2], normalizedRadius: radius ? Math.hypot(p[0]-w/2,p[1]-h/2)/radius : null};
      };
      const projected = country?.geometry && typeof geometryPolygons === 'function'
        ? geometryPolygons(country.geometry).flatMap(poly => poly.flatMap(ring => ring.map(project))).filter(Boolean) : [];
      projected.sort((a,b) => a.normalizedRadius-b.normalizedRadius);
      return {
        camera: {lon: globeLon, lat: globeLat, zoom: globeZoom}, selected: globeSelected,
        preview: window.__lariaDiscoveryGlobePreview, interacting: window.__lariaGlobeInteracting,
        pointers: typeof globePointers === 'undefined' ? null : globePointers.size,
        mode: typeof globeMode === 'undefined' ? null : globeMode,
        rendererMatches: window.drawGlobe === window.LARIA_DISCOVERY_GLOBE_DRAW,
        screen: {...screen?.dataset}, canvas: {...canvas?.dataset},
        bitmap: {w,h}, bounds: canvas?.getBoundingClientRect().toJSON(),
        card: document.getElementById('globe-status')?.innerText,
        chadAnchor: country ? project([country.lon,country.lat]) : null,
        nearestChadVertices: projected.slice(0,3),
        paintError: window.__lariaDiscoveryGlobeLastError || null
      };
    });
  } catch (error) { return {diagnosticError: String(error)}; }
}
for (const name of ['chromium','webkit']) {
  const engine = playwright[name];
  const launch = engine.launch.bind(engine);
  engine.launch = async (...launchArgs) => {
    const browser = await launch(...launchArgs);
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async (...contextArgs) => {
      const context = await newContext(...contextArgs);
      const newPage = context.newPage.bind(context);
      context.newPage = async (...pageArgs) => {
        const page = await newPage(...pageArgs);
        const wait = page.waitForFunction.bind(page);
        page.waitForFunction = async (...waitArgs) => {
          if (!/globeSelected\s*===\s*null/.test(String(waitArgs[0]))) return wait(...waitArgs);
          const before = await capture(page);
          try {
            const result = await wait(...waitArgs);
            console.log('OFFSCREEN_CARD_PASS', name, JSON.stringify({viewport: page.viewportSize(), before}));
            return result;
          } catch (error) {
            const after = await capture(page);
            const evidence = {engine:name, viewport:page.viewportSize(), before, after, failure:String(error)};
            console.error('OFFSCREEN_CARD_FAILURE', JSON.stringify(evidence));
            try {
              fs.mkdirSync(output,{recursive:true});
              const stem = path.join(output,name+'-offscreen-failure-'+(++captureIndex));
              fs.writeFileSync(stem+'.json',JSON.stringify(evidence,null,2));
              await page.screenshot({path:stem+'.png',animations:'disabled',timeout:5000});
            } catch (captureError) { console.error('OFFSCREEN_EVIDENCE_ERROR',String(captureError)); }
            throw error;
          }
        };
        return page;
      };
      return context;
    };
    return browser;
  };
}
