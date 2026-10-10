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
  {name:'bokskogen-locked-20261010.png',source:'image-gen-2(20261010-113506).png',size:3308204,sha256:'5fc16c5e4d7dfc397ac8d6e7883ad111443ce33df6acfd2dacab776936ef5506'},
  {name:'tallenga-locked-20261010.png',source:'image-gen-3(20261010-113511).png',size:3220364,sha256:'68f595b2bfb2a37206b23200ec3854feb9b6134a112bab3957e5df21098d8879'},
  {name:'ordlandsbyen-locked-20261010.png',source:'image-gen-4(20261010-113516).png',size:3284439,sha256:'c03e1f9abbdb582aa55d6473167e86ced8dce0b07196d810a2fb88bd77dd6da9'},
  {name:'nordlysleiren-locked-20261010.png',source:'image-gen-5(3).png',size:3224987,sha256:'7f6ddd6649d813601e9c1bef8e2373e779ee97469ca5392be0e6dd146f38f32f'}
];
const errors=[],evidence=[];
function error(message){
  errors.push(message);
  console.error('::error title=Læria originalgrafikk::'+message);
}
for(const {name,source,size,sha256} of expected){
  const file=path.join(artDir,name);
  if(!fs.existsSync(file)){
    error('Mangler '+name+' (opprinnelig fil: '+source+')');
    continue;
  }
  const buf=fs.readFileSync(file);
  const header=buf.subarray(0,8).toString('hex');
  if(buf.length!==size)error(name+': uventet filstørrelse '+buf.length+' (forventet '+size+')');
  const digest=crypto.createHash('sha256').update(buf).digest('hex');
  if(digest!==sha256)error(name+': SHA-256 avviker fra bibliotekoriginalen');
  if(header!=='89504e470d0a1a0a'||buf.subarray(12,16).toString('ascii')!=='IHDR'){
    error(name+': må være den uendrede original-PNG-en');
    continue;
  }
  const width=buf.readUInt32BE(16),height=buf.readUInt32BE(20),depth=buf[24];
  if(width!==941||height!==1672||depth!==8)
    error(name+': bildeflaten skal være 941 × 1672 og 8 bit, men er '+width+' × '+height+' / '+depth);
  evidence.push({name,source,bytes:buf.length,sha256:digest});
}
const overview=path.join(artDir,'image-gen-1(20261010-113502).png');
if(!fs.existsSync(overview))error('Mangler samlet QA-referanse image-gen-1(20261010-113502).png');
else{
  const buf=fs.readFileSync(overview),digest=crypto.createHash('sha256').update(buf).digest('hex');
  if(buf.length!==3381817||digest!=='a02e331f7df5fcd0df3e4ed9238c4ef04dcac1bfd26bb7f56190f20594a400f8'||buf.readUInt32BE(16)!==1122||buf.readUInt32BE(20)!==1402)
    error('Samlet QA-referanse er ikke byte-identisk med image-gen-1(20261010-113502).png');
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
