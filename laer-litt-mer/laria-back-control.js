/* Læria Premium 3.0 / Fase 2A
 * One visible, accessible return action for every full-screen learning route.
 * This is deliberately an adapter: existing activities still own their local
 * state, while this control delegates to their proven return handlers.
 */
(() => {
  'use strict';

  const ROUTES=new Set(['subject','geography','world','continent','fraction-lab','multiplication-lab','session','complete','detail','adult','parent-info','feedback']);
  let handlingPop=false;

  const screenName=()=>document.querySelector('.screen.active')?.id?.replace(/-screen$/,'')||'home';
  const returnPanel=()=>window.LARIA_BASECAMP_RETURN_VIEW?.();
  const homeLabel=()=>returnPanel()==='travel'?'Reisen':returnPanel()==='explore'?'Utforsk':'Hjem';
  const labelFor=route=>{
    if(route==='subject'||route==='geography')return homeLabel();
    if(route==='world')return window.globeReturnScreen==='continent'?'Verdensdelen':window.globeReturnScreen==='basecamp'?homeLabel():'Geografi';
    if(route==='continent')return 'Geografi';
    if(route==='fraction-lab'||route==='multiplication-lab')return document.querySelector('#subject-screen.active')?'Tallvika':'Matte';
    if(route==='session'||route==='complete')return 'faget';
    if(route==='detail')return 'oversikten';
    if(route==='parent-info'||route==='feedback')return 'foreldreområdet';
    if(route==='adult')return 'Hjem';
    return 'Hjem';
  };
  const visibleDialog=()=>[...document.querySelectorAll('dialog[open]')].find(dialog=>dialog.offsetParent!==null);

  function currentControl(){return document.querySelector('.screen.active > .laria-back-control');}
  function install(route=screenName()){
    const active=document.querySelector('.screen.active');
    const existing=currentControl();
    if(!ROUTES.has(route)||!active){existing?.remove();return;}
    let control=existing;
    if(!control){
      control=document.createElement('button');
      control.type='button';
      control.className='laria-back-control';
      control.dataset.lariaBackControl='true';
      control.innerHTML='<span aria-hidden="true">‹</span><span class="laria-back-control-label"></span>';
      control.addEventListener('click',()=>request());
      active.insertBefore(control,active.firstChild);
    }
    const destination=labelFor(route);
    control.dataset.lariaBackRoute=route;
    control.querySelector('.laria-back-control-label').textContent=destination;
    control.setAttribute('aria-label','Tilbake til '+destination);
    control.title='Tilbake til '+destination;
  }

  function request(){
    const dialog=visibleDialog();
    if(dialog){dialog.close();return true;}
    const route=screenName();
    // A geography journey is a child view of Nordlysleiren. Its return action
    // must restore the subject landing before a second press leaves the subject.
    if(route==='geography'&&document.querySelector('#geography-screen .locked-journey-active, #geography-screen .locked-journey-map, #geography-screen .locked-journey-back:not([hidden])')){
      const mapBack=document.querySelector('#geography-screen .locked-journey-back:not([hidden]), #geography-screen .locked-journey-floating-back:not([hidden])');
      if(mapBack){mapBack.click();return true;}
    }
    // appBack already preserves the origin for scene facades, nested labs,
    // sessions and Basecamp's Reisen/Utforsk panels. Do not use history.back:
    // that can leave the child-facing app on an external page.
    if(typeof window.appBack==='function'&&window.appBack())return true;
    if(typeof window.setTab==='function'){window.setTab('home');return true;}
    return false;
  }

  function snapshot(route=screenName()){
    return {lariaBackControl:true,route,at:Date.now()};
  }
  function seedHistory(){
    try{
      if(!history.state?.lariaBackControl)history.replaceState(snapshot(),'');
    }catch(_){}
  }
  function track(route){
    if(handlingPop||!ROUTES.has(route))return;
    try{
      const current=history.state;
      if(current?.lariaBackControl&&current.route===route)return;
      history.pushState(snapshot(route),'');
    }catch(_){}
  }

  function observe(){
    let last='';
    const refresh=()=>{
      const route=screenName();
      install(route);
      if(route!==last){last=route;track(route);}
    };
    new MutationObserver(refresh).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','style']});
    refresh();
  }

  // `showScreen` is the app's central transition point. The observer above
  // covers third-party scene adapters; this hook makes the common path
  // synchronous with the transition as well, including Safari's batched
  // attribute mutations.
  function hookShowScreen(){
    const prior=window.showScreen;
    if(typeof prior!=='function'||prior.__lariaBackControlWrapped)return;
    function wrappedShowScreen(){
      const result=prior.apply(this,arguments);
      const route=arguments[0];
      requestAnimationFrame(()=>install(route));
      return result;
    }
    wrappedShowScreen.__lariaBackControlWrapped=true;
    window.showScreen=wrappedShowScreen;
  }

  window.addEventListener('popstate',event=>{
    if(!event.state?.lariaBackControl)return;
    handlingPop=true;
    try{request();}finally{setTimeout(()=>{handlingPop=false;install();},0);}
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||event.defaultPrevented||event.repeat)return;
    if(!currentControl())return;
    event.preventDefault();
    request();
  },true);

  window.LARIA_BACK_CONTROL=Object.freeze({install,request,labelFor,screenName});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{seedHistory();hookShowScreen();observe();},{once:true});
  else {seedHistory();hookShowScreen();observe();}
})();
