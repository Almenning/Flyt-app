/* Læria: interactive, genuinely countable illustrated garden collections.
   Decorative scene elements never contribute to the mathematical count. */
(()=>{
'use strict';
const THEMES=[
 {id:'strawberry',name:'Jordbær',item:'jordbær',emoji:'🍓'},
 {id:'bun',name:'Boller',item:'boller',emoji:'🥐'},
 {id:'mushroom',name:'Eventyrsopp',item:'sopper',emoji:'🍄'},
 {id:'apple',name:'Epler',item:'epler',emoji:'🍎'}
];
const PALETTE={
 strawberry:['#f86e69','#b9223b','#ffbd8b'],
 bun:['#f3ba69','#b16a36','#ffe5ab'],
 mushroom:['#ef6755','#c33b32','#ffe9d0'],
 apple:['#ec6554','#b33132','#ffbb77']
};
function sprite(theme,serial){
 const p=PALETTE[theme]||PALETTE.strawberry;
 const unique='mp3-'+theme+'-'+serial;
 let shape='';
 if(theme==='strawberry')shape='<path d="M17 11C7 10 6 22 11 32L22 47 33 32C39 19 35 11 27 11Z" fill="url(#'+unique+')" stroke="#a82d38" stroke-width="1.6"/><path d="M22 13q-11-11-15-6 7 1 10 10M22 13q2-13 11-9-6 4-7 13M22 13q11-5 15 2-7 2-14 2" fill="#458947" stroke="#34753b" stroke-width="1.3"/>'+Array.from({length:11},(_,i)=>'<ellipse cx="'+(13+(i%4)*6+(i%2)*2)+'" cy="'+(19+Math.floor(i/4)*8)+'" rx="1.1" ry="2" transform="rotate(-22 '+(13+(i%4)*6)+' '+(19+Math.floor(i/4)*8)+')" fill="#ffe0a4"/>').join('');
 else if(theme==='bun')shape='<ellipse cx="23" cy="39" rx="19" ry="7" fill="#ad6b35"/><path d="M6 32Q4 18 17 12Q24 8 31 13Q44 20 40 34Q25 44 6 32" fill="url(#'+unique+')" stroke="#9d602d" stroke-width="1.7"/><path d="M12 31Q9 21 21 19Q32 17 34 25Q35 32 23 34Q17 35 16 28Q17 24 24 24" fill="none" stroke="#9c582e" stroke-width="3" stroke-linecap="round"/>'+Array.from({length:8},(_,i)=>'<ellipse cx="'+(10+(i*7)%26)+'" cy="'+(16+(i*5)%16)+'" rx="1.9" ry=".9" fill="#fff2d4" transform="rotate('+i*23+' '+(10+(i*7)%26)+' '+(16+(i*5)%16)+')"/>').join('');
 else if(theme==='mushroom')shape='<path d="M19 23h11l3 19Q24 48 15 42Z" fill="#f6ddb4" stroke="#af8956" stroke-width="1.7"/><path d="M5 26Q6 6 24 6Q42 7 43 26Q24 33 5 26Z" fill="url(#'+unique+')" stroke="#a43f31" stroke-width="2"/><path d="M7 26Q24 31 41 26" stroke="#ffe8d2" stroke-width="3" fill="none"/><circle cx="18" cy="15" r="4" fill="#fff6e4"/><ellipse cx="32" cy="20" rx="4" ry="3" fill="#fff4dd"/><circle cx="30" cy="11" r="2" fill="#fff1da"/>';
 else shape='<path d="M24 13Q10 7 7 22Q3 41 20 44Q25 46 29 43Q45 40 40 23Q37 9 24 13Z" fill="url(#'+unique+')" stroke="#a74333" stroke-width="1.8"/><path d="M24 13L26 6" stroke="#69512e" stroke-width="3" stroke-linecap="round"/><path d="M25 10Q32 0 39 8Q32 15 25 10" fill="#598e4e" stroke="#467945" stroke-width="1"/><path d="M14 17Q10 25 13 29" fill="none" stroke="#ffd49a" stroke-width="3" stroke-linecap="round"/>';
 return '<svg class="mp3-object" viewBox="0 0 48 52" aria-hidden="true"><defs><radialGradient id="'+unique+'" cx="30%" cy="22%" r="80%"><stop stop-color="'+p[2]+'"/><stop offset=".45" stop-color="'+p[0]+'"/><stop offset="1" stop-color="'+p[1]+'"/></radialGradient></defs><ellipse cx="24" cy="47" rx="18" ry="3" fill="#473421" opacity=".16"/>'+shape+'</svg>';
}
function render(a,b,theme='strawberry'){
 a=Math.max(1,Math.min(10,Number(a)||1));b=Math.max(1,Math.min(10,Number(b)||1));
 if(!THEMES.some(t=>t.id===theme))theme='strawberry';
 const item=THEMES.find(t=>t.id===theme);
 let html='<div class="mp-apples mp3-collections" data-mp3-theme="'+theme+'" data-mp3-groups="'+a+'" data-mp3-each="'+b+'" role="group" aria-label="'+a+' grupper med '+b+' '+item.item+' i hver">';
 for(let g=0;g<a;g++){
  html+='<div class="mp-apple-basket mp3-basket" role="group" aria-label="Gruppe '+(g+1)+': '+b+' '+item.item+'"><div class="mp-apple-fruits mp3-fruits" style="--mp3-cols:'+Math.min(5,b)+'">';
  for(let n=0;n<b;n++)html+='<span class="mp-apple mp3-item" role="img" aria-label="'+item.item.slice(0,-1)+'">'+sprite(theme,g*10+n)+'</span>';
  html+='</div><span class="mp-basket-number">'+(g+1)+'</span></div>';
 }
 return html+'</div>';
}
function picker(theme){
 return '<div class="mp3-picker" role="group" aria-label="Velg illustrasjoner"><span>Tell med</span>'+THEMES.map(t=>'<button type="button" data-mp-action="theme" data-theme="'+t.id+'" class="mp3-theme'+(theme===t.id?' active':'')+'" aria-pressed="'+(theme===t.id)+'">'+t.emoji+' '+t.name+'</button>').join('')+'</div>';
}
window.LARIA_MULT_ILLUSTRATED_V3={themes:THEMES.map(t=>t.id),render,picker};
})();