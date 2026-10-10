'use strict';
/* Release gate for the FOUR original, approved 10 October 2026 PNGs.
 *
 * The normal journey interaction tests intentionally use a synthetic test
 * decoder and must remain GREEN while the artwork is unavailable. This
 * separate PR-only job stays RED until original art is imported and the
 * human reference review has deliberately enabled production rendering.
 * Never regenerate, crop, substitute or promote the older *-verden.png art.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..','laer-litt-mer');
const artDir=path.join(root,'locked-journeys');
const expected=[
  {name:'bokskogen-locked-20261010.png',source:'image-gen-2(20261010-113506).png',size:3308204},
  {name:'tallenga-locked-20261010.png',source:'image-gen-3(20261010-113511).png',size:3220364},
  {name:'ordlandsbyen-locked-20261010.png',source:'image-gen-4(20261010-113516).png',size:3284439},
  {name:'nordlysleiren-locked-20261010.png',source:'image-gen-5(3).png',size:3224987}
];
const errors=[],evidence=[];
function error(message){
  errors.push(message);
  console.error('::error title=Læria originalgrafikk::'+message);
}
for(const {name,source,size} of expected){
  const file=path.join(artDir,name);
  if(!fs.existsSync(file)){
    error('Mangler '+name+' (opprinnelig fil: '+source+')');
    continue;
  }
  const buf=fs.readFileSync(file);
  const header=buf.subarray(0,8).toString('hex');
  if(buf.length!==size)error(name+': uventet filstørrelse '+buf.length+' (forventet '+size+')');
  if(header!=='89504e470d0a1a0a'||buf.subarray(12,16).toString('ascii')!=='IHDR'){
    error(name+': må være den uendrede original-PNG-en');
    continue;
  }
  const width=buf.readUInt32BE(16),height=buf.readUInt32BE(20),depth=buf[24];
  if(width!==941||height!==1672||depth!==8)
    error(name+': bildeflaten skal være 941 × 1672 og 8 bit, men er '+width+' × '+height+' / '+depth);
  evidence.push({name,source,bytes:buf.length,sha256:crypto.createHash('sha256').update(buf).digest('hex')});
}
const renderer=fs.readFileSync(path.join(root,'locked-journey-renderer.js'),'utf8');
const enabled=/const ORIGINAL_SOURCE_IMAGES_VERIFIED\s*=\s*true\s*;/.test(renderer);
if(!enabled){
  error('Originalene er ikke aktivert. Sammenlign ekte Safari-skjermbilder på iPhone/iPad med den låste referansen før ORIGINAL_SOURCE_IMAGES_VERIFIED settes til true.');
}
const summary=[
  '## Læria – låste reisekart: publiseringssperre',
  '',
  errors.length?'**BLOKKERT:** originalillustrasjoner er ikke ferdig importert og godkjent.':'**Kildekontroll bestått:** manuell visuell referansekontroll og funksjonstester må likevel være dokumentert.',
  '',
  '| Original | SHA-256 fra GitHub |',
  '| --- | --- |',
  ...evidence.map(x=>'| '+x.name+' | `'+x.sha256+'` |'),
  '',
  ...(errors.length?['### Mangler',...errors.map(x=>'- '+x),'']:[]),
  'Riktige bildefiler og oversiktsreferanse: `laer-litt-mer/locked-journeys/README.md`.',
  '',
  'Et grønt resultat alene **erstatter ikke** side-ved-side-kontroll av faktisk skjermbilde mot de godkjente bildene fra 10.10.2026.',
  ''
].join('\n');
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
if(errors.length){
  console.error('BLOKKERT: '+errors.length+' krav ikke oppfylt. Ikke flett PR #84.');
  process.exitCode=1;
}else{
  console.log('Alle originale kildefiler er kontrollert og referansegjengivelse er aktivert; kontroller også manuell visuell godkjenning.');
}
