'use strict';
/* D2 image acceptance gate. Runs separately while PR #124 is DRAFT.
 * Never replace missing painterly artwork with blurred card art or a
 * mirrored/stretched portion of the original 941x1672 journeys. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..','laer-litt-mer');
const images={
 norwegian:'bokskogen',math:'tallenga',
 english:'ordlandsbyen',geography:'nordlysleiren'
};
const errors=[];
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
 if(!fs.existsSync(asset)){
  errors.push(subject+': MISSING artist-approved extension '+path.relative(root,asset));
  continue;
 }
 try{
  const {width,height}=dimensions(fs.readFileSync(asset));
  if(width!==941||height<425)errors.push(subject+': required width 941px, height at least 425px; got '+width+'x'+height);
 }catch(e){errors.push(subject+': '+e.message);}
}
if(errors.length){
 console.error('LÆRIA D2 ART QUALITY GATE NOT READY. The four original maps are intact. Do not merge this draft PR.\n'+errors.join('\n'));
 process.exitCode=1;
}else{
 console.log('D2 art dimensions present. This is not visual approval: inspect actual WebKit map-edge screenshots before merging.');
}
