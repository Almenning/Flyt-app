/* Subject v16 preview: existing learning routes are reused; no storage writes.
   Enable per art-cleanup readiness. This is a draft-only opt-in experiment. */
(()=>{'use strict';
 const screen=document.getElementById('subject-screen');if(!screen)return;
 const subjectRoutes={
  norwegian:{root:'eggenipa-world',css:'norsk',items:[['words','Ordjakt','▣'],['find','Finn ordene','ABC'],['reading','Lesekroken','▤']],delegate:'eg'},
  math:{root:'tallvika-world',css:'matte',items:[['multiply','Gangemagi','×'],['fraction','Brøklab','¼'],['table','Gangetabellen','▦']],delegate:'tv'},
  english:{root:'kinnaklova-world',css:'engelsk',items:[['words','Words','ABC'],['sentences','Sentences','☏'],['reading','Reading','▤']],delegate:'ki'}
 };
 const enabled=new URLSearchParams(location.search).has('laria-subject-v16-preview');
 if(!enabled)return;
 let previous='';
 function showSelectedEnglishTroll(root,key){
  if(key!=='english')return;
  const state=window.LARIA_TALLVIKA_BRIDGE?.state?.();
  const selected=state?.profile?.tallvikaTroll||'storesoster';
  root.querySelectorAll('.ki-troll').forEach(troll=>{
   troll.hidden=troll.dataset.kiCharacter!==selected;
   troll.style.display=troll.hidden?'none':'';
  });
 }

 function update(){
  const key=screen.classList.contains('active')?screen.dataset.subject:'';
  const config=subjectRoutes[key];const root=config&&document.getElementById(config.root);
  if(!root){screen.classList.remove('laria-v16-norsk','laria-v16-matte','laria-v16-engelsk');previous='';return;}
  if(previous===key&&root.querySelector('.laria-v16-signnav')){showSelectedEnglishTroll(root,key);return;}
  previous=key;
  screen.classList.remove('laria-v16-norsk','laria-v16-matte','laria-v16-engelsk');
  // Do not enable the prototype until the clean art file is signed off.
  // Experimental navigation is opt-in and preserves existing learning routes.
  screen.classList.add('laria-v16-'+config.css);
  root.querySelectorAll('.laria-v16-signnav').forEach(n=>n.remove());
  const nav=document.createElement('nav');nav.className='laria-v16-signnav';nav.setAttribute('aria-label','Velg aktivitet');
  for(const [id,label,icon] of config.items){
    const button=document.createElement('button');button.className='laria-v16-sign';button.type='button';
    button.setAttribute('aria-label','Åpne '+label);button.innerHTML='<b aria-hidden="true"></b><span></span>';
    button.querySelector('b').textContent=icon;button.querySelector('span').textContent=label;
    button.addEventListener('click',()=>{
      const original=root.querySelector('[data-'+config.delegate+'="'+id+'"]');
      if(!original)return;
      original.click();
    });
    nav.appendChild(button);
  }
  // Place on top of the existing stage; navigation is present even when images cannot be edited.
  const stage=root.querySelector(config.css==='norsk'?'.eg-hero':config.css==='matte'?'.tv-scene':'.ki-stage');
  stage?.append(nav);
  showSelectedEnglishTroll(root,key);
 }
 new MutationObserver(update).observe(screen,{attributes:true,attributeFilter:['class','data-subject']});
 update();
 window.LARIA_SUBJECT_V16_PREVIEW=Object.freeze({update,enabled:true});
})();