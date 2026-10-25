'use strict';

/*
 * Læria's three approved forest trolls are identity-locked references.
 * These ORIGINAL flattened WebP files are not puppet rigs and must never
 * be silently regenerated, overwritten, auto-segmented or promoted into
 * a fake "living" character.
 *
 * New production-quality layered art belongs under a NEW versioned path,
 * with an explicit side-by-side art approval. Keep these originals byte-for-byte.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const originals = Object.freeze({
  storesoster: '5d5f80c15e367bbd4600013057c7820a7b2e2adb',
  lillesoster: '661107cd231a72b14aeca4f7bc3c826130734576',
  lillebror: '5f92c89319ec372b980c75eb3d538a4f4f851a7c',
});

for (const [name, expected] of Object.entries(originals)) {
  const file = path.join(root, 'laer-litt-mer', 'assets', 'skogstroll', name + '.webp');
  assert(fs.existsSync(file), 'Locked original is missing: ' + file);
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', name + ' must be genuine WebP');
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP', name + ' must be genuine WebP');
  const gitBlobSha = crypto.createHash('sha1')
    .update('blob ' + bytes.length + '\0')
    .update(bytes)
    .digest('hex');
  assert.equal(gitBlobSha, expected,
    'LOCKED CHARACTER IDENTITY CHANGED: ' + name +
    '. Do not replace the approved character; create a separately reviewed rig asset.');
  console.log('PASS locked troll original: ' + name + ' ' + gitBlobSha);
}
