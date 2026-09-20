import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sync = readFileSync(new URL('../sync.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const watchdog = readFileSync(new URL('../app-watchdog.js', import.meta.url), 'utf8');

assert.match(sync, /const AUTH_BOOTSTRAP_TIMEOUT_MS=10000/, 'Sesjonssjekken må ha en tydelig tidsgrense');
assert.match(sync, /function getSessionWithTimeout\(\)/, 'Sesjonssjekken må være pakket i en recovery-funksjon');
assert.match(sync, /Promise\.race\(\[sb\.auth\.getSession\(\)/, 'getSession må ikke kunne holde oppstarten fast');
assert.match(sync, /id="retryBootstrap"/, 'Innloggingsgaten må tilby nytt forsøk etter timeout');
assert.match(sync, /Innloggingen tok for lang tid\. Prøv igjen\./, 'Timeout må forklares for brukeren');
assert.match(sync, /showLogin:\(message=''\)=>authChoice\(message\)/, 'Oppstartsvakten må kunne åpne vanlig innlogging uten å vente på en sesjon');
assert.match(watchdog, /function isLoadingGate\(el\)/, 'Oppstartsvakten må gjenkjenne en fastlåst lasteskjerm');
assert.match(watchdog, /window\.FlytSync\?\.showLogin/, 'En synlig lasteskjerm må kunne gå direkte til innlogging');
assert.match(watchdog, /setTimeout\(rescue,3000\)/, 'Fastlåst lasting må få recovery raskt');
assert.match(index, /sync\.js\?v=20260920-startupfailsafe2/, 'Nettleseren må hente den nye synk-rettingen');
assert.match(index, /app-watchdog\.js\?v=20260920-startupfailsafe2/, 'Nettleseren må hente den nye oppstartsvakten');

console.log('ok - fastlåst sesjonssjekk åpner innlogging med nytt forsøk');
