import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const sync = readFileSync(new URL('../sync.js', import.meta.url), 'utf8');
const setup = readFileSync(new URL('../setup-v2.js', import.meta.url), 'utf8');
const seen = readFileSync(new URL('../seen-ui.js', import.meta.url), 'utf8');
const watchdog = readFileSync(new URL('../app-watchdog.js', import.meta.url), 'utf8');

assert.match(sync, /Mer flyt\. Mer oss\./, 'Innloggingen skal forklare produktverdien tydelig');
assert.match(sync, /Fordel det som må gjøres, se det den andre bidrar med/, 'Innloggingen skal beskrive kjerneflyten');
assert.doesNotMatch(sync, /function shell\(inner\).*Privat beta/, 'Førsteinntrykket skal ikke ledes av beta-status');
assert.match(index, /For hverdagen dere deler/, 'Den første lastetilstanden skal bruke produktets tone');
assert.match(index, /function loadingView\(\)/, 'Treg lasting skal ha en kontrollert reservevisning');
const render = index.match(/function render\(\)\{[^\n]+/)?.[0] || '';
assert.match(render, /loadingView\(\)/, 'Reservevisningen skal brukes mens en modul lastes');
assert.doesNotMatch(render, /\|\|home|\bseen\b,\s*rewards/, 'Utdaterte produktsider skal ikke brukes som reservevisning');

assert.match(setup, /Velg hvor mye dere vil starte med\. Alt kan tilpasses senere\./, 'Førstegangsoppsettet skal være rolig og enkelt');
assert.match(setup, /Et rolig utgangspunkt for de fleste hjem/, 'Anbefalt oppsett skal beskrives uten systemspråk');
assert.match(setup, /Dere kan starte nå og finjustere når behovet oppstår\./, 'Oppsettet skal invitere til en rask start');
assert.match(watchdog, /setup-v2\.js\?v=20260922-investor-polish1/, 'Oppdatert oppsett må lastes uten gammel cache');

const sendPicker = seen.match(/if\(sheet\.kind==='send'\)[^\n]+/)?.[0] || '';
assert.match(sendPicker, /seenSendGrid/, 'Sett-velgeren skal ha en samlet, kontrollert layout');
assert.match(sendPicker, /Velg hva slags beskjed du vil sende\./, 'Sett-velgeren skal ha kort og konkret veiledning');
assert.doesNotMatch(sendPicker, /<div class="ey">Sett<\/div>/, 'Sett-velgeren skal ikke ha en overflødig eyebrow');
assert.equal((sendPicker.match(/seenSendOption/g) || []).length, 1, 'Sett-velgeren skal bruke én konsistent valgkomponent');

console.log('ok - investorpolering beskytter førsteinntrykk og reservevisninger');
