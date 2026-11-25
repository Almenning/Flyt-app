/* Review-only sign rail. The locked Grovanova illustration is read, never changed. */
(function(){
 'use strict';
 const SOURCE='./assets/home-v16/laria-grovanova-v16-landscape-original.png';
 const SHA='9019d2d7be86d0f96d59770c0d141b935b1c4195fecc4e1dcfbf531ce226e028';
 const CROP={x:41,y:532,w:315,h:90};
 // Outer wood silhouette only. Do not carry the blue sky, leaves or grass into the rail.
 const OUTLINE=[[82,538],[106,535],[272,535],[326,535],[333,537],[337,541],[343,550],[353,570],[354,575],[350,583],[341,602],[335,609],[327,612],[274,613],[111,620],[77,620],[69,616],[60,606],[50,591],[44,579],[44,574],[52,558],[65,544],[74,539]];
 let cached;
 // Painted enamel badges: clear silhouettes at iPad size, not emoji or
 // abstract toolbar icons. All vectors are decorative; existing action names stay live.
 const enamel=(shapes)=>'<svg class="laria-enamel" viewBox="0 0 32 32" focusable="false" aria-hidden="true"><g stroke="#fff1cc" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">'+shapes+'</g></svg>';
 const sparkle='<path fill="#ffd47d" d="m26 2 1.1 3.9L31 7l-3.9 1.1L26 12l-1.1-3.9L21 7l3.9-1.1z"/>';
 const icons={
  'eg:words':enamel('<path d="M5 25c0-10 6-17 17-18 2 10-3 17-13 19l-4 3z" fill="#6ead79"/><path d="m10 22 5-11 5 11m-8-3h6" fill="none" stroke-width="2.1"/>'+sparkle),
  'eg:find':enamel('<path d="m20 20 7 7-3 3-8-8" fill="#e58b5d"/><circle cx="13" cy="13" r="9" fill="#77b5bf"/><path d="m9 14 4-5 4 5m-7-1h6" fill="none"/><path d="M6 12c0-2 1-4 3-5" fill="none"/>'),
  'eg:reading':enamel('<path d="M3 10q8-3 13 2 5-5 13-2v15q-8-2-13 2-5-4-13-2z" fill="#c7828f"/><path d="M16 13v13M7 15l5 1m-5 3 5 1m8-4 5-1m-5 5 5-1" fill="none"/>'+sparkle),
  'tv:multiply':enamel('<path d="M9 23 22 10l3 3-13 13-5 2z" fill="#df9663"/><path d="m23 4 1.5 4.5L29 10l-4.5 1.5L23 16l-1.5-4.5L17 10l4.5-1.5z" fill="#f8cb70"/><path d="M7 8v8m-4-4h8m13 10v4m-2-2h4" fill="none"/>'),
  'tv:fraction':enamel('<path d="M17 6a11 11 0 1 0 11 11H17z" fill="#eaa262"/><path d="M20 3a11 11 0 0 1 9 10h-9z" fill="#e27d77"/><g fill="#a34c44" stroke="none"><circle cx="12" cy="13" r="2"/><circle cx="10" cy="21" r="2"/><circle cx="19" cy="23" r="2"/></g>'),
  'tv:table':enamel('<rect x="4" y="4" width="24" height="24" rx="4" fill="#679991"/><path d="M5 8a3 3 0 0 1 3-3h16a3 3 0 0 1 3 3v4H5z" fill="#e6a362" stroke="none"/><path d="M12 6v20m8-20v20M6 12h20M6 20h20" fill="none"/><path d="M8 8h1m7 7h1m7 8h1" stroke-width="2.2"/>'),
  'ki:words':enamel('<rect x="4" y="5" width="14" height="14" rx="3" transform="rotate(-8 11 12)" fill="#8fac7a"/><rect x="14" y="14" width="14" height="14" rx="3" transform="rotate(8 21 21)" fill="#d78070"/><path d="m7 15 3-7 3 7m-5-2h4m6 11v-7h3q4 1 1 3 4 2 0 4z" fill="none"/>'),
  'ki:sentences':enamel('<path d="M13 14h12q4 0 4 4v6l-4-2H13q-3 0-3-3v-2q0-3 3-3z" fill="#e9a464"/><path d="M6 5h15q4 0 4 4v4q0 4-4 4H11l-7 5v-5q-2-1-2-4V9q0-4 4-4z" fill="#82afbd"/><path d="M8 11h1m4 0h1m4 0h1" fill="none" stroke-width="2.2"/>'),
  'ki:reading':enamel('<path d="M3 9q8-2 13 3 5-5 13-3v16q-8-2-13 2-5-4-13-2z" fill="#e3a769"/><path d="M16 12v14M7 15l5 1m-5 3 5 1m9-11v12l3-2 3 1V9" fill="none"/><path d="m22 4 1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#ffc963"/>'),
  'gv:journey':enamel('<path d="M3 26 16 8l13 18z" fill="#e49564"/><path d="m13 26 4-10 4 10" fill="#724110"/><path d="M2 26h28" fill="none"/>'+sparkle),
  'gv:globe':enamel('<circle cx="16" cy="16" r="12" fill="#70a8bc"/><path d="m6 10 7-4 5 3-3 3 3 4-4 3-2 5-4-4v-5zm17 5 4 1-2 6-4-1z" fill="#7bae78" stroke-width="1.2"/>'),
  'gv:country':enamel('<path d="M6 29V5m1 1q5-4 11 0v12q-6-4-11 0m10-7q6-3 11 0v11q-5-3-10 0" fill="#91b6c8"/><path d="M7 6q5-4 11 0v12q-6-4-11 0z" fill="#d18172"/><path d="M10 10h5m-2.5-2.5v5" fill="none"/>')
 };
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
   return {world,id,label:legacy?.textContent.trim()||direct||names[id]};
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
    const {world,id,label}=items[index];
    if(!button.hasAttribute('aria-label'))button.setAttribute('aria-label',label);
    // Keep the actual button and every legacy child intact. The review-only
    // visual face is pointer-transparent and does not duplicate spoken labels.
    for(const child of button.children)child.classList.add('laria-premium-sign-legacy');
    const face=document.createElement('i');
    face.className='laria-premium-sign-face';face.setAttribute('aria-hidden','true');
    const badge=document.createElement('i');
    badge.className='laria-premium-sign-medallion';badge.innerHTML=icons[world+':'+id];
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
 window.LariaPremiumSignArt=Object.freeze({version:'v3',mount});
})();
