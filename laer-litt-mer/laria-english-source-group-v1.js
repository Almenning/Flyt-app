/* Læria: ONE source-illustration English sign rail, review only.
 * Uses pixel-identical Grovanova plank/flag/rim regions from the SHA-checked
 * Home v16 original. Lettering and two task-specific symbols remain real
 * DOM, not painted into the scene. No default app behaviour is changed.
 */
(function(){
 'use strict';
 const ACTIONS=['words','sentences','reading'];
 const set=(element,name,value)=>element.style.setProperty(name,value,'important');
 async function mount(nav){
  if(!nav||nav.dataset.lariaEnglishSourceGroup)return false;
  nav.dataset.lariaEnglishSourceGroup='loading';
  const source=window.LariaSourceExactSignV3;
  if(!source?.getArt){
   nav.dataset.lariaEnglishSourceGroup='blocked';
   nav.dataset.lariaEnglishSourceReason='Locked source module not available';
   return false;
  }
  try{
   const art=await source.getArt();
   if(!nav.isConnected)return false;
   const boards=ACTIONS.map(id=>nav.querySelector('button[data-ki="'+id+'"]'));
   if(boards.some(board=>!board))throw Error('English source group is missing a real activity button');
   nav.classList.add('laria-english-source-group');
   const posts=document.createElement('span');
   posts.className='laria-english-source-posts';
   posts.setAttribute('aria-hidden','true');
   posts.dataset.source='grovanova-locked-post-pixels-v1';
   set(posts,'background','url("'+art.postPng+'") center/100% 100% no-repeat');
   nav.prepend(posts);
   boards.forEach((board,i)=>{
    const id=ACTIONS[i],label=board.querySelector(':scope > .ki-plank-name');
    const medal=board.querySelector(':scope > .laria-wooden-sign-medallion');
    if(!label||!medal)throw Error('Source group lacks a semantic label or icon');
    board.dataset.lariaEnglishSourceBoard=id;
    set(board,'background','url("'+(id==='words'?art.png:art.taskPng)+'") center/100% 100% no-repeat');
    board.dataset.lariaMedalSource=id==='words'?'original-flag':'source-reconstructed-engraving';
    set(board,'aspect-ratio','307 / 82');
    set(board,'min-height','76px');
    set(board,'width','100%');
    set(board,'height','auto');
    set(board,'padding','0');
    set(board,'border','0');
    set(board,'box-shadow','none');
    set(board,'z-index','1');
    set(label,'left','40%');
    set(label,'right','4%');
    set(label,'top','50%');
    set(label,'transform','translateY(-54%)');
    set(label,'font','900 clamp(23px,2.55vw,35px)/1 Georgia,"Times New Roman",serif');
    set(label,'white-space','nowrap');
    set(label,'letter-spacing','-.025em');
    set(label,'color','#2b180b');
    set(label,'text-align','center');
    set(label,'text-shadow','0 1px 0 #ffe2a4');
    // Words retains the real illustrated UK flag and original carved rim.
    // Sentences/Reading share a NEW INNER disc reconstructed in the bitmap
    // from its SHA-locked wood texture. The surrounding round frame is still
    // ORIGINAL pixels. Only task glyphs are rendered separately over the disc.
    if(id==='words'){
     medal.textContent='';
     set(medal,'display','none');
     set(medal,'background','none');
    }else{
     medal.dataset.lariaSourceMedal=id;
     set(medal,'display','grid');
     set(medal,'place-items','center');
     set(medal,'visibility','visible');
     set(medal,'left','19.1%');
     set(medal,'top','57.3%');
     set(medal,'transform','translateY(-50%)');
     set(medal,'width','19%');
     set(medal,'height','auto');
     set(medal,'aspect-ratio','1');
     set(medal,'border-radius','50%');
     set(medal,'border','0');
     set(medal,'background','none');
     set(medal,'box-shadow','none');
     set(medal,'color','#ffe5a0');
     const icon=medal.querySelector('svg');
     if(icon){
      set(icon,'display','block');
      set(icon,'width','69%');set(icon,'height','69%');
      set(icon,'fill','none');
      set(icon,'stroke','#ffe5a0');
      set(icon,'stroke-width','2.4');
      set(icon,'filter','drop-shadow(0 1px 1px #170b05)');
     }
    }
   });
   nav.dataset.lariaEnglishSourceSha=art.sourceSha;
   nav.dataset.lariaEnglishSourceGroup='ready';
   return true;
  }catch(error){
   nav.dataset.lariaEnglishSourceGroup='blocked';
   nav.dataset.lariaEnglishSourceReason=String(error?.message||error);
   console.error('[Læria] Authentic English group blocked',error);
   return false;
  }
 }
 window.LariaEnglishSourceGroup=Object.freeze({version:'review-v1',mount});
})();