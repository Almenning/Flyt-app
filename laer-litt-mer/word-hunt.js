(()=>{'use strict';
const EASY_WORDS=['SOL','MUS','REV','BOK','IS','MAT','HUS','BIL','TRE','SKO','LYS','HAV','FISK','KATT','BALL','LEK'];
const HARD_WORDS=['SKOG','BRO','KART','VANN','LYKT','REVEN','FJELL','VENN','LEKE','TALL','PIZZA','BLOMST','STJERNE','SPRÅK','ORD','BOKA'];
const LETTERS='ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ';
const KEY='laria-wordhunt-v1';
let ui={level:'easy',size:6,grid:[],words:[],found:new Map(),drag:null,tapStart:null,completed:false};
function stats(){try{return JSON.parse(localStorage.getItem(KEY)||'{"rounds":0}')||{rounds:0}}catch(_){return {rounds:0}}}
function saveRound(){const s=stats();s.rounds=Number(s.rounds||0)+1;localStorage.setItem(KEY,JSON.stringify(s))}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function dirSet(){return ui.level==='easy'?[[0,1],[1,0]]:[[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]}
function makeRound(){
  ui.size=ui.level==='easy'?6:7;ui.found=new Map();ui.completed=false;ui.tapStart=null;ui.drag=null;
  const pool=shuffle(ui.level==='easy'?EASY_WORDS:HARD_WORDS).filter(w=>w.length<=ui.size);
  const requested=pool.slice(0,ui.level==='easy'?4:5),placedWords=[];
  ui.words=requested;
  ui.grid=Array.from({length:ui.size},()=>Array(ui.size).fill(''));
  const dirs=dirSet();
  for(const word of requested){
    let placed=false;
    for(let tries=0;tries<220&&!placed;tries++){
      const [dr,dc]=dirs[Math.floor(Math.random()*dirs.length)],r=Math.floor(Math.random()*ui.size),c=Math.floor(Math.random()*ui.size);
      const er=r+dr*(word.length-1),ec=c+dc*(word.length-1);
      if(er<0||ec<0||er>=ui.size||ec>=ui.size)continue;
      let ok=true;
      for(let i=0;i<word.length;i++){const rr=r+dr*i,cc=c+dc*i,ch=ui.grid[rr][cc];if(ch&&ch!==word[i]){ok=false;break}}
      if(!ok)continue;
      for(let i=0;i<word.length;i++)ui.grid[r+dr*i][c+dc*i]=word[i];
      placed=true;placedWords.push(word);
    }
  }
  ui.words=placedWords;
  if(ui.words.length<3){makeRound();return}
  for(let r=0;r<ui.size;r++)for(let c=0;c<ui.size;c++)if(!ui.grid[r][c])ui.grid[r][c]=LETTERS[Math.floor(Math.random()*LETTERS.length)];
}
function overlay(){
  let root=document.getElementById('word-hunt-overlay');if(root)return root;
  root=document.createElement('section');root.id='word-hunt-overlay';root.className='word-hunt-overlay';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Ordjakt i Bokskogen');
  root.innerHTML='<div class="word-hunt-shell"><div class="word-hunt-top"><button type="button" class="word-hunt-back" aria-label="Tilbake til Læria">←</button><div class="word-hunt-title"><small>Lek & utforsk</small><h1>Ordjakt i Bokskogen</h1></div><img class="word-hunt-fox" src="./lia-fox-explorer-home.webp" alt="" aria-hidden="true"></div><div class="word-hunt-intro">Finn ordene som har gjemt seg mellom bokstavene. Dra over et ord, eller trykk første og siste bokstav.</div><div class="word-hunt-levels" role="group" aria-label="Velg vanskelighetsgrad"><button type="button" class="word-hunt-level" data-word-level="easy">🌱 Rolig</button><button type="button" class="word-hunt-level" data-word-level="hard">✨ Litt lurere</button></div><div class="word-hunt-board-wrap"><div class="word-hunt-board-card"><div class="word-hunt-board" role="grid" aria-label="Bokstavrutenett"></div></div><aside class="word-hunt-side"><div class="word-hunt-targets"><h2>Finn disse</h2><div class="word-hunt-words"></div></div><div class="word-hunt-status" aria-live="polite"></div><div class="word-hunt-actions"><button type="button" class="word-hunt-new">Ny runde</button><div class="word-hunt-rounds"></div></div></aside></div></div>';
  document.body.append(root);
  root.querySelector('.word-hunt-back').onclick=closeWordHunt;
  root.querySelector('.word-hunt-new').onclick=()=>{makeRound();render()};
  root.querySelectorAll('[data-word-level]').forEach(b=>b.onclick=()=>{ui.level=b.dataset.wordLevel;makeRound();render()});
  const board=root.querySelector('.word-hunt-board');
  board.addEventListener('pointerdown',pointerDown);
  board.addEventListener('pointermove',pointerMove);
  board.addEventListener('pointerup',pointerUp);
  board.addEventListener('pointercancel',clearPreview);
  board.addEventListener('click',tapSelect);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!root.hidden)closeWordHunt()});
  return root;
}
function cellFromEvent(e){return document.elementFromPoint(e.clientX,e.clientY)?.closest('.word-hunt-cell')}
function coord(cell){return cell?[Number(cell.dataset.r),Number(cell.dataset.c)]:null}
function line(a,b){
  if(!a||!b)return[];const [r1,c1]=a,[r2,c2]=b,dr=r2-r1,dc=c2-c1;
  if(!(dr===0||dc===0||Math.abs(dr)===Math.abs(dc)))return[];
  const n=Math.max(Math.abs(dr),Math.abs(dc)),sr=n?Math.sign(dr):0,sc=n?Math.sign(dc):0,out=[];
  for(let i=0;i<=n;i++)out.push([r1+sr*i,c1+sc*i]);return out
}
function wordFor(path){return path.map(([r,c])=>ui.grid[r][c]).join('')}
function keyPath(path){return path.map(([r,c])=>r+':'+c).join('|')}
function preview(path,anchor=false){
  const root=overlay();root.querySelectorAll('.word-hunt-cell').forEach(x=>x.classList.remove('preview','anchor'));
  if(anchor&&path[0])root.querySelector('[data-r="'+path[0][0]+'"][data-c="'+path[0][1]+'"]')?.classList.add('anchor');
  else for(const [r,c] of path)root.querySelector('[data-r="'+r+'"][data-c="'+c+'"]')?.classList.add('preview')
}
function clearPreview(){ui.drag=null;preview(ui.tapStart?[ui.tapStart]:[],!!ui.tapStart)}
function pointerDown(e){
  const cell=e.target.closest('.word-hunt-cell');if(!cell)return;
  ui.tapStart=null;ui.drag={id:e.pointerId,start:coord(cell),end:coord(cell),moved:false};try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}
}
function pointerMove(e){
  if(!ui.drag||ui.drag.id!==e.pointerId)return;const cell=cellFromEvent(e);if(!cell)return;
  const end=coord(cell);if(end[0]!==ui.drag.start[0]||end[1]!==ui.drag.start[1])ui.drag.moved=true;ui.drag.end=end;preview(line(ui.drag.start,end))
}
function pointerUp(e){
  if(!ui.drag||ui.drag.id!==e.pointerId)return;const d=ui.drag;ui.drag=null;
  if(d.moved){e.preventDefault();checkLine(line(d.start,d.end));overlay().dataset.draggedUntil=String(Date.now()+250)}
  else preview([],false)
}
function tapSelect(e){
  const root=overlay();if(Number(root.dataset.draggedUntil||0)>Date.now())return;
  const cell=e.target.closest('.word-hunt-cell');if(!cell)return;const p=coord(cell);
  if(!ui.tapStart){ui.tapStart=p;preview([p],true);status('Velg siste bokstav i ordet.');return}
  const start=ui.tapStart;ui.tapStart=null;checkLine(line(start,p))
}
function checkLine(path){
  if(path.length<2){preview([],false);status('Velg bokstavene langs et ord.');return}
  const raw=wordFor(path),rev=[...raw].reverse().join('');let hit=null;
  for(const w of ui.words)if(!ui.found.has(w)&&(w===raw||w===rev)){hit=w;break}
  if(!hit){preview([],false);status('Ikke et av ordene denne gangen. Prøv en annen retning.');return}
  ui.found.set(hit,path);preview([],false);
  try{navigator.vibrate?.(22)}catch(_){}
  try{typeof playSuccessTone==='function'&&playSuccessTone()}catch(_){}
  if(ui.found.size===ui.words.length){
    ui.completed=true;saveRound();status('Du fant alle ordene! 🌟 Du kan ta en ny runde, eller gå tilbake til basecamp.',true);
  }else status('Fant '+hit+'! '+(ui.words.length-ui.found.size)+' igjen.');
  render(false)
}
function status(message,success=false){
  const s=overlay().querySelector('.word-hunt-status');s.innerHTML='<strong>'+(success?'Ordjakten er løst!':'Reven følger med 🦊')+'</strong>'+message;
  if(success){s.classList.remove('word-hunt-success');void s.offsetWidth;s.classList.add('word-hunt-success')}
}
function render(resetStatus=true){
  const root=overlay(),board=root.querySelector('.word-hunt-board');board.style.setProperty('--size',ui.size);
  board.innerHTML=ui.grid.flatMap((row,r)=>row.map((ch,c)=>'<button type="button" class="word-hunt-cell" role="gridcell" data-r="'+r+'" data-c="'+c+'" aria-label="'+ch+'">'+ch+'</button>')).join('');
  for(const path of ui.found.values())for(const [r,c] of path)board.querySelector('[data-r="'+r+'"][data-c="'+c+'"]')?.classList.add('found');
  root.querySelector('.word-hunt-words').innerHTML=ui.words.map(w=>'<span class="word-hunt-word '+(ui.found.has(w)?'found':'')+'">'+(ui.found.has(w)?'✓ ':'')+w+'</span>').join('');
  root.querySelectorAll('[data-word-level]').forEach(b=>b.classList.toggle('active',b.dataset.wordLevel===ui.level));
  root.querySelector('.word-hunt-rounds').textContent=stats().rounds+' ordjakter fullført på denne enheten';
  if(resetStatus)status(ui.level==='easy'?'Fire ord har gjemt seg i rutenettet.':'Nå kan ordene også ligge baklengs og på skrå.');
}
function openWordHunt(){
  const root=overlay();if(!ui.grid.length)makeRound();render();root.hidden=false;document.documentElement.style.overflow='hidden';root.querySelector('.word-hunt-back').focus({preventScroll:true})
}
function closeWordHunt(){const root=overlay();root.hidden=true;document.documentElement.style.overflow='';ui.drag=null;ui.tapStart=null}
window.openWordHunt=openWordHunt;window.closeWordHunt=closeWordHunt;
})();