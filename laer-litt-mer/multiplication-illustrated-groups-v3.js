/* Læria: interactive, genuinely countable illustrated garden collections.
   Decorative scene elements never contribute to the mathematical count. */
(()=>{
'use strict';
const THEMES=[
 {id:'strawberry',name:'Jordbær',item:'jordbær',singular:'jordbær',emoji:'🍓'},
 {id:'bun',name:'Boller',item:'boller',singular:'bolle',emoji:'🥐'},
 {id:'mushroom',name:'Eventyrsopp',item:'sopper',singular:'sopp',emoji:'🍄'},
 {id:'apple',name:'Epler',item:'epler',singular:'eple',emoji:'🍎'}
];
const PALETTE={
 strawberry:['#f86e69','#b9223b','#ffbd8b'],
 bun:['#f3ba69','#b16a36','#ffe5ab'],
 mushroom:['#ef6755','#c33b32','#ffe9d0'],
 apple:['#ec6554','#b33132','#ffbb77']
};
function sprite(theme,serial){
 const p=PALETTE[theme]||PALETTE.strawberry;
 const id='mp3-'+theme+'-'+serial;
 const variation=serial%5,light=variation*1.1;
 const spec=theme==='bun'?
  '<path d="M6 44Q4 30 14 22Q25 11 40 19Q56 25 54 45Q47 55 30 55Q12 54 6 44Z" fill="url(#'+id+'g)" stroke="#ab6835" stroke-width="2"/><path d="M12 38Q11 25 28 23Q45 22 47 35Q47 46 32 46Q21 45 23 36Q25 31 33 33Q38 34 35 39" fill="none" stroke="#8c452a" stroke-width="5" stroke-linecap="round"/><path d="M12 35Q14 25 28 26Q43 25 43 35Q41 42 33 42" fill="none" stroke="#ffe1ab" stroke-width="2.8" stroke-linecap="round"/><path d="M11 47Q28 53 51 47" fill="none" stroke="#f9cf81" stroke-width="4" stroke-linecap="round"/>'+Array.from({length:8},(_,i)=>'<ellipse cx="'+(12+(i*7)%40)+'" cy="'+(25+(i*11)%23)+'" rx="1.8" ry=".85" fill="#fff6d8" transform="rotate('+i*37+' '+(12+(i*7)%40)+' '+(25+(i*11)%23)+')"/>').join('')
 :theme==='mushroom'?
  '<path d="M23 33Q20 44 20 54Q32 60 43 54Q38 44 40 33Z" fill="url(#'+id+'stem)" stroke="#b58d65" stroke-width="2"/><path d="M20 48Q29 53 41 48" fill="none" stroke="#dec4a2" stroke-width="2"/><ellipse cx="31" cy="32" rx="24" ry="7" fill="#fbe1bd" stroke="#bd9272" stroke-width="2"/><path d="M4 32Q7 5 31 5Q55 5 58 32Q31 42 4 32Z" fill="url(#'+id+'g)" stroke="#ad3f35" stroke-width="2.1"/><ellipse cx="20" cy="19" rx="6" ry="4.6" fill="#fff8df" transform="rotate(-17 20 19)"/><ellipse cx="42" cy="24" rx="6" ry="4" fill="#fff3dc" transform="rotate(18 42 24)"/><ellipse cx="33" cy="11.5" rx="3.5" ry="2.9" fill="#fff4e5"/><path d="M10 29Q32 38 52 29" stroke="#ffe9cd" stroke-width="2" fill="none"/>'
 :theme==='apple'?
  '<path d="M31 18Q15 8 8 25Q3 42 17 53Q26 58 31 55Q38 58 47 52Q60 39 54 24Q48 8 31 18Z" fill="url(#'+id+'g)" stroke="#a74335" stroke-width="2.2"/><path d="M30 18Q28 14 33 6" stroke="#644527" stroke-width="4" stroke-linecap="round"/><path d="M33 13Q48 1 54 12Q43 21 33 13Z" fill="url(#'+id+'leaf)" stroke="#397540" stroke-width="1.6"/><path d="M36 13l12-3" stroke="#b7d78a" stroke-width="1.4"/><path d="M16 24Q10 33 16 39" fill="none" stroke="#ffe3ad" stroke-width="5" stroke-linecap="round" opacity=".76"/><path d="M44 25Q51 32 46 42" fill="none" stroke="#b72d2f" stroke-width="2.5" opacity=".58"/>'
 :'<path d="M31 17Q16 7 10 23Q6 34 17 48Q25 58 31 60Q40 55 50 39Q57 22 46 17Q40 10 31 17Z" fill="url(#'+id+'g)" stroke="#b53642" stroke-width="2.2"/><path d="M31 18Q23 6 9 12Q15 20 27 23Q16 25 17 32Q29 32 31 21Q34 32 45 30Q43 23 35 21Q48 23 54 13Q42 8 31 18Z" fill="url(#'+id+'leaf)" stroke="#367646" stroke-width="1.4"/><path d="M30 17l1-9" stroke="#48764b" stroke-width="2.4"/><path d="M17 23Q14 34 20 42" fill="none" stroke="#ffd9b2" stroke-width="3.5" stroke-linecap="round" opacity=".64"/>'+Array.from({length:12},(_,i)=>'<ellipse cx="'+(19+(i%4)*7+(i%2)*2)+'" cy="'+(27+Math.floor(i/4)*8)+'" rx="1.3" ry="2.3" fill="#ffe2a2" transform="rotate('+(i%2?23:-23)+' '+(19+(i%4)*7+(i%2)*2)+' '+(27+Math.floor(i/4)*8)+')"/>').join('');
 return '<svg class="mp3-object" viewBox="0 0 64 64" focusable="false" aria-hidden="true"><defs>'+
 '<radialGradient id="'+id+'g" cx="'+(26+light)+'%" cy="18%" r="87%"><stop stop-color="'+p[2]+'"/><stop offset=".40" stop-color="'+p[0]+'"/><stop offset=".79" stop-color="'+p[1]+'"/><stop offset="1" stop-color="#723d31"/></radialGradient>'+
 '<linearGradient id="'+id+'leaf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#91b761"/><stop offset="1" stop-color="#356f40"/></linearGradient>'+
 '<linearGradient id="'+id+'stem" x1="0" x2="1"><stop stop-color="#fdf1cf"/><stop offset=".6" stop-color="#efd1a4"/><stop offset="1" stop-color="#be9469"/></linearGradient>'+
 '</defs><ellipse cx="32" cy="60" rx="23" ry="3" fill="#51351e" opacity=".17"/>'+spec+'</svg>';
}
const mp4Handle='<svg viewBox="0 0 240 90" preserveAspectRatio="none" aria-hidden="true"><path d="M20 83Q16 5 120 7Q224 5 220 83" stroke="#71472c" stroke-width="14" stroke-linecap="round" fill="none"/><path d="M20 83Q16 5 120 7Q224 5 220 83" stroke="#c78b50" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M20 83Q16 5 120 7Q224 5 220 83" stroke="#ffdfab" stroke-width="2.5" stroke-dasharray="7 5" stroke-linecap="round" fill="none" opacity=".84"/></svg>';
const mp4Flowers='<svg viewBox="0 0 98 48" aria-hidden="true"><path d="M6 39Q30 12 77 30M30 34Q40 4 72 8" stroke="#618044" stroke-width="3" fill="none"/><path d="M29 34Q16 17 12 27Q14 34 29 34ZM46 21Q39 4 29 11Q28 19 46 21ZM61 24Q68 8 78 12Q80 20 61 24ZM75 29Q85 18 94 26Q89 33 75 29Z" fill="#698d4d" stroke="#476a35" stroke-width="1"/><g fill="#fff9e7" stroke="#ebdcc4" stroke-width=".4"><ellipse cx="46" cy="29" rx="4" ry="9"/><ellipse cx="46" cy="29" rx="4" ry="9" transform="rotate(60 46 29)"/><ellipse cx="46" cy="29" rx="4" ry="9" transform="rotate(120 46 29)"/><ellipse cx="80" cy="19" rx="3" ry="7"/><ellipse cx="80" cy="19" rx="3" ry="7" transform="rotate(60 80 19)"/><ellipse cx="80" cy="19" rx="3" ry="7" transform="rotate(120 80 19)"/></g><circle cx="46" cy="29" r="4.3" fill="#e8bb4b"/><circle cx="80" cy="19" r="3.5" fill="#e8bb4b"/></svg>';
function render(a,b,theme='strawberry'){
 a=Math.max(1,Math.min(10,Number(a)||1));b=Math.max(1,Math.min(10,Number(b)||1));
 if(!THEMES.some(t=>t.id===theme))theme='strawberry';
 const item=THEMES.find(t=>t.id===theme);
 let html='<div class="mp-apples mp3-collections mp4-collections" data-mp3-theme="'+theme+'" data-mp3-groups="'+a+'" data-mp3-each="'+b+'" role="group" aria-label="'+a+' grupper med '+b+' '+item.item+' i hver">';
 for(let g=0;g<a;g++){
  html+='<div class="mp-apple-basket mp3-basket mp4-basket" role="group" aria-label="Gruppe '+(g+1)+': '+b+' '+item.item+'"><span class="mp4-handle" aria-hidden="true">'+mp4Handle+'</span><span class="mp4-basket-liner" aria-hidden="true"></span><span class="mp4-floral" aria-hidden="true">'+mp4Flowers+'</span><div class="mp-apple-fruits mp3-fruits" style="--mp3-cols:'+(b>=9?5:b>=5?3:b===4?2:b)+'">';
  for(let n=0;n<b;n++)html+='<span class="mp-apple mp3-item" role="img" aria-label="'+item.singular+'">'+sprite(theme,g*10+n)+'</span>';
  html+='</div><span class="mp4-basket-front" aria-hidden="true"></span><span class="mp-basket-number">'+(g+1)+'</span></div>';
 }
 return html+'</div>';
}
function picker(theme){
 return '<div class="mp3-picker" role="group" aria-label="Velg illustrasjoner"><span>Velg motiv</span>'+THEMES.map((t,i)=>'<button type="button" data-mp-action="theme" data-theme="'+t.id+'" class="mp3-theme'+(theme===t.id?' active':'')+'" aria-pressed="'+(theme===t.id)+'"><span class="mp3-theme-art" aria-hidden="true">'+sprite(t.id,900+i)+'</span><span>'+t.name+'</span></button>').join('')+'</div>';
}
window.LARIA_MULT_ILLUSTRATED_V3={themes:THEMES.map(t=>t.id),render,picker};
})();