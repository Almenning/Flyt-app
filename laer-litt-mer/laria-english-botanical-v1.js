/* Læria Premium 3: actual flower foreground from approved Grovanova pixels.
 * REVIEW-ONLY ?lariaEnglishSignGroupCandidate=5.
 *
 * Unlike vegetation v1's faint copy of the same Kinnaklova background,
 * this layer places two real, original painterly flower clusters IN FRONT
 * of the two wooden post feet. Original Grovanova remains byte-for-byte
 * untouched and its SHA-256 is verified before any foreground is rendered.
 *
 * NO generated flowers, gradients, CSS leaves, or external image providers.
 * The painterly plant pixels are copied unchanged; only their transparency,
 * scale and position are new, and therefore require visual owner sign-off.
 */
(function(){
 'use strict';
 const SOURCE='./assets/home-v16/laria-grovanova-v16-landscape-original.png';
 const SHA='9019d2d7be86d0f96d59770c0d141b935b1c4195fecc4e1dcfbf531ce226e028';
 const CROPS=Object.freeze([
  Object.freeze({x:300,y:690,w:114,h:150}),
  Object.freeze({x:292,y:718,w:121,h:135})
 ]);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const set=(el,k,v)=>el.style.setProperty(k,v,'important');
 const hex=buffer=>Array.from(new Uint8Array(buffer),n=>n.toString(16).padStart(2,'0')).join('');
 let flowerPromise=null;
 async function verifiedFlowerSource(){
  if(!crypto?.subtle)throw Error('SHA-256 support required for locked Grovanova source');
  const response=await fetch(SOURCE,{cache:'force-cache'});
  if(!response.ok)throw Error('Locked Grovanova flower source missing: '+response.status);
  const bytes=await response.arrayBuffer();
  const digest=hex(await crypto.subtle.digest('SHA-256',bytes));
  if(digest!==SHA)throw Error('Original Grovanova flower source SHA mismatch');
  const blobURL=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
  try{
   const im=new Image();im.src=blobURL;await im.decode();
   if(im.naturalWidth!==1448||im.naturalHeight!==1086)
    throw Error('Original Grovanova flower source dimensions changed');
   // Freeze a local canvas copy so the temporary Blob URL can be released.
   const canvas=document.createElement('canvas');
   canvas.width=1448;canvas.height=1086;
   canvas.getContext('2d').drawImage(im,0,0);
   return canvas;
  }finally{URL.revokeObjectURL(blobURL);}
 }
 const flowerSource=()=>flowerPromise||(flowerPromise=verifiedFlowerSource().catch(error=>{
  flowerPromise=null;throw error;
 }));
 function paintCluster(source,ctx,w,h,crop,offsetX,top,width,height,mirror){
  const temp=document.createElement('canvas');temp.width=width;temp.height=height;
  const t=temp.getContext('2d',{willReadFrequently:true});
  if(!t)throw Error('Botanical source rasterizer unavailable');
  if(mirror){
   t.translate(width,0);t.scale(-1,1);
  }
  t.drawImage(source,crop.x,crop.y,crop.w,crop.h,0,0,width,height);
  const pixels=t.getImageData(0,0,width,height);
  let visible=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const at=(y*width+x)*4;
   const red=pixels.data[at],green=pixels.data[at+1],blue=pixels.data[at+2];
   const nx=x/width,ny=y/height;
   const topShape=.02+.085*Math.sin(nx*12+(mirror?1.2:0))+
    .04*Math.sin(nx*28+(mirror?2:0))+.018*Math.cos(nx*59);
   const start=clamp((ny-topShape)/.18,0,1);
   const side=clamp((1.075-Math.abs((nx-.5)/.5))/.23,0,1);
   const bottom=clamp((1-ny)/.15,0,1);
   const ellipse=clamp((1.11-Math.hypot((nx-.5)/.58,(ny-.51)/.56))/.28,0,1);
   const leaf=green>blue*1.04&&green>red*.71;
   const flower=red>170&&green>135&&blue>100&&red>green*1.10;
   const strength=flower?.97:leaf?.88:.48;
   const alpha=start*side*bottom*ellipse*strength;
   pixels.data[at+3]=Math.round(alpha*245);
   if(alpha>.17)visible++;
  }
  t.putImageData(pixels,0,0);
  ctx.drawImage(temp,offsetX,top,width,height);
  return visible;
 }
 async function mount(nav){
  if(!nav||nav.dataset.lariaBotanicalForeground)return false;
  nav.dataset.lariaBotanicalForeground='loading';
  try{
   const posts=nav.querySelector(':scope > .laria-english-source-posts');
   const last=nav.querySelector(':scope > button[data-ki="reading"]');
   const world=nav.closest('#kinnaklova-world');
   if(!posts||!last||!world||world.dataset.kiArt!=='ready'||
      nav.dataset.lariaEnglishPostsVariant!=='2'||
      nav.dataset.lariaEnglishSourceGroup!=='ready')
    throw Error('Verified premium English 3-board source group required');
   const art=await window.LariaSourceExactSignV3?.getArt?.();
   if(!art||art.sourceSha!==SHA||nav.dataset.lariaEnglishSourceSha!==SHA)
    throw Error('Signs and flowers do not share the locked Grovanova source SHA');
   const source=await flowerSource();
   if(!nav.isConnected)return false;
   const canvas=document.createElement('canvas');
   canvas.className='laria-english-botanical-foreground';
   canvas.setAttribute('aria-hidden','true');
   set(canvas,'position','absolute');set(canvas,'inset','0');
   set(canvas,'display','block');set(canvas,'width','100%');
   set(canvas,'height','100%');set(canvas,'pointer-events','none');
   set(canvas,'user-select','none');
   posts.appendChild(canvas);
   let lastGeometry='';
   function render(){
    if(!posts.isConnected||!canvas.isConnected)return;
    const root=posts.getBoundingClientRect();
    const lastBoard=last.getBoundingClientRect();
    const w=Math.round(root.width),h=Math.round(root.height);
    if(w<180||h<150||w>1600||h>1500)throw Error('Botanical canvas dimensions unsafe');
    const key=[w,h,Math.round(root.left),Math.round(root.top),
     Math.round(lastBoard.bottom)].join(',');
    if(lastGeometry===key)return;
    const start=lastBoard.bottom-root.top+3;
    const remaining=h-start;
    if(remaining<30)throw Error('No separate foot space for source flowers');
    const clusterH=Math.round(Math.min(84,remaining-1,h*.24));
    const clusterW=Math.round(Math.min(122,Math.max(63,w*.335)));
    const top=Math.round(start);
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)throw Error('Botanical foreground canvas unavailable');
    let copied=0;
    for(let i=0;i<2;i++){
     const centre=w*(i===0?.264:.765);
     const x=Math.round(centre-clusterW*.5);
     copied+=paintCluster(source,ctx,w,h,CROPS[i],x,top,
      clusterW,clusterH,i===1);
    }
    if(copied<450)throw Error('Original source botanical foreground too sparse');
    canvas.dataset.originalSha=SHA;
    canvas.dataset.sourceRectangles=CROPS.map(c=>[c.x,c.y,c.w,c.h].join(':')).join(',');
    canvas.dataset.source='grovanova-v16-original-flowers';
    canvas.dataset.paintedPixels=String(copied);
    canvas.dataset.rootStart=String(top);
    canvas.dataset.paintHeight=String(clusterH);
    nav.dataset.lariaBotanicalForeground='ready';
    lastGeometry=key;
   }
   render();
   if(typeof ResizeObserver==='function'){
    const observer=new ResizeObserver(()=>{
     if(!canvas.isConnected){observer.disconnect();return;}
     lastGeometry='';
     try{render();}catch(error){
      nav.dataset.lariaBotanicalForeground='blocked';
      nav.dataset.lariaBotanicalReason=String(error?.message||error);
      console.error('[Læria] botanical foreground resize blocked',error);
     }
    });
    observer.observe(nav);
   }
   return true;
  }catch(error){
   nav.dataset.lariaBotanicalForeground='blocked';
   nav.dataset.lariaBotanicalReason=String(error?.message||error);
   console.error('[Læria] source-original flower foreground blocked',error);
   return false;
  }
 }
 window.LariaEnglishBotanical=Object.freeze({version:'review-v1',sourceSha256:SHA,mount});
})();