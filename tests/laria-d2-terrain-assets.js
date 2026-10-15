'use strict';
/* D2 image acceptance gate. Runs separately while PR #124 is DRAFT.
 * Never replace missing painterly artwork with blurred card art or a
 * mirrored/stretched portion of the original 941x1672 journeys. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..','laer-litt-mer');
const images={
 norwegian:'bokskogen',math:'tallenga',
 english:'ordlandsbyen',geography:'nordlysleiren'
};
const errors=[];
const approvalPath=path.join(root,'assets','locked-journey-ground-approval.json');
const approval=JSON.parse(fs.readFileSync(approvalPath,'utf8'));
if(approval.schemaVersion!==1||approval.releaseStatus!=='approved_for_integration'){
 errors.push('Release approval is pending. Artwork dimensions alone are NOT premium signoff.');
}
function githubBlobSha(buffer){
 return crypto.createHash('sha1').update('blob '+buffer.length+'\\0').update(buffer).digest('hex');
}

function dimensions(buffer){
 if(buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WEBP')throw Error('not a WebP image');
 let pos=12;
 while(pos+8<=buffer.length){
  const type=buffer.toString('ascii',pos,pos+4);
  const size=buffer.readUInt32LE(pos+4);
  const data=pos+8;
  if(data+size>buffer.length)throw Error('truncated WebP chunk');
  if(type==='VP8X'){
   return {width:1+buffer.readUIntLE(data+4,3),height:1+buffer.readUIntLE(data+7,3)};
  }
  if(type==='VP8 '){
   if(buffer[data+3]!==0x9d||buffer[data+4]!==0x01||buffer[data+5]!==0x2a)throw Error('invalid VP8 frame');
   return {width:buffer.readUInt16LE(data+6)&0x3fff,height:buffer.readUInt16LE(data+8)&0x3fff};
  }
  if(type==='VP8L'){
   if(buffer[data]!==0x2f)throw Error('invalid VP8L frame');
   const bits=buffer.readUInt32LE(data+1);
   return {width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};
  }
  pos=data+size+(size&1);
 }
 throw Error('missing WebP frame');
}
for(const [subject,name] of Object.entries(images)){
 const original=path.join(root,'locked-journeys',name+'-locked-20261010.png');
 const asset=path.join(root,'assets','locked-journey-ground',name+'-ground-v1.webp');
 assert(fs.existsSync(original),subject+' approved original removed');
 const entry=approval.subjects?.[subject];
 assert(entry&&entry.lockedOriginal===name+'-locked-20261010.png'&&entry.asset===name+'-ground-v1.webp',
  subject+' approved image identity is inconsistent');
 const originalBlob=githubBlobSha(fs.readFileSync(original));
 if(originalBlob!==entry.lockedOriginalGitBlob){
  errors.push(subject+': ORIGINAL MAP CHANGED! Expected git blob '+entry.lockedOriginalGitBlob+', got '+originalBlob);
 }

 if(!fs.existsSync(asset)){
  errors.push(subject+': MISSING artist-approved extension '+path.relative(root,asset));
  continue;
 }
 try{
  const bytes=fs.readFileSync(asset),{width,height}=dimensions(bytes);
  if(width!==941||height<425)errors.push(subject+': required width 941px, height at least 425px; got '+width+'x'+height);
  const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
  if(!entry.visualApproval||!entry.assetSha256||sha256!==entry.assetSha256){
   errors.push(subject+': artwork has not passed explicit, checksum-bound visual approval');
  }

 }catch(e){errors.push(subject+': '+e.message);}
}
if(errors.length){
 console.error('LÆRIA D2 ART QUALITY GATE NOT READY. The four original maps are intact. Do not merge this draft PR.\n'+errors.join('\n'));
 process.exitCode=1;
}else{
 console.log('D2 four original paintings are immutable. Four new 941px assets have visual approval and exact checksum matches. Still recheck latest head WebKit screenshots before merge.');
}
