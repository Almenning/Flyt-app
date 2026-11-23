/* Læria English: opt-in vegetation occlusion for the shared two-post rail.
 * Brings EXISTING Kinnaklova scene pixels in front of the two post feet.
 * Neither the approved painting nor the original sign artwork is edited.
 * No generated plants, external assets, copied scenery, or clickable layer.
 */
(function(){
 'use strict';
 const set=(el,name,value)=>el.style.setProperty(name,value,'important');
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const number=(s,def)=>{const v=parseFloat(s);return Number.isFinite(v)?v:def;};
 function positionPercent(computed){
  const tokens=computed.split(/\s+/);
  return {x:clamp(number(tokens[0],50)/100,0,1),
   y:clamp(number(tokens[1]||tokens[0],50)/100,0,1)};
 }
 async function mount(nav){
  if(!nav||nav.dataset.lariaVegetationOcclusion)return false;
  nav.dataset.lariaVegetationOcclusion='loading';
  const stage=nav.closest('.ki-stage');
  const master=stage?.querySelector('.ki-master');
  const posts=nav.querySelector(':scope > .laria-english-source-posts');
  if(!stage||!master||!posts||
     nav.dataset.lariaEnglishPostsVariant!=='2'||
     nav.dataset.lariaEnglishSourceGroup!=='ready'){
   nav.dataset.lariaVegetationOcclusion='blocked';
   nav.dataset.lariaVegetationReason='Verified source sprite and ready stage required';
   return false;
  }
  try{
   const original=await window.LariaSourceExactSignV3?.getArt?.();
   if(!original?.postPngV2||original.sourceSha!==nav.dataset.lariaEnglishSourceSha)
    throw Error('SHA-verified original Kinnaklova sign source unavailable');
   await master.decode();
   if(master.naturalWidth!==1672||master.naturalHeight!==941)
    throw Error('Approved Kinnaklova master dimensions changed');
   if(!nav.isConnected)return false;
   const sprite=new Image();sprite.src=original.postPngV2;await sprite.decode();
   const canvas=document.createElement('canvas');
   canvas.className='laria-english-vegetation-occlusion';
   canvas.setAttribute('aria-hidden','true');
   set(canvas,'display','block');set(canvas,'position','absolute');
   set(canvas,'inset','0');set(canvas,'width','100%');set(canvas,'height','100%');
   set(canvas,'pointer-events','none');set(canvas,'user-select','none');
   posts.appendChild(canvas);
   let lastSize='';
   function draw(){
    if(!canvas.isConnected||!nav.isConnected)return;
    const postRect=posts.getBoundingClientRect();
    const imageRect=master.getBoundingClientRect();
    const last=nav.querySelector(':scope > button[data-ki="reading"]')?.getBoundingClientRect();
    const css=getComputedStyle(master);
    if(!last||postRect.width<50||postRect.height<50||
      css.objectFit!=='cover')throw Error('Unexpected English stage layout/paint mode');
    const w=Math.max(1,Math.round(postRect.width));
    const h=Math.max(1,Math.round(postRect.height));
    if(w>1600||h>1500)throw Error('Unexpected canvas dimensions');
    const key=[w,h,Math.round(postRect.left),Math.round(postRect.top),
     Math.round(imageRect.width),Math.round(imageRect.height)].join(',');
    if(key===lastSize)return;
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)throw Error('Foreground occlusion canvas unavailable');
    const imageScale=Math.max(imageRect.width/master.naturalWidth,
      imageRect.height/master.naturalHeight);
    const pos=positionPercent(css.objectPosition);
    const paintedW=master.naturalWidth*imageScale;
    const paintedH=master.naturalHeight*imageScale;
    const originX=imageRect.left-postRect.left+(imageRect.width-paintedW)*pos.x;
    const originY=imageRect.top-postRect.top+(imageRect.height-paintedH)*pos.y;
    // Reconstruct precisely the pixel crop already painted in the stage.
    // This is a foreground copy of the SAME approved artwork, in place,
    // with alpha ONLY over the wooden post ends.
    ctx.drawImage(master,originX,originY,paintedW,paintedH);
    const background=ctx.getImageData(0,0,w,h);
    const postCanvas=document.createElement('canvas');
    postCanvas.width=w;postCanvas.height=h;
    const pc=postCanvas.getContext('2d',{willReadFrequently:true});
    pc.drawImage(sprite,0,0,w,h);
    const timber=pc.getImageData(0,0,w,h).data;
    const rootY=clamp(Math.round(last.bottom-postRect.top+4),0,h-10);
    const rootDepth=Math.max(10,h-rootY);
    let pixels=0,woodFootPixels=0,visibleWood=0;
    for(let y=0;y<h;y++){
     for(let x=0;x<w;x++){
      const i=(y*w+x)*4;
      const woodAlpha=timber[i+3]/255;
      // Protect the plank and all original post caps; only the bottom
      // portions below the final sign may be hidden behind local foliage.
      if(woodAlpha<.025||y<rootY){background.data[i+3]=0;continue;}
      woodFootPixels++;
      const noise=3.2*Math.sin(x*.14+y*.025)+
        2.1*Math.sin(x*.34-y*.047)+1.6*Math.sin(x*.65+y*.03);
      const progress=clamp((y-rootY-noise)/rootDepth,0,1);
      const r=background.data[i],g=background.data[i+1],b=background.data[i+2];
      // No synthetic green pixels. The only opaque pixels are existing
      // forest/grass/shrub pixels selected from the approved source itself.
      const foliage=clamp((g-b+15)/70,0,1)*
        clamp((g-r*.48+8)/75,0,1);
      const base=clamp((progress-.08)/.92,0,1);
      const cover=clamp(Math.pow(base,1.18)*(.36+.64*foliage),0,1);
      const opacity=progress>.975?1:cover;
      background.data[i+3]=Math.round(opacity*woodAlpha*255);
      if(opacity>.12){pixels++;visibleWood++;}
     }
    }
    if(woodFootPixels<180||pixels<35)
     throw Error('Occlusion did not find usable post feet or foliage');
    ctx.putImageData(background,0,0);
    canvas.dataset.source='kinnaklova-approved-master-pixels';
    canvas.dataset.occludedPixels=String(pixels);
    canvas.dataset.footPixels=String(woodFootPixels);
    canvas.dataset.rootY=String(rootY);
    canvas.dataset.masterWidth=String(master.naturalWidth);
    canvas.dataset.masterHeight=String(master.naturalHeight);
    nav.dataset.lariaVegetationOcclusion='ready';
    lastSize=key;
   }
   draw();
   // Keep pixel-perfect scene alignment if the iPad rotates without reload.
   if(typeof ResizeObserver==='function'){
    const observer=new ResizeObserver(()=>{
     if(!canvas.isConnected){observer.disconnect();return;}
     lastSize='';
     try{draw();}catch(error){
      nav.dataset.lariaVegetationOcclusion='blocked';
      console.error('[Læria] vegetation overlay resize failed',error);
     }
    });
    observer.observe(stage);
    observer.observe(nav);
   }
   return true;
  }catch(error){
   nav.dataset.lariaVegetationOcclusion='blocked';
   nav.dataset.lariaVegetationReason=String(error?.message||error);
   console.error('[Læria] approved-source vegetation occlusion blocked',error);
   return false;
  }
 }
 window.LariaEnglishVegetation=Object.freeze({version:'review-v1',mount});
})();