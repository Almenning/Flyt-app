/* Source-locked English Words exact-flag review V3. NEVER active without explicit opt-in.
 * Crops the actual Grovanova Home v16 artwork (not a newly generated
 * wooden plank) and reconstructs ONLY the embedded English label and
 * NOTHING inside the original illustrated Union Jack / round medallion. All other source RGB pixels are kept unchanged.
 * The original source image, existing Words button and routes remain intact.
 */
(function(){
 'use strict';
 const SOURCE='./assets/home-v16/laria-grovanova-v16-landscape-original.png';
 const LOCKED_SHA='9019d2d7be86d0f96d59770c0d141b935b1c4195fecc4e1dcfbf531ce226e028';
 const CROP=Object.freeze({x:43,y:531,width:307,height:82});
 const OUTLINE=[[6,47],[11,33],[18,20],[29,11],[45,5],[64,4],
  [266,4],[279,9],[290,20],[303,36],[306,45],[297,57],
  [283,70],[269,79],[58,80],[38,76],[23,65],[13,56]];
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
   // Restrict alterations to the OLD 'Engelsk' lettering. The image
   // is a photograph-like bitmap, not a layered asset, so source pixels
   // below the old ink cannot be recovered. Derive a clean wood fill from
   // unlettered strips on THIS SAME approved source bitmap.
   let rebuilt=0;
   for(let y=20;y<=70;y++)for(let x=138;x<=283;x++){
    const fx=Math.min((x-138)/5,(283-x)/5,1);
    const fy=Math.min((y-20)/5,(70-y)/5,1);
    const blend=clamp(Math.min(fx,fy),0,1);
    if(blend===0)continue;
    const t=(x-137)/147,smooth=t*t*(3-2*t);
    const dst=(y*w+x)*4,left=(y*w+136)*4,right=(y*w+286)*4;
    const cleanRow=13+(y%6);
    const clean=(cleanRow*w+x)*4;
    for(let k=0;k<3;k++){
     let sum=0;
     for(let xx=136;xx<286;xx++)sum+=original[(cleanRow*w+xx)*4+k];
     const grain=original[clean+k]-sum/150;
     const fill=(1-smooth)*original[left+k]+smooth*original[right+k]+grain*.18;
     pixels.data[dst+k]=Math.round((1-blend)*original[dst+k]+blend*fill);
    }
    rebuilt++;
   }
   // Original UK-flag medallion is kept intact. It cannot be
   // 100% source-identical if we redraw an ABC icon on top.
   const replacedIconPixels=0;
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
    const x=i%w,y=Math.floor(i/w);
    const originalRoundMedal=(x-88)*(x-88)+(y-47)*(y-47)<35*35;
    pixels.data[off+3]=blue&&!originalRoundMedal?0:mattePixels[off+3];
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
   button.style.setProperty('aspect-ratio','307 / 82','important');
   button.style.setProperty('min-height','84px','important');
   button.style.setProperty('padding','0','important');
   button.style.setProperty('border','0','important');
   button.style.setProperty('border-radius','0','important');
   button.style.setProperty('box-shadow','none','important');
   const label=button.querySelector(':scope > .ki-plank-name');
   if(label){
    label.style.setProperty('position','absolute','important');
    label.style.setProperty('left','40%','important');
    label.style.setProperty('right','5%','important');
    label.style.setProperty('top','50%','important');
    label.style.setProperty('transform','translateY(-54%)','important');
    label.style.setProperty('width','auto','important');
    label.style.setProperty('font','900 clamp(35px,3.65vw,45px)/1.03 Georgia,"Times New Roman",serif','important');
    label.style.setProperty('color','#281708','important');
    label.style.setProperty('text-shadow','0 1px 0 #f6ca7a','important');
    label.style.setProperty('text-align','center','important');
   }
   const medal=button.querySelector(':scope > .laria-wooden-sign-medallion');
   if(medal){
    // Keep the PHOTO-GRAPHIC flag, not an artificial new medal layer.
    medal.textContent='';
    medal.setAttribute('aria-hidden','true');
    medal.style.setProperty('background','none','important');
    medal.style.setProperty('display','none','important');
    medal.style.setProperty('visibility','hidden','important');
   }
   button.dataset.lariaWordsArt='source-english-flag-v3';
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
 window.LariaSourceExactSignV3=Object.freeze({version:'review-v3-source-flag',sourceSha256:LOCKED_SHA,crop:CROP,apply});
})();