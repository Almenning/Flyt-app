/* Læria - Min rev: one persistent identity, genuinely layered wearable art.
 * In-world girl uses approved separate full-body transparent art.
 * Original profile portrait is preserved with soft fade on profile/older figures.
 * No learned content, saved avatar, reward logic or journey map is rewritten.
 */
(function(root){
  'use strict';
  // Release gate: retain owned items and equipped slots, but never render
  // unfinished clothing onto the child's permanent personal fox.
  const GEAR_PREVIEW_ENABLED=false;
  var counter=0, scheduled=false, observer=null;
  function choice(){return root.LARIA_FOX?.choice?.()==='girl'?'girl':'boy';}
  function inventory(){return root.LARIA_COLLECTION_STORE?.snapshot?.()||root.LARIA_COLLECTION_CORE?.normalize?.(null)||{equipped:{}};}
  function gearMarkup(slot,item,avatar){
    if(!item)return '';
    var girl=avatar==='girl';
    if(slot==='head'&&item==='oppdagerhatt'){
      return girl?
        '<g data-gear="oppdagerhatt" stroke-linejoin="round"><path d="M50 48Q65 27 100 26Q135 24 151 43Q124 54 94 57Q63 57 47 50Z" fill="#497a63" stroke="#365b4c" stroke-width="3"/><path d="M72 43Q79 15 91 14L123 22L135 44Q106 52 72 43Z" fill="#6c9672" stroke="#3c634f" stroke-width="3"/><path d="M72 42Q106 52 134 41L136 46Q104 56 69 48Z" fill="#bd784c"/><path d="M100 32L108 23L114 33L107 31Z" fill="#f5d68b"/></g>':
        '<g data-gear="oppdagerhatt" stroke-linejoin="round"><path d="M66 47Q86 31 128 30Q162 29 186 45Q151 54 122 56Q88 56 66 47Z" fill="#466e5b" stroke="#345444" stroke-width="3"/><path d="M94 40Q98 12 110 10L147 18L157 42Q130 49 94 40Z" fill="#719279" stroke="#45614c" stroke-width="3"/><path d="M94 38Q120 45 156 39L159 44Q129 52 91 44Z" fill="#a65f45"/><path d="M129 25l6-8 4 10-7-2Z" fill="#f9df9e"/></g>';
    }
    if(slot==='neck'&&item==='eventyrskjerf'){
      return girl?
        '<g data-gear="eventyrskjerf" stroke="#914f50" stroke-width="2" stroke-linejoin="round"><path d="M69 98Q100 110 123 92L132 100Q106 120 82 112Z" fill="#d78483"/><path d="M104 109Q114 131 105 150L91 145Q102 121 93 113Z" fill="#cb7078"/><path d="M92 145l-2 7m7-5 0 7m7-5 2 6" stroke="#f4c9a3"/><path d="M76 103Q98 114 124 99" fill="none" stroke="#f5c6b2" stroke-width="3"/></g>':
        '<g data-gear="eventyrskjerf" stroke="#9b5949" stroke-width="2" stroke-linejoin="round"><path d="M99 92Q126 104 153 88L161 99Q133 115 106 105Z" fill="#d47a6b"/><path d="M136 106Q146 132 136 147L121 142Q132 123 122 110Z" fill="#cb625f"/><path d="M121 141l-3 8m9-6v8m8-7 2 8" stroke="#f4c5a5"/><path d="M107 98Q132 109 153 94" fill="none" stroke="#ffd6aa" stroke-width="3"/></g>';
    }
    if(slot==='back'&&item==='stjerneryggsekk'){
      return girl?
        '<g data-gear="stjerneryggsekk" stroke="#67472c" stroke-linejoin="round"><path d="M143 104Q162 91 178 109L186 146Q166 159 148 143Z" fill="#98653e" stroke-width="3"/><path d="M151 107Q154 98 164 100Q174 101 175 111" fill="none" stroke-width="5"/><path d="M151 119Q165 127 181 117L183 133Q166 141 151 132Z" fill="#b98a51" stroke-width="2"/><path d="m169 121 3 6 7 1-5 4 1 7-6-3-6 3 1-7-5-4 7-1Z" fill="#f1d998" stroke="#9c743d" stroke-width="1.5"/></g>':
        '<g data-gear="stjerneryggsekk" stroke="#68482e" stroke-linejoin="round"><path d="M33 102Q50 83 67 104L72 142Q52 157 33 140Z" fill="#986b47" stroke-width="3"/><path d="M37 103Q43 93 51 94Q61 94 65 107" fill="none" stroke-width="5"/><path d="M35 117Q52 126 69 116L70 132Q52 141 36 132Z" fill="#c0945a" stroke-width="2"/><path d="m50 115 3 6 6 1-4 5 1 6-6-3-5 3 1-6-5-5 6-1Z" fill="#f6d88d" stroke="#aa7746" stroke-width="1.5"/></g>';
    }
    if(slot==='cape'&&item==='nordlyskappe'){
      return girl?
        '<g data-gear="nordlyskappe"><path d="M135 88Q156 93 174 116Q197 144 196 183Q169 177 150 165L135 125Z" fill="#3e8791" stroke="#3b657d" stroke-width="3"/><path d="M155 107Q179 134 183 167" fill="none" stroke="#9ddfc5" stroke-width="4" opacity=".85"/><path d="M143 99Q150 103 156 106" fill="none" stroke="#f4db98" stroke-width="5"/><circle cx="150" cy="106" r="5" fill="#f7d594" stroke="#9b7545"/></g>':
        '<g data-gear="nordlyskappe"><path d="M151 93Q177 100 185 128Q199 153 193 188Q166 187 146 170L144 121Z" fill="#407d96" stroke="#3b5d74" stroke-width="3"/><path d="M165 112Q186 143 183 174" fill="none" stroke="#9bd1c8" stroke-width="4" opacity=".85"/><path d="M153 101l10 8" stroke="#efd49e" stroke-width="5"/><circle cx="155" cy="108" r="5" fill="#f9dda0" stroke="#9a7147" stroke-width="2"/></g>';
    }
    return '';
  }
  // Full-body Læria girl: gear anchors are calibrated against the 200x300
  // transparent character canvas, NOT the former square onboarding portrait.
  // Outfits are deterministic and always follow the current saved wardrobe.
  function worldGearMarkup(slot,item){
    if(!item)return '';
    if(slot==='head'&&item==='oppdagerhatt'){
      return '<g data-gear="oppdagerhatt" stroke-linejoin="round">'+
        '<path d="M65 48Q84 29 111 30Q140 29 157 49Q136 59 110 60Q85 58 65 48Z" fill="#477866" stroke="#345744" stroke-width="2.5"/>'+
        '<path d="M86 46Q85 20 101 19L128 23Q141 35 140 47Q120 54 86 46Z" fill="#749879" stroke="#3e6550" stroke-width="2.5"/>'+
        '<path d="M86 45Q110 52 140 45L145 50Q117 58 82 49Z" fill="#a96a4a"/>'+
        '<path d="M113 32l4-7 5 7-5-1Z" fill="#f5d487"/></g>';
    }
    if(slot==='neck'&&item==='eventyrskjerf'){
      return '<g data-gear="eventyrskjerf" stroke="#965e57" stroke-linejoin="round" stroke-width="1.5">'+
        '<path d="M83 104Q109 115 135 100L146 108Q124 126 97 118Z" fill="#cf797c"/>'+
        '<path d="M113 118Q127 131 122 152L110 151Q117 133 105 122Z" fill="#ca6872"/>'+
        '<path d="M110 149l-1 7m6-5 0 7m7-8 2 7" fill="none" stroke="#f0c6af" stroke-width="2"/></g>';
    }
    if(slot==='back'&&item==='stjerneryggsekk'){
      return '<g data-gear="stjerneryggsekk" stroke-linejoin="round" stroke="#69452d" stroke-width="2">'+
        '<path d="M38 150Q54 138 72 151L79 190Q62 207 40 193Z" fill="#95663e"/>'+
        '<path d="M45 148Q52 134 64 140Q73 143 73 151" fill="none" stroke-width="4"/>'+
        '<path d="M42 166Q59 173 75 166L76 183Q59 190 43 181Z" fill="#b88a53"/>'+
        '<path d="m59 164 3 6 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z" fill="#f2df96" stroke="#b58d4b" stroke-width="1.3"/></g>';
    }
    if(slot==='cape'&&item==='nordlyskappe'){
      return '<g data-gear="nordlyskappe" stroke-linejoin="round">'+
        '<path d="M126 105Q146 103 159 127Q178 166 185 241Q149 233 121 203L116 131Z" fill="#3c8193" stroke="#2d5e77" stroke-width="3"/>'+
        '<path d="M143 118Q161 157 168 209" fill="none" stroke="#95d7c9" stroke-width="4"/>'+
        '<path d="M126 108l19 11" stroke="#efd99f" stroke-width="3"/>'+
        '<circle cx="143" cy="118" r="4" fill="#f5dfab" stroke="#936d4f" stroke-width="1.4"/></g>';
    }
    return '';
  }
  function render(which,collection,mode='portrait'){
    var avatar=which==='girl'?'girl':'boy',equipped=GEAR_PREVIEW_ENABLED?(collection?.equipped||{}):{},id='laria-wd-'+(++counter);
    const fullBody=mode==='world';
    // Portraits in headers remain the previously selected avatar. In-world
    // artwork gets its own transparent, full-body silhouette and gear anchors.
    var src=(fullBody?root.LARIA_FOX?.worldSource?.(avatar):root.LARIA_FOX?.source?.(avatar))||'';
    var h=fullBody?300:272;
    const cape=gearMarkup('cape',equipped.cape,avatar);
    const gear=(slot,item)=>fullBody?worldGearMarkup(slot,item,avatar):gearMarkup(slot,item,avatar);
    const mask=fullBody?'':'<radialGradient id="'+id+'-fade" cx="50%" cy="50%" r="56%"><stop offset="0%" stop-color="white"/><stop offset="78%" stop-color="white"/><stop offset="100%" stop-color="black"/></radialGradient>'+
      '<mask id="'+id+'-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" style="mask-type:luminance"><rect width="200" height="272" fill="url(#'+id+'-fade)"/></mask>';
    return '<svg class="laria-fox-wardrobe-art" viewBox="0 0 200 '+h+'" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet" data-avatar="'+avatar+'" data-fox-art="'+(fullBody?avatar+'-fullbody-v1':'portrait')+'">'+
      '<defs>'+mask+'</defs>'+
      '<g class="laria-fox-pose" data-fox-gear-rig="'+avatar+'"><g>'+gear('cape',equipped.cape)+'</g><image href="'+src+'" width="200" height="'+h+'" preserveAspectRatio="xMidYMid meet"'+(fullBody?'':' mask="url(#'+id+'-mask)"')+'/>'+
      gear('back',equipped.back)+gear('head',equipped.head)+gear('neck',equipped.neck)+
      '</g></svg>';
  }
  var SELECTORS=[
    '.bc12-fox > img','.locked-journey-profile > img',
    '.locked-journey-traveler > img','.task-fox-companion > img',
    '.fr2-guide > img.fr2-fox','.fr4-scene-fox > img.fr2-fox','.mp-avatar > img',
    '.mp-mascot > img','.mp-art-practice img',
    '.mp-pick-easy-intro > img','.mp-pick-mentor > img',
    '.word-hunt-top > img.word-hunt-fox',
    '.premium-globe-header > img.premium-globe-fox'
  ].join(',');
  function sync(){
    scheduled=false;
    if(!root.document?.body)return;
    var avatar=choice(),current=inventory();
    var signature=avatar+'|world-art-v3|'+JSON.stringify(current.equipped||{});
    root.document.querySelectorAll(SELECTORS).forEach(function(img){
      var parent=img.parentElement;if(!parent||parent.classList.contains('laria-troll-host'))return;
      if(img.dataset.lariaWardrobeSignature===signature&&parent.querySelector(':scope > .laria-fox-wardrobe-art'))return;
      parent.querySelector(':scope > .laria-fox-wardrobe-art')?.remove();
      var slot=root.document.createElement('div');
      const inWorld=!!img.closest('.bc12-fox,.locked-journey-traveler,.task-fox-companion,.fr2-guide,.fr4-scene-fox,.mp-mascot,.mp-art-practice,.word-hunt-top,.premium-globe-header');
      slot.innerHTML=render(avatar,current,inWorld?'world':'portrait');
      var artwork=slot.firstElementChild;
      if(!artwork)return;
      if(root.getComputedStyle?.(parent)?.position==='static')parent.style.position='relative';
      parent.classList.add('laria-fox-wardrobe-anchor');
      img.classList.add('laria-fox-base-under-sprite');
      img.dataset.lariaWardrobeSignature=signature;
      artwork.classList.add('laria-fox-wardrobe-placed');
      parent.append(artwork);
      const position=function(){
        if(!artwork.isConnected)return;
        var ir=img.getBoundingClientRect(),pr=parent.getBoundingClientRect();
        if(ir.width<1||ir.height<1)return;
        artwork.style.left=(ir.left-pr.left)+'px';
        artwork.style.top=(ir.top-pr.top)+'px';
        artwork.style.width=ir.width+'px';
        artwork.style.height=ir.height+'px';
      };
      position();
    });
    root.document.querySelectorAll(SELECTORS).forEach(function(img){
      if(img.parentElement?.classList.contains('laria-troll-host'))return;
      var art=img.parentElement?.querySelector(':scope > .laria-fox-wardrobe-placed');
      if(!art)return;
      var ir=img.getBoundingClientRect(),pr=img.parentElement.getBoundingClientRect();
      art.style.left=(ir.left-pr.left)+'px';art.style.top=(ir.top-pr.top)+'px';
      art.style.width=ir.width+'px';art.style.height=ir.height+'px';
    });
  }
  function refresh(){if(scheduled)return;scheduled=true;root.requestAnimationFrame?root.requestAnimationFrame(sync):sync();}
  function init(){
    if(!root.document?.body||observer)return;
    observer=new MutationObserver(function(changes){
      if(changes.some(function(change){
        if(change.type==='attributes')return change.target.matches?.(SELECTORS);
        return Array.from(change.addedNodes||[]).some(function(n){
          return n.nodeType===1&&((n.matches?.(SELECTORS))||(n.querySelector?.(SELECTORS)));
        });
      }))refresh();
    });
    observer.observe(root.document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
    root.addEventListener('resize',refresh,{passive:true});
    refresh();
  }
  root.LARIA_FOX_WARDROBE=Object.freeze({render,refresh,choice,inventory,gearPreviewEnabled:GEAR_PREVIEW_ENABLED});
  if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})(window);
