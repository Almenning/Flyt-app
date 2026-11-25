/* Review-only sign rail. The locked Grovanova illustration is read, never changed. */
(function(){
 'use strict';
 const SOURCE='./assets/home-v16/laria-grovanova-v16-landscape-original.png';
 const SHA='9019d2d7be86d0f96d59770c0d141b935b1c4195fecc4e1dcfbf531ce226e028';
 const CROP={x:41,y:532,w:315,h:90};
 // Outer wood silhouette only. Do not carry the blue sky, leaves or grass into the rail.
 const OUTLINE=[[82,538],[106,535],[272,535],[326,535],[333,537],[337,541],[343,550],[353,570],[354,575],[350,583],[341,602],[335,609],[327,612],[274,613],[111,620],[77,620],[69,616],[60,606],[50,591],[44,579],[44,574],[52,558],[65,544],[74,539]];
 let cached;
 const icons={words:'ABC',sentences:'<svg viewBox="0 0 24 24"><path d="M3 5h18v12H9l-5 4v-4H3zM7 9h10M7 13h7"/></svg>',reading:'<svg viewBox="0 0 24 24"><path d="M12 6C9 4 5 4 2 5v14c4-1 7-1 10 1m0-14c3-2 7-2 10-1v14c-4-1-7-1-10 1M12 6v14"/></svg>',multiply:'<svg viewBox="0 0 24 24"><path d="M5 5 19 19M19 5 5 19"/></svg>',fraction:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2v10h10M5 19l7-7"/></svg>',table:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',find:'<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M8 10h4M10 8v4"/></svg>',journey:'<svg viewBox="0 0 24 24"><path d="m4 20 8-16 8 16-8-4-8 4z"/><circle cx="12" cy="12" r="2"/></svg>',globe:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c6 5 6 15 0 20M12 2c-6 5-6 15 0 20"/></svg>',country:'<svg viewBox="0 0 24 24"><path d="M5 22V2m0 2c6-3 8 3 15 0v12c-7 3-9-3-15 0"/></svg>'};
 const labels={
  eg:{words:'Ordjakt',find:'Finn ordene',reading:'Lesekroken'},
  tv:{multiply:'Gangemagi',fraction:'Brøklab',table:'Gangetabellen'},
  ki:{words:'Ord',sentences:'Setninger',reading:'Lesing'},
  gv:{journey:'Geografireisen',globe:'Kloden',country:'Land og flagg'}
 };
 const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
 const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
 function canvas(w,h){
  const node=document.createElement('canvas');node.width=w;node.height=h;return node;
 }
 function clip(ctx,points){
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.closePath();ctx.clip();
 }
 function plank(im){
  const {x:ox,y:oy,w,h}=CROP;
  const raw=canvas(w,h),ctx=raw.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(im,ox,oy,w,h,0,0,w,h);
  const pixels=ctx.getImageData(0,0,w,h),original=new Uint8ClampedArray(pixels.data);
  const index=(x,y)=>((y-oy)*w+x-ox)*4;
  // Blend intact grain above and below the original English lettering. The
  // transform touches only this derived plank, not the scene or the wood edge.
  for(let y=552;y<=599;y++)for(let x=183;x<=319;x++){
   const a=clamp(Math.min((x-183)/5,(319-x)/5,(y-552)/4,(599-y)/4));
   const t=clamp((y-550)/51), i=index(x,y);
   const top=index(x,545+((y-552)%6)),base=index(x,600+((y-552)%5));
   for(let k=0;k<3;k++){
    const wood=original[top+k]*(1-t)+original[base+k]*t;
    pixels.data[i+k]=Math.round(original[i+k]*(1-a)+wood*a);
   }
  }
  // Retain the rendered rim and darken the former flag face under a live icon.
  for(let y=549;y<=609;y++)for(let x=100;x<=161;x++){
   const dx=(x-131)/29,dy=(y-578)/28,d=Math.hypot(dx,dy);
   const a=clamp((1.08-d)/.06);if(!a)continue;
   const i=index(x,y),glow=(1-clamp(d)) * 10 - dy*3;
   for(const [k,base] of [48,26,16].entries())
    pixels.data[i+k]=Math.round(original[i+k]*(1-a)+(base+glow)*a);
  }
  ctx.putImageData(pixels,0,0);
  const out=canvas(w,h),art=out.getContext('2d');
  clip(art,OUTLINE.map(([x,y])=>[x-ox,y-oy]));
  art.drawImage(raw,0,0);
  return out.toDataURL('image/png');
 }
 function posts(im){
  const out=canvas(315,290),ctx=out.getContext('2d');
  // Grain is sampled from within the two locked posts, not their surroundings.
  // Separate cap and shaft keeps the tops from stretching with the button stack.
  const pieces=[
   {target:61,width:47,sx:95,sy:721,cap:[100,307,57,43],shape:[[0,17],[7,9],[19,3],[31,0],[43,5],[53,15],[52,36],[50,42],[2,42]]},
   {target:215,width:42,sx:257,sy:709,cap:[257,335,57,49],shape:[[0,18],[9,10],[23,2],[31,1],[43,5],[53,13],[55,23],[53,39],[5,39]]}
  ];
  for(const {target,width,sx,sy,cap,shape} of pieces){
   ctx.save();
   clip(ctx,[[target+3,27],[target+width-3,27],[target+width-1,286],[target+width-5,290],[target+1,290]]);
   for(let y=27;y<290;y+=87)ctx.drawImage(im,sx,sy,27,30,target,y,width,88);
   ctx.restore();
   ctx.save();clip(ctx,shape.map(([x,y])=>[target+x*width/57,y*.85]));
   ctx.drawImage(im,...cap,target,0,width,cap[3]*.85);ctx.restore();
  }
  return out.toDataURL('image/png');
 }
 async function source(){
  if(cached)return cached;
  cached=(async()=>{
   const response=await fetch(SOURCE,{cache:'force-cache'});
   if(!response.ok)throw Error('Locked Grovanova source unavailable');
   const bytes=await response.arrayBuffer();
   if(!crypto.subtle||hex(await crypto.subtle.digest('SHA-256',bytes))!==SHA)
    throw Error('Locked Grovanova checksum mismatch');
   const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));
   try{
    const image=new Image();image.src=url;await image.decode();
    return {board:plank(image),posts:posts(image)};
   }finally{URL.revokeObjectURL(url)}
  })().catch(error=>{cached=null;throw error});
  return cached;
 }
 function descriptor(button){
  for(const [world,names] of Object.entries(labels)){
   const id=button.dataset[world];if(!names[id])continue;
   const legacy=world==='eg'?button.querySelector(':scope > span:not(.laria-reference-activity-icon)'):
    world==='tv'?button.querySelector('.tv-sign-label'):
    world==='ki'?button.querySelector('.ki-plank-name'):null;
   const direct=[...button.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim();
   return {id,label:legacy?.textContent.trim()||direct||names[id]};
  }
 }
 async function mount(nav){
  if(new URLSearchParams(location.search).get('lariaPremiumSignArt')!=='1')return false;
  if(!nav||nav.dataset.lariaPremiumSignArt)return false;
  const buttons=[...nav.querySelectorAll('button.laria-wayfinder')];
  const items=buttons.map(descriptor);
  if(items.length!==3||items.some(item=>!item))return false;
  nav.dataset.lariaPremiumSignArt='loading';
  try{
   const art=await source();
   if(!nav.isConnected)return false;
   nav.style.setProperty('--laria-premium-plank','url("'+art.board+'")');
   nav.style.setProperty('--laria-premium-posts','url("'+art.posts+'")');
   buttons.forEach((button,index)=>{
    const {id,label}=items[index];
    if(!button.hasAttribute('aria-label'))button.setAttribute('aria-label',label);
    // Keep the actual button and every legacy child intact. The review-only
    // visual face is pointer-transparent and does not duplicate spoken labels.
    for(const child of button.children)child.classList.add('laria-premium-sign-legacy');
    const face=document.createElement('i');
    face.className='laria-premium-sign-face';face.setAttribute('aria-hidden','true');
    const badge=document.createElement('i');
    badge.className='laria-premium-sign-medallion';badge.innerHTML=icons[id]||icons.globe;
    const text=document.createElement('b');
    text.className='laria-premium-sign-label';text.textContent=label;
    face.append(badge,text);button.append(face);button.classList.add('laria-premium-sign');
   });
   nav.classList.add('laria-premium-sign-rail');
   nav.dataset.lariaPremiumSignArt='ready';return true;
  }catch(error){
   nav.dataset.lariaPremiumSignArt='blocked';nav.dataset.lariaPremiumSignError=String(error.message||error);
   console.error('[Læria] premium sign art blocked',error);return false;
  }
 }
 window.LariaPremiumSignArt=Object.freeze({version:'v2',mount});
})();
