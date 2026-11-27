/* Læria Premium: one scene-component contract shared by four subjects.
 *
 * This is a presentation-only adapter. It owns the semantic shell, shared
 * navigation grouping and invariant component roles, not activity handlers,
 * user data, stored progress, original artwork or the live TrollActor engine.
 * Grovanova remains the locked visual reference. On art containing baked-in
 * signs or branding we retain the original touch regions until clean artwork
 * receives separate visual approval. Do not render new elements over painting.
 */
(function(){
 'use strict';
 const DEFINITIONS=Object.freeze({
   norwegian:Object.freeze({
     scene:'.eg-hero',home:'.eg-scene-home',brand:'.eg-world-brand',
     signs:'.eg-scene-hit.laria-wayfinder',troll:'.eg-companion-actor',
     choose:'.eg-scene-choose',grade:'.eg-world-grade',title:'Norsk'
   }),
   math:Object.freeze({
     scene:'.tv-scene',home:'.tv-scene-home',brand:'.tv-world-brand',
     signs:'.tv-sign.laria-wayfinder',nav:'.tv-sign-nav',troll:'.tv-actor-touch',
     choose:'.tv-scene-choose',grade:'.tv-scene-grade',title:'Matte'
   }),
   english:Object.freeze({
     scene:'.ki-stage',home:'.ki-painted-home',brand:'.ki-world-brand',
     signs:'.ki-painted-hit.laria-wayfinder',troll:'.ki-companion-actor',
     choose:'.ki-stage-choose',grade:'.ki-stage-grade',title:'Engelsk',
     hasPaintedUI:true
   }),
   geography:Object.freeze({
     scene:'.gv-scene',home:'.gv-home',brand:'.gv-brand',
     signs:'.gv-sign.laria-wayfinder',troll:'.gv-troll',
     choose:'.gv-choose',grade:'.gv-grade',title:'Geografi'
   })
 });
 const REQUIRED=Object.freeze(['home','signs','troll']);
 // Tallvika's fourth destination exists only when enabled for the current
 // grade. All three presentation layers use the same exact live rail contract.
 function validTallvikaRail(scene,signs){
   const expected=scene.hasAttribute('data-tv-shop-enabled')?'multiply,fraction,table,shop':'multiply,fraction,table';
   return signs.map(sign=>sign.dataset.tv).join(',')===expected;
 }
 function enhance(world,subject){
   const cfg=DEFINITIONS[subject];
   if(!cfg||!world?.querySelector)return false;
   const scene=world.querySelector(cfg.scene);
   if(!scene)return false;
   if(scene.dataset.lariaSceneComponent==='v1')return true;
   const signs=[...scene.querySelectorAll(cfg.signs)];
   const valid=subject==='geography'
     ? signs.map(sign=>sign.dataset.gv).join(',')==='globe,country'
     : subject==='math'?validTallvikaRail(scene,signs):signs.length===3;
   if(!valid){
     console.warn('[Læria] Scene component received unexpected activity signs',subject,signs.length);
     return false;
   }
   for(const name of REQUIRED){
     if(name!=='signs'&&!scene.querySelector(cfg[name])){
       console.warn('[Læria] Scene component incomplete',subject,name);
       return false;
     }
   }
   // Create one semantic navigation landmark. Moving existing button nodes
   // preserves their data action and delegated click events without cloning
   // click targets. Its DOM is static and has no competing interactive UI.
   let navigation=cfg.nav?scene.querySelector(cfg.nav):null;
   if(!navigation){
     navigation=document.createElement('nav');
     navigation.className='laria-scene-navigation';
     const first=signs[0];
     first.parentElement.insertBefore(navigation,first);
     for(const sign of signs)navigation.appendChild(sign);
   }else if(!navigation.classList.contains('laria-scene-navigation')){
     navigation.classList.add('laria-scene-navigation');
   }
   navigation.setAttribute('aria-label','Velg aktivitet i '+cfg.title);
   navigation.dataset.lariaComponent='sign-rail';
   for(const sign of signs){
     sign.classList.add('laria-scene-sign');
     sign.dataset.lariaComponent='sign';
   }
   const roles=[['home','home'],['brand','brand'],['choose','chooser'],
     ['grade','grade'],['troll','troll']];
   for(const [name,role] of roles){
     const element=scene.querySelector(cfg[name]);
     if(element){
       element.classList.add('laria-scene-'+role);
       element.dataset.lariaComponent=role;
     }
   }
   scene.classList.add('laria-scene-shell','laria-scene-'+subject);
   scene.dataset.lariaSceneComponent='v1';
   scene.dataset.lariaArtworkUi=cfg.hasPaintedUI&&world.dataset.kiPremiumArt!=='approved'?
     'painted-pending-clean':'separate';
   // User's iPad reference is an opt-in, art-safe presentation adapter.
   // Original scenes, existing actions and stored learning are untouched.
   window.LARIA_REFERENCE_LAYOUT?.mount?.(scene,subject);
   window.LariaPremiumSignArt?.mount?.(scene.querySelector('nav.laria-scene-navigation'));
   // Preserve all activity action attributes, data-troll, individual landscape
   // classes and the original source image. This does not create a new logo.
   return true;
 }
 window.LARIA_SCENE_UI=Object.freeze({
   version:'v1',enhance,validTallvikaRail,
   subjects:Object.freeze(Object.keys(DEFINITIONS))
 });
})();
