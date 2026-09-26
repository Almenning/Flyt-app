import {cp, mkdir, readdir, rm} from 'node:fs/promises';
import {extname, join} from 'node:path';

const root = process.cwd();
const output = join(root, 'www');
const staticExtensions = new Set(['.html', '.js', '.webmanifest']);

await rm(output, {force: true, recursive: true});
await mkdir(output, {recursive: true});

for (const entry of await readdir(root, {withFileTypes: true})) {
  if (entry.isFile() && staticExtensions.has(extname(entry.name))) {
    await cp(join(root, entry.name), join(output, entry.name));
  }
}

for (const directory of ['icons', 'vendor']) {
  await cp(join(root, directory), join(output, directory), {recursive: true});
}

console.log('Copied local HverdagsOss web assets to www/.');
