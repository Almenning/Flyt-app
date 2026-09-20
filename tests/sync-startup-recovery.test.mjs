import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sync = readFileSync(new URL('../sync.js', import.meta.url), 'utf8');
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(sync, /const AUTH_BOOTSTRAP_TIMEOUT_MS=10000/, 'Sesjonssjekken må ha en tydelig tidsgrense');
assert.match(sync, /function getSessionWithTimeout\(\)/, 'Sesjonssjekken må være pakket i en recovery-funksjon');
assert.match(sync, /Promise\.race\(\[sb\.auth\.getSession\(\)/, 'getSession må ikke kunne holde oppstarten fast');
assert.match(sync, /id="retryBootstrap"/, 'Innloggingsgaten må tilby nytt forsøk etter timeout');
assert.match(sync, /Innloggingen tok for lang tid\. Prøv igjen\./, 'Timeout må forklares for brukeren');
assert.match(index, /sync\.js\?v=20260920-authrecovery1/, 'Nettleseren må hente oppstartsrettingen');

console.log('ok - fastlåst sesjonssjekk åpner innlogging med nytt forsøk');
