import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const sync = readFileSync(new URL('../sync.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const watchdog = readFileSync(new URL('../app-watchdog.js', import.meta.url), 'utf8');
const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

assert.match(sync, /const AUTH_BOOTSTRAP_TIMEOUT_MS=10000/, 'Sesjonssjekken må ha en tydelig tidsgrense');
assert.match(sync, /function getSessionWithTimeout\(\)/, 'Sesjonssjekken må være pakket i en recovery-funksjon');
assert.match(sync, /Promise\.race\(\[sb\.auth\.getSession\(\)/, 'getSession må ikke kunne holde oppstarten fast');
assert.match(sync, /id="retryBootstrap"/, 'Innloggingsgaten må tilby nytt forsøk etter timeout');
assert.match(sync, /Innloggingen tok for lang tid\. Prøv igjen\./, 'Timeout må forklares for brukeren');
assert.match(sync, /showLogin:\(message=''\)=>authChoice\(message\)/, 'Oppstartsvakten må kunne åpne vanlig innlogging uten å vente på en sesjon');
assert.match(watchdog, /function isLoadingGate\(el\)/, 'Oppstartsvakten må gjenkjenne en fastlåst lasteskjerm');
assert.match(watchdog, /window\.FlytSync\?\.showLogin/, 'En synlig lasteskjerm må kunne gå direkte til innlogging');
assert.match(watchdog, /setTimeout\(rescue,3000\)/, 'Fastlåst lasting må få recovery raskt');
assert.match(index, /sync-merge\.js\?v=20260923-revision-sync1/, 'Merge-motoren må lastes før synklaget');
assert.match(index, /sync\.js\?v=20260924-local-sanitization1/, 'Nettleseren må hente den personvernsikre synk- og logout-rettingen');
assert.match(index, /app-watchdog\.js\?v=[^"']+/, 'Nettleseren må hente den aktive oppstartsvakten');
assert.doesNotMatch(index, /cdn\.jsdelivr\.net\/npm\/@supabase/, 'Oppstarten må ikke blokkeres av en ekstern Supabase-CDN');
assert.match(index, /vendor\/supabase-2\.116\.0\.js\?v=20260920-local1" defer/, 'Supabase-klienten må lastes lokalt uten å blokkere HTML-tegning');
assert.ok(existsSync(new URL('../vendor/supabase-2.116.0.js', import.meta.url)), 'Den versjonslåste Supabase-klienten må følge appen');
const resetVersion=index.match(/hverdagsoss_sw_reset_v(\d+)/)?.[1];
const cacheVersion=serviceWorker.match(/const CACHE='flyt-v(\d+)'/)?.[1];
assert.ok(resetVersion&&cacheVersion, 'Service worker reset og cache må være versjonert');
assert.equal(resetVersion, cacheVersion, 'Reset-nøkkelen må følge aktiv service-worker-cache');
assert.match(index, /registration=>registration\.unregister\(\)/, 'Den fastlåste service workeren må faktisk avregistreres');
assert.match(serviceWorker, /const CACHE='flyt-v\d+'/, 'Offline-cachen må være eksplisitt versjonert');
assert.match(serviceWorker, /const NETWORK_TIMEOUT_MS=5000/, 'Service workeren må ha tidsgrense for nettverkskall');
assert.match(serviceWorker, /caches\.match\(req,\{ignoreSearch:true\}\)/, 'Versjonerte statiske filer må kunne hentes fra cache');
assert.match(serviceWorker, /\.\/vendor\/supabase-2\.116\.0\.js/, 'Den lokale Supabase-klienten må være tilgjengelig offline');

console.log('ok - fastlåst sesjonssjekk åpner innlogging med nytt forsøk');
