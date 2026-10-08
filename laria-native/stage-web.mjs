import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const source=resolve(here,'..','laer-litt-mer');
const target=join(here,'www');

if(!existsSync(join(source,'index.html')))throw new Error('Læria web source is missing');
rmSync(target,{recursive:true,force:true});
mkdirSync(target,{recursive:true});
cpSync(source,target,{recursive:true});
console.log('Staged Læria web assets into laria-native/www');
