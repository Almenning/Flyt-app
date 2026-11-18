#!/usr/bin/env node
'use strict';
// Import only the two exact owner-approved Grovanova WebP exports.
// This tool deliberately STAGES the images; it NEVER activates them.
// Usage: node tools/laria_grovanova_import_approved.cjs /path/to/unzipped/candidates
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const catalogPath=path.join(root,'docs/LARIA-GROVANOVA-APPROVED-CANDIDATES-2026-11-18.json');
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));

function exactWebpDimensions(buf){
 if(buf.length<30||buf.toString('ascii',0,4)!=='RIFF'||
    buf.toString('ascii',8,12)!=='WEBP'||buf.toString('ascii',12,16)!=='VP8 ')
  throw Error('Expected a standard VP8 WebP, not an unrelated or changed image');
 if(buf[23]!==0x9d||buf[24]!==0x01||buf[25]!==0x2a)
  throw Error('Invalid VP8 image frame header');
 return [buf.readUInt16LE(26)&0x3fff,buf.readUInt16LE(28)&0x3fff];
}

function plan(sourceDir){
 if(!sourceDir)throw Error('Supply the directory containing the two approved *_candidate.webp files');
 if(catalog.status!=='owner-approved-visual-direction-awaiting-in-app-acceptance')
  throw Error('Unexpected catalog status');
 return ['portrait','landscape'].map(orientation=>{
  const entry=catalog[orientation];
  const file=path.resolve(sourceDir,entry.sourcePackageName);
  const bytes=fs.readFileSync(file);
  const sha=crypto.createHash('sha256').update(bytes).digest('hex');
  if(sha!==entry.sha256)throw Error(orientation+': SHA-256 mismatch; do not substitute or re-export the approved file');
  const [width,height]=exactWebpDimensions(bytes);
  if(width!==entry.width||height!==entry.height)
   throw Error(orientation+': pixel dimensions mismatch');
  const target=path.resolve(root,entry.path);
  const allowed=path.join(root,'laer-litt-mer','assets','home-v15')+path.sep;
  if(!target.startsWith(allowed))throw Error('Unsafe asset path');
  const manifest=path.join(allowed,'grovanova-ipad-'+orientation+'-master.json');
  if(!fs.existsSync(manifest))throw Error('The separate '+orientation+' gate is absent');
  return {orientation,entry,bytes,target,manifest};
 });
}

function main(){
 const sourceDir=process.argv[2];
 const stage=process.argv.includes('--stage');
 const records=plan(sourceDir); // both validated BEFORE any file is written
 for(const r of records){
  if(stage){
   fs.writeFileSync(r.target,r.bytes,{flag:'w'});
   // All technical metadata may be staged, but NEVER turn on approval here.
   const inactive={status:'awaiting-app-screenshot-approval',
    source:'./assets/home-v15/'+path.basename(r.target),
    sha256:r.entry.sha256,width:r.entry.width,height:r.entry.height,
    ui:r.entry.ui,note:'Owner-approved visual candidate. Not activated until actual iPad QA and product-owner acceptance of application screenshots.'};
   fs.writeFileSync(r.manifest,JSON.stringify(inactive,null,2)+'\n');
  }
  console.log(r.orientation+': SHA-256 verified '+r.entry.sha256+
    ' '+r.entry.width+'x'+r.entry.height+(stage?' [STAGED, NOT ACTIVATED]':' [VERIFY ONLY]'));
 }
 if(!stage)console.log('Pass --stage only in the intended Git checkout to copy exact assets. It will NOT activate either.');
}

if(require.main===module)main();
module.exports={exactWebpDimensions,plan};
