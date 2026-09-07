import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sync = readFileSync(new URL('../sync.js', import.meta.url), 'utf8');

assert.match(sync, /function syncInfo\(\)/, 'Synk må ha én sentral statusvurdering');
for (const label of ['Lagrer…', 'Lagret', 'Venter på nett', 'Ikke lagret']) {
  assert.match(sync, new RegExp(label), `Synkstatus må kunne vise ${label}`);
}
assert.match(sync, /id="syncRetry"/, 'Feilet lagring må kunne prøves på nytt');
assert.match(sync, /window\.addEventListener\('online'/, 'Appen må forsøke igjen når nettet kommer tilbake');
assert.match(sync, /HverdagsOss/, 'Synklaget må bruke nytt appnavn i synlige flater');

console.log('ok - synkstatus forklarer lagring, nettutfall og nytt forsøk');
