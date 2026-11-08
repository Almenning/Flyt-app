#!/usr/bin/env node
'use strict';
// Release readiness is not equivalent to green CSS/source/unit checks.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const s=JSON.parse(fs.readFileSync(path.join(root,'docs/LARIA-PREMIUM-RELEASE-STATE.json'),'utf8'));
const prSha=String(process.env.LARIA_PR_SHA||'').trim();
const errors=[];
const sha40=t=>typeof t==='string'&&/^[a-f0-9]{40}$/i.test(t);
const sha64=t=>typeof t==='string'&&/^[a-f0-9]{64}$/i.test(t);
const file=p=>typeof p==='string'&&p.length&& !path.isAbsolute(p) && !p.split(/[\/]/).includes('..') ?path.join(root,p):null;
const actualSha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
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
 if(!sha40(prSha)||d.prHead!==prSha)errors.push(name+': visual evidence is not from exact release SHA');
 if(!Number.isInteger(d.actionsRun)||d.actionsRun<=0)errors.push(name+': no linkable GitHub Actions visual artifact');
 if(d.chromiumAndWebkit!==true)errors.push(name+': Chromium/WebKit verification incomplete');
 if(d.ownerApproved!==true)errors.push(name+': product-owner visual acceptance missing');
}
if((s.devices?.iphonePortrait?.ownerApproved||s.devices?.iphoneLandscape?.ownerApproved||s.devices?.desktop?.ownerApproved)&&
 (!s.devices?.ipadLandscape?.ownerApproved||!s.devices?.ipadPortrait?.ownerApproved))errors.push('iPad-before-phone review order violated');
if(!sha40(prSha)||s.regression?.greenOnPrHead!==prSha)errors.push('Critical regression checks are not green on release SHA');
if(s.childUsabilityTest!==true)errors.push('Real child usability test is missing');
if(process.argv.includes('--publish')&&(!s.permission?.merge||!s.permission?.publish))
 errors.push('Merge and publishing must both be explicitly approved');
console.log('LÆRIA PREMIUM RELEASE GATE for '+(prSha||'<unknown PR SHA>'));
for(const e of errors)console.error('BLOCKED: '+e);
if(errors.length){console.error(errors.length+' blocking items. Never call this premium-ready.');process.exitCode=1}
else console.log('Candidate passed declared gates. Publish remains separately authorized.');
