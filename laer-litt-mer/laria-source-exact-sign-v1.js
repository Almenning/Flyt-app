/* Source-locked Words review V1. NEVER active without explicit opt-in.
 * Crops the actual Grovanova Home v16 artwork (not a newly generated
 * wooden plank) and reconstructs ONLY the embedded Norwegian label and
 * book-glyph centre. All other source RGB pixels are kept unchanged.
 * The original source image, existing Words button and routes remain intact.
 */
(function(){
 'use strict';
 const SOURCE='./assets/home-v16/laria-grovanova-v16-landscape-original.png';
 const LOCKED_SHA='9019d2d7be86d0f96d59770c0d141b935b1c4195fecc4e1dcfbf531ce226e028';
 const CROP=Object.freeze({x:43,y:342,width:306,height:97});
 const OUTLINE=[[3,54],[8,42],[20,30],[31,24],[45,17],[64,15],
  [86,18],[110,21],[145,24],[165,25],[195,27],[223,30],
  [250,32],[271,35],[284,40],[296,49],[302,57],[295,69],
  [283,84],[271,90],[250,92],[65,93],[45,90],[30,85],
  [17,77],[8,64]];
 let cached=null;
 const clamp=(value,lo,hi)=>Math.min(hi,Math.max(lo,value));
 const toHex=bytes=>Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
 async function checkedOriginal(){
  if(!globalThis.crypto?.subtle)throw Error('Secure SHA-256 verification required for the locked illustration');
  const response=await fetch(SOURCE,{cache:'force-cache'});
  if(!response.ok)throw Error('Locked Grovanova original could not be loaded: '+response.status);
  const buffer=await response.arrayBuffer();
  const digest=toHex(await crypto.subtle.digest('SHA-256',buffer));
  if(digest!==LOCKED_SHA)throw Error('Locked Grovanova bytes changed, stop review preview');
  const blobUrl=URL.createObjectURL(new Blob([buffer],{type:'image/png'}));
  try{
   const picture=new Image();
   picture.src=blobUrl;
   await picture.decode();
   if(picture.naturalWidth!==1448||picture.naturalHeight!==1086)
    throw Error('Locked Grovanova original dimensions changed');
   return picture;
  }finally{ /* Retained until drawImage completes; released by caller. */ }
 }
 async function render(){
  const picture=await checkedOriginal();
  try{
   const w=CROP.width,h=CROP.height;
   const canvas=document.createElement('canvas');
   canvas.width=w;canvas.height=h;
   const context=canvas.getContext('2d',{willReadFrequently:true});
   if(!context)throw Error('Source-pixel canvas is unavailable');
   context.drawImage(picture,CROP.x,CROP.y,w,h,0,0,w,h);
   const pixels=context.getImageData(0,0,w,h);
   const original=new Uint8ClampedArray(pixels.data);
   const mask=new Uint8Array(w*h);
   for(let y=22;y<78;y++)for(let x=138;x<252;x++){
    const i=(y*w+x)*4,r=original[i],g=original[i+1],b=original[i+2];
    if(r<155&&g<122&&b<83)mask[y*w+x]=1;
   }
   // Dilate only the existing black glyphs and their shadows, not the
   // complete board centre. Neighbour rows keep their original wood grain.
   const expanded=new Uint8Array(w*h);
   for(let y=22;y<78;y++)for(let x=138;x<252;x++)if(mask[y*w+x]){
    for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
     if(dx*dx+dy*dy>10)continue;
     const xx=x+dx,yy=y+dy;
     if(xx>=0&&xx<w&&yy>=0&&yy<h)expanded[yy*w+xx]=1;
    }
   }
   let rebuilt=0;
   for(let y=20;y<81;y++)for(let x=130;x<260;x++)if(expanded[y*w+x]){
    let left=x-1,right=x+1;
    while(left>=130&&expanded[y*w+left])left--;
    while(right<w-24&&expanded[y*w+right])right++;
    left=Math.max(130,left);right=Math.min(w-24,right);
    if(left>=right)continue;
    const t=(x-left)/(right-left);
    const dst=(y*w+x)*4,l=(y*w+left)*4,r=(y*w+right)*4;
    for(let k=0;k<3;k++)pixels.data[dst+k]=Math.round((1-t)*original[l+k]+t*original[r+k]);
    rebuilt++;
   }
   // Preserve the REAL outside relief frame. The old white book occupies
   // this dark inner area, so a NEW ABC icon necessarily requires retouch.
   let replacedIconPixels=0;
   for(let y=26;y<79;y++)for(let x=68;x<122;x++){
    const nearX=clamp(x,75,114),nearY=clamp(y,33,71);
    const radius=Math.hypot(x-nearX,y-nearY);
    if(radius>7.5)continue;
    const blend=clamp((7.5-radius)/2.2,0,1),i=(y*w+x)*4;
    // Use the original medallion's dark wood tonal range, not a flat
    // artificial brown patch. This interior is the ONLY icon retouch.
    const depth=clamp((y-26)/53,0,1);
    const brown=[Math.round(78-23*depth),Math.round(42-16*depth),Math.round(21-9*depth)];
    for(let k=0;k<3;k++)pixels.data[i+k]=Math.round((1-blend)*pixels.data[i+k]+blend*brown[k]);
    replacedIconPixels++;
   }
   // Precisely isolated silhouette (transparent outside the original
   // hand-carved board). Posts remain separate from the interactive board.
   const matte=document.createElement('canvas');
   matte.width=w;matte.height=h;
   const m=matte.getContext('2d',{willReadFrequently:true});
   m.beginPath();
   for(let i=0;i<OUTLINE.length;i++){
    const [x,y]=OUTLINE[i];
    if(i===0)m.moveTo(x,y);else m.lineTo(x,y);
   }
   m.closePath();m.fillStyle='#fff';m.fill();
   const mattePixels=m.getImageData(0,0,w,h).data;
   let exact=0,visible=0;
   for(let i=0;i<w*h;i++){
    const off=i*4;
    // The irregular plank tips touch BLUE fjord/sky pixels in the native
    // photograph. Drop only obvious blue background on these edges rather
    // than painting landscape onto a supposed transparent oak board.
    const blue=original[off+2]>95&&
     original[off+2]>original[off+1]+15&&
     original[off+2]>original[off]+25;
    pixels.data[off+3]=blue?0:mattePixels[off+3];
    if(mattePixels[off+3]>0){
     visible++;
     if(pixels.data[off]===original[off]&&pixels.data[off+1]===original[off+1]&&pixels.data[off+2]===original[off+2])exact++;
    }
   }
   context.putImageData(pixels,0,0);
   return {png:canvas.toDataURL('image/png'),sourceSha:LOCKED_SHA,
    nativeWidth:w,nativeHeight:h,pixelsExactlyCopied:exact,visiblePixels:visible,
    retouchedLetterPixels:rebuilt,retouchedIconAreaPixels:replacedIconPixels};
  }finally{
   if(picture.src.startsWith('blob:'))URL.revokeObjectURL(picture.src);
  }
 }
 function apply(button){
  if(!button?.matches('button[data-ki="words"]'))return Promise.reject(Error('Source sign is limited to Words'));
  button.dataset.lariaSourceArt='loading';
  if(!cached)cached=render().catch(error=>{cached=null;throw error;});
  return cached.then(art=>{
   if(!button.isConnected)return;
   button.style.setProperty('background','url("'+art.png+'") center/100% 100% no-repeat','important');
   button.style.setProperty('width','clamp(310px,33vw,390px)','important');
   button.style.setProperty('height','auto','important');
   button.style.setProperty('aspect-ratio','306 / 97','important');
   button.style.setProperty('min-height','96px','important');
   button.style.setProperty('padding','0','important');
   button.style.setProperty('border','0','important');
   button.style.setProperty('border-radius','0','important');
   button.style.setProperty('box-shadow','none','important');
   const label=button.querySelector(':scope > .ki-plank-name');
   if(label){
    label.style.setProperty('position','absolute','important');
    label.style.setProperty('left','42%','important');
    label.style.setProperty('right','5%','important');
    label.style.setProperty('top','50%','important');
    label.style.setProperty('transform','translateY(-54%)','important');
    label.style.setProperty('width','auto','important');
    label.style.setProperty('font','900 clamp(30px,3.1vw,43px)/1.05 Georgia,"Times New Roman",serif','important');
    label.style.setProperty('color','#281708','important');
    label.style.setProperty('text-shadow','0 1px 0 #f6ca7a','important');
    label.style.setProperty('text-align','center','important');
   }
   const medal=button.querySelector(':scope > .laria-wooden-sign-medallion');
   if(medal){
    medal.textContent='ABC';
    medal.style.setProperty('display','grid','important');
    medal.style.setProperty('place-items','center','important');
    medal.style.setProperty('position','absolute','important');
    medal.style.setProperty('left','21.3%','important');
    medal.style.setProperty('top','51%','important');
    medal.style.setProperty('transform','translateY(-50%)','important');
    medal.style.setProperty('width','18%','important');
    medal.style.setProperty('height','auto','important');
    medal.style.setProperty('aspect-ratio','1','important');
    medal.style.setProperty('min-width','0','important');
    medal.style.setProperty('max-width','none','important');
    medal.style.setProperty('min-height','0','important');
    medal.style.setProperty('max-height','none','important');
    medal.style.setProperty('border','none','important');
    medal.style.setProperty('background','none','important');
    medal.style.setProperty('box-shadow','none','important');
    medal.style.setProperty('font','900 clamp(14px,1.65vw,22px)/1 Georgia,"Times New Roman",serif','important');
    medal.style.setProperty('color','#fff0b4','important');
    medal.style.setProperty('text-shadow','1px 2px 1px #2b160c','important');
   }
   button.dataset.lariaWordsArt='source-original-v1';
   button.dataset.lariaSourceOriginalSha=art.sourceSha;
   button.dataset.lariaSourceCopied=String(art.pixelsExactlyCopied);
   button.dataset.lariaSourceVisible=String(art.visiblePixels);
   button.dataset.lariaSourceArt='ready';
   return art;
  }).catch(error=>{
   button.dataset.lariaSourceArt='blocked';
   button.dataset.lariaSourceError=String(error.message||error);
   console.error('[Læria] Source-original Words pilot blocked',error);
   throw error;
  });
 }
 window.LariaSourceExactSignV1=Object.freeze({version:'review-v1',sourceSha256:LOCKED_SHA,crop:CROP,apply});
})();