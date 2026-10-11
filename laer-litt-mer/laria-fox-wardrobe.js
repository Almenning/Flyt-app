/* Læria - Min rev: one persistent identity, genuinely layered wearable art.
 * The original profile artwork supplies the figure; an explicit silhouette
 * removes its painted square background in the wardrobe and every companion.
 * No learned content, saved avatar, reward logic or journey map is rewritten.
 */
(function(root){
  'use strict';
  var counter=0, scheduled=false, observer=null;
  var PATHS={
    boy:'M75 0 Q82 -1 94 13 L105 24 Q119 8 137 1 L142 15 Q154 7 174 10 L182 17 L177 38 Q193 49 190 69 L186 82 Q204 98 189 115 L177 124 Q183 146 178 163 Q190 178 186 200 L142 200 L128 178 L117 175 L108 193 L57 200 Q46 192 58 170 Q44 164 39 160 Q19 174 3 172 Q-2 152 17 136 Q25 122 39 118 L50 89 L31 87 Q18 80 15 65 Q15 54 32 53 L49 60 L62 40 Z',
    girl:'M62 1 Q84 -5 97 10 Q109 5 121 14 Q136 7 146 13 L144 37 Q169 48 166 78 L169 98 Q185 102 192 120 Q205 139 202 158 Q196 176 183 180 L164 174 Q156 190 142 199 L107 200 L102 180 L89 177 L83 196 L48 200 Q44 184 54 169 L48 141 Q37 126 41 111 L44 88 Q24 79 22 57 L31 29 Q40 16 51 24 Z'
  };
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
  function render(which,collection,mode='portrait'){
    var avatar=which==='girl'?'girl':'boy',equipped=collection?.equipped||{},id='laria-wd-'+(++counter);
    const fullGirl=avatar==='girl'&&mode==='world';
    // Portraits in headers remain the previously selected avatar. In-world
    // artwork gets its own transparent, full-body silhouette and gear anchors.
    var src=(fullGirl?root.LARIA_FOX?.worldSource?.(avatar):root.LARIA_FOX?.source?.(avatar))||'';
    var h=fullGirl?380:200;
    const cape=gearMarkup('cape',equipped.cape,avatar);
    const gear=(slot,item)=>fullGirl&&item?
      '<g transform="'+({neck:'translate(-2 38)',back:'translate(-10 68)',cape:'translate(-8 78)',head:'translate(2 13)'}[slot]||'')+'">'+gearMarkup(slot,item,avatar)+'</g>':
      gearMarkup(slot,item,avatar);
    return '<svg class="laria-fox-wardrobe-art" viewBox="0 0 200 '+h+'" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet" data-avatar="'+avatar+'" data-fox-art="'+(fullGirl?'reference-girl-draft':'portrait')+'">'+
      '<defs><clipPath id="'+id+'"><path d="'+PATHS[avatar]+'"/></clipPath></defs>'+
      '<g class="laria-fox-pose" data-fox-gear-rig="'+avatar+'"><g>'+gear('cape',equipped.cape)+'</g><image href="'+src+'" width="200" height="'+h+'" preserveAspectRatio="xMidYMid meet"'+(fullGirl?'':' clip-path="url(#'+id+')"')+'/>'+
      gear('back',equipped.back)+gear('head',equipped.head)+gear('neck',equipped.neck)+
      '</g></svg>';
  }
  var SELECTORS=[
    '.bc12-fox > img','.locked-journey-profile > img',
    '.locked-journey-traveler > img','.task-fox-companion > img',
    '.fr2-guide > img.fr2-fox','.mp-avatar > img',
    '.mp-mascot > img','.mp-art-practice img',
    '.mp-pick-easy-intro > img','.mp-pick-mentor > img',
    '.word-hunt-top > img.word-hunt-fox',
    '.premium-globe-header > img.premium-globe-fox'
  ].join(',');
  function sync(){
    scheduled=false;
    if(!root.document?.body)return;
    var avatar=choice(),current=inventory();
    var signature=avatar+'|'+JSON.stringify(current.equipped||{});
    root.document.querySelectorAll(SELECTORS).forEach(function(img){
      var parent=img.parentElement;if(!parent)return;
      if(img.dataset.lariaWardrobeSignature===signature&&parent.querySelector(':scope > .laria-fox-wardrobe-art'))return;
      parent.querySelector(':scope > .laria-fox-wardrobe-art')?.remove();
      var slot=root.document.createElement('div');
      slot.innerHTML=render(avatar,current);
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
  root.LARIA_FOX_WARDROBE=Object.freeze({render,refresh,choice,inventory});
  if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})(window);
