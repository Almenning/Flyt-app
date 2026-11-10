#!/usr/bin/env node
'use strict';
// Release readiness is not equivalent to green CSS/source/unit checks.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const s=JSON.parse(fs.readFileSync(path.join(root,'docs/LARIA-PREMIUM-RELEASE-STATE.json'),'utf8'));
const prSha=String(process.env.LARIA_PR_SHA||'').trim();
const errors=[];
const sha40=t=>typeof t==='string'&&/^[a-f0-9]{40}$/i.test(t);
const sha64=t=>typeof t==='string'&&/^[a-f0-9]{64}$/i.test(t);
const file=p=>typeof p==='string'&&p.length&& !path.isAbsolute(p) && !p.split(/[\/]/).includes('..') ?path.join(root,p):null;
const actualSha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
// Visual approval is added to the repository AFTER the screenshot was taken.
// That metadata-only commit must not invalidate a real, byte-identical app
// screenshot. Verify Git trees, not self-referential future commit hashes.
function sameProductTree(reviewed,includingTests=false){
 if(!sha40(prSha)||!sha40(reviewed))return false;
 try{
  const folders=includingTests?['laer-litt-mer','tests']:['laer-litt-mer'];
  return folders.every(folder=>{
   const at=ref=>execFileSync('git',['rev-parse',ref+':'+folder],
      {cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
   return at(reviewed)===at('HEAD');
  });
 }catch{return false}
}
if(s.schema!==1||s.product!=='Læria Premium Beta'||s.targetPr!==243)errors.push('Wrong release contract');
if(s.principle!=='Barn har lyst til å åpne Læria, foreldre har tillit.')errors.push('Purpose clause has changed');
for(const name of ['grovanova','kinnaklova']){
 const a=s.art?.[name];if(!a){errors.push(name+': missing art contract');continue}
 const original=file(a.locked);
 if(!original||!fs.existsSync(original)||actualSha(original)!==a.lockedSha256)errors.push(name+': original lock/hash changed');
 const clean=file(a.clean);
 if(!clean||!fs.existsSync(clean)||!sha64(a.cleanSha256)){
   errors.push(name+': independent clean image has not been supplied');continue;
 }
 const digest=actualSha(clean);
 if(digest!==a.cleanSha256||digest===a.lockedSha256){
   errors.push(name+': art is identical to old painted UI or SHA differs');
 }else{
   // An owner-approved artwork must also prove that unchanged parts of the
   // original landscape are pixel-identical. This rejects pretty but WRONG
   // replacement fjords, cliffs or churches. Never approve via SHA alone.
   const offsets=Array.isArray(a.sourcePlacement)?a.sourcePlacement:[0,0];
   if(offsets.length!==2||offsets.some(n=>!Number.isInteger(n)||n<0)){
     errors.push(name+': sourcePlacement must be [x,y] integer pixels');
   }else{
     try{
       execFileSync('python3',[
         'tools/laria_release/verify_clean_candidate.py',
         '--world',name,'--candidate',a.clean,
         '--offset-x',String(offsets[0]),'--offset-y',String(offsets[1])
       ],{cwd:root,encoding:'utf8',timeout:45000,stdio:['ignore','pipe','pipe']});
     }catch(error){
       const why=String(error?.stderr||error?.message||'failed').trim().split('\n').slice(-1)[0];
       errors.push(name+': protected mountain/church pixels or canvas geometry changed: '+why.slice(0,200));
     }
   }
 }
 if(a.ownerApproved!==true)errors.push(name+': owner has not accepted the clean illustration');
}
// Nordlysleiren is a separate release-critical art requirement: the locked
// 1024x704 facade is visibly low-res on iPad. The old 941x1672 journey has
// baked navigation and is not a substitute for a clean, wide subject scene.
const geo=s.art?.nordlysleiren;
if(!geo){
 errors.push('nordlysleiren: missing independent high-resolution art contract');
}else{
 const locked=file(geo.locked);
 if(!locked||!fs.existsSync(locked)||actualSha(locked)!==geo.lockedSha256)
  errors.push('nordlysleiren: original facade lock/hash changed');
 if(!Array.isArray(geo.lockedDimensions)||geo.lockedDimensions.join('x')!=='1024x704')
  errors.push('nordlysleiren: locked original dimensions contract changed');
 const clean=file(geo.clean);
 if(!clean||!fs.existsSync(clean)||!sha64(geo.cleanSha256)){
  errors.push('nordlysleiren: independent clean high-resolution background has not been supplied');
 }else{
  const digest=actualSha(clean);
  if(digest!==geo.cleanSha256||digest===geo.lockedSha256)
   errors.push('nordlysleiren: clean image hash differs or is identical to the compressed original');
  try{
   const result=execFileSync('python3',['-c',
    'from PIL import Image; import sys; im=Image.open(sys.argv[1]); print(im.width,im.height)',
    clean],{cwd:root,encoding:'utf8',timeout:12000,stdio:['ignore','pipe','pipe']}).trim();
   const [w,h]=result.split(/\s+/).map(Number);
   if(!Number.isFinite(w)||!Number.isFinite(h)||w<1600||h<900||
      geo.minWidth!==1600||geo.minHeight!==900)
    errors.push('nordlysleiren: clean wide artwork below minimum 1600x900 quality gate');
  }catch(error){
   errors.push('nordlysleiren: unable to decode clean art image');
  }
 }
 if(geo.ownerApproved!==true)
  errors.push('nordlysleiren: owner has not visually accepted the clean high-resolution illustration');
}

for(const name of ['ipadLandscape','ipadPortrait','iphonePortrait','iphoneLandscape','desktop']){
 const d=s.devices?.[name];
 if(!d){errors.push(name+': missing device report');continue}
 if(!sameProductTree(d.prHead))errors.push(name+': evidence is not from the exact same application/source tree');
 if(!Number.isInteger(d.actionsRun)||d.actionsRun<=0)errors.push(name+': no linkable GitHub Actions visual artifact');
 if(d.chromiumAndWebkit!==true)errors.push(name+': Chromium/WebKit verification incomplete');
 if(d.ownerApproved!==true)errors.push(name+': product-owner visual acceptance missing');
}
if((s.devices?.iphonePortrait?.ownerApproved||s.devices?.iphoneLandscape?.ownerApproved||s.devices?.desktop?.ownerApproved)&&
 (!s.devices?.ipadLandscape?.ownerApproved||!s.devices?.ipadPortrait?.ownerApproved))errors.push('iPad-before-phone review order violated');
if(!sameProductTree(s.regression?.greenOnPrHead,true))errors.push('Critical regressions are not verified for identical app and test source trees');
if(s.childUsabilityTest!==true)errors.push('Real child usability test is missing');
if(process.argv.includes('--publish')&&(!s.permission?.merge||!s.permission?.publish))
 errors.push('Merge and publishing must both be explicitly approved');
console.log('LÆRIA PREMIUM RELEASE GATE for '+(prSha||'<unknown PR SHA>'));
for(const e of errors)console.error('BLOCKED: '+e);
if(errors.length){console.error(errors.length+' blocking items. Never call this premium-ready.');process.exitCode=1}
else console.log('Candidate passed declared gates. Publish remains separately authorized.');
