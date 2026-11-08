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
 if(digest!==a.cleanSha256||digest===a.lockedSha256)errors.push(name+': art is identical to old painted UI or SHA differs');
 if(a.ownerApproved!==true)errors.push(name+': owner has not accepted the clean illustration');
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
