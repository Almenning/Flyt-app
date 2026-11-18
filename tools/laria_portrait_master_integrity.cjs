'use strict';
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const rect=value=>Array.isArray(value)&&value.length===4&&value.every(n=>typeof n==='number'&&n>=0&&n<=1)&&
  value[2]>0&&value[3]>0&&value[0]+value[2]<=1&&value[1]+value[3]<=1;
function verify(manifest,root){
 if(manifest.status!=='approved')return {eligible:false,reason:'not-approved'};
 const required=['logo','subjects','journey','nav','adult','liveCopy'];
 if(!manifest.ui||!required.every(key=>rect(manifest.ui[key]))||
    !['sun','water','journeyGlow'].every(key=>rect(manifest.ui.ambient?.[key]))||
    !Array.isArray(manifest.ui.signBoards)||manifest.ui.signBoards.length!==4||!manifest.ui.signBoards.every(rect))
   return {eligible:false,reason:'invalid-ui-safe-areas'};
 if(typeof manifest.source!=='string'||!manifest.source.startsWith('./assets/home-v15/')||
    !/^[a-f0-9]{64}$/i.test(manifest.sha256||'')||manifest.width<2048||manifest.height<2732)
   return {eligible:false,reason:'invalid-metadata'};
 const file=path.resolve(root,'laer-litt-mer',manifest.source.replace(/^\.\//,''));
 if(!file.startsWith(path.resolve(root,'laer-litt-mer/assets/home-v15')+path.sep)||!fs.existsSync(file))
   return {eligible:false,reason:'asset-missing'};
 const actual=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 return actual===manifest.sha256?{eligible:true,reason:'verified'}:{eligible:false,reason:'sha-mismatch'};
}
module.exports={verify};
