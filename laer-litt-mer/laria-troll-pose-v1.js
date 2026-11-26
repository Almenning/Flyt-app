/* Non-destructive pose rig: approved artwork with native transparency.
 * Horizontal bands follow the head, upper body and feet at different rates.
 * Only visible, full-size companions receive animation. Buttons and speech stay in the DOM. */
(function(){
  'use strict';
  const W=512,H=1024,STEP=8;
  const ART='.laria-troll-actor > img:is(.laria-premium-troll-art,.ki-troll)[src*="/troll-b/gangemagi-troll/"]';
  const SETTINGS={
    storesoster:{head:220,body:480,feet:935,style:1},
    lillesoster:{head:245,body:505,feet:922,style:1.16},
    lillebror:{head:325,body:558,feet:904,style:1.28}
  };
  const poses={
    wave:[0,130,285,460,650,865,1080].map((t,i)=>[t,...[[0,0,0],[-4,1,0],[14,-2,0],[8,-5,0],[15,-2,0],[5,-1,0],[0,0,0]][i]]),
    celebrate:[[0,0,0,0],[115,-3,19,0],[240,3,-13,24],[355,6,-5,56],[465,3,-5,25],[590,0,15,0],[740,-3,-4,0],[920,0,0,0]],
    think:[[0,0,0,0],[270,-18,3,0],[770,-16,2,0],[1140,0,0,0]],
    hint:[[0,0,0,0],[200,18,-5,0],[620,11,4,0],[870,13,1,0],[1240,0,0,0]],
    support:[[0,0,0,0],[270,-8,10,0],[530,-6,-3,0],[850,-4,7,0],[1120,0,0,0]],
    curious:[[0,0,0,0],[180,14,-5,0],[480,9,2,0],[960,0,0,0]],
    walking:[[0,0,0,0],[150,-8,-3,23],[290,-5,8,0],[470,10,-4,20],[640,5,7,0],[840,0,0,0]]
  };
  const q=matchMedia('(prefers-reduced-motion: reduce)');
  const actors=new Map(),sources=new Map();
  let raf=0, scanQueued=false, last=0;
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function readImage(src){
    return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
  }
  function texture(src){
    if(!sources.has(src)){
      sources.set(src,readImage(src).catch(()=>null)); // CSS still has the clean, static silhouette if canvas is unavailable.
    }
    return sources.get(src);
  }
  function release(a){
    a.img.removeAttribute('data-laria-troll-posed');
    a.layer?.remove();a.layer=null;
  }
  function setMood(a,mood,now){a.mood=mood;a.start=now;}
  function key(frames,t){
    let i=1;while(i<frames.length&&t>=frames[i][0])i++;
    if(i===frames.length)return frames[i-1].slice(1);
    const a=frames[i-1],b=frames[i],p=(t-a[0])/(b[0]-a[0]),k=p*p*(3-2*p);
    return [1,2,3].map(j=>a[j]+(b[j]-a[j])*k);
  }
  function layout(a){
    const img=a.img,host=a.host;
    if(!a.visible||!img.offsetWidth||!img.offsetHeight||getComputedStyle(img).visibility!=='visible')return null;
    // Containing blocks differ across old and new screens. Never change the host layout.
    if(getComputedStyle(host).position==='static')host.classList.add('laria-troll-pose-anchor');
    const css=getComputedStyle(img),rect=img.getBoundingClientRect(),base=host.getBoundingClientRect();
    const sx=host.offsetWidth?base.width/host.offsetWidth:0, sy=host.offsetHeight?base.height/host.offsetHeight:0;
    if(!sx||!sy||getComputedStyle(host).position==='static'||rect.height<82||css.objectFit!=='contain')return null;
    const px=n=>parseFloat(n)||0;
    const pl=px(css.paddingLeft)+px(css.borderLeftWidth),pr=px(css.paddingRight)+px(css.borderRightWidth);
    const pt=px(css.paddingTop)+px(css.borderTopWidth),pb=px(css.paddingBottom)+px(css.borderBottomWidth);
    const cw=img.offsetWidth-pl-pr,ch=img.offsetHeight-pt-pb;
    const h=Math.min(ch,2*cw),w=h/2;
    if(w<30||h<82)return null;
    const centered=css.objectPosition.endsWith('50%')||css.objectPosition.endsWith('center');
    const x=(rect.left-base.left)/sx-host.clientLeft+pl+(cw-w)/2;
    const y=(rect.top-base.top)/sy-host.clientTop+pt+(ch-h)*(centered?.5:1);
    return {x,y,w,h};
  }
  function draw(a,now){
    const l=layout(a);
    if(!l){release(a);return;}
    if(!a.layer){
      a.layer=canvas(1,1);a.layer.className='laria-troll-pose';a.layer.setAttribute('aria-hidden','true');
      a.ctx=a.layer.getContext('2d');if(!a.ctx){a.layer=null;return;}
      a.host.appendChild(a.layer);
    }
    const sig=[l.x,l.y,l.w,l.h,devicePixelRatio].join('|');
    if(a.layout!==sig||a.layer.width===1){
      a.layout=sig;
      const d=Math.min(3,devicePixelRatio||1);
      a.layer.width=Math.max(1,Math.round(l.w*d));
      a.layer.height=Math.max(1,Math.round(l.h*d));
      Object.assign(a.layer.style,{left:l.x+'px',top:l.y+'px',width:l.w+'px',height:l.h+'px'});
    }
    const w=a.layer.width,h=a.layer.height,f=h/H,c=a.ctx,g=SETTINGS[a.id];
    const t=now-a.start, calm=(1-Math.cos((now+a.seed)*.00145))/2;
    const [lean,press,hop]=poses[a.mood]?key(poses[a.mood],t):[0,0,0];
    c.clearRect(0,0,w,h);c.imageSmoothingQuality="high";
    let previous=null;
    for(let y=0;y<=H;y+=STEP){
      const upper=Math.max(0,1-y/g.feet);
      const head=Math.exp(-Math.pow((y-g.head)/202,2));
      const torso=Math.exp(-Math.pow((y-g.body)/170,2));
      const out=Math.round(f*(y+upper*(press*g.style-3.8*calm)-hop*g.style));
      if(previous!==null&&out>previous){
        const shift=(lean*g.style*(.32*upper+.68*head)+1.8*calm*upper)*w/W;
        const swell=(3*calm*torso-Math.min(0,press)*.12*torso)*w/W;
        const m=a.texture.naturalHeight/H;
        c.drawImage(a.texture,0,(y-STEP)*m,a.texture.naturalWidth,STEP*m,shift-swell/2,previous,w+swell,out-previous);
      }
      previous=out;
    }
    if(!a.img.hasAttribute('data-laria-troll-posed'))a.img.setAttribute('data-laria-troll-posed','');
  }
  function frame(now){
    raf=0;
    if(q.matches){for(const a of actors.values())release(a);return;}
    if(document.hidden||![...actors.values()].some(a=>a.visible&&a.texture))return;
    if(now-last>=60){
      last=now;
      for(const a of actors.values())if(a.visible&&a.texture&&a.img.isConnected)draw(a,now);
    }
    if(!raf)raf=requestAnimationFrame(frame);
  }
  function wake(){if(!raf&&!q.matches&&!document.hidden)raf=requestAnimationFrame(frame);}
  const observer=new IntersectionObserver(entries=>{
    for(const e of entries){
      const a=actors.get(e.target);if(a){a.visible=e.isIntersecting;if(!a.visible)release(a);else if(!a.texture&&!q.matches)load(a);}
    }
    wake();
  });
  function scan(){
    scanQueued=false;
    for(const [img,a] of actors)if(!img.isConnected||!img.matches(ART)||img.src!==a.src){
      release(a);observer.unobserve(img);actors.delete(img);
    }
    for(const img of document.querySelectorAll(ART)){
      if(actors.has(img))continue;
      const src=img.src,id=src.match(/\/([a-z]+)\.webp(?:[?#]|$)/)?.[1],host=img.parentElement;
      if(!SETTINGS[id]||!host||!img.getAttribute('src'))continue;
      const a={img,id,src,host,seed:Math.random()*4000,visible:false};
      setMood(a,host.dataset.lariaTrollMood||'idle',performance.now());
      actors.set(img,a);observer.observe(img);

    }
  }
  function load(a){
    texture(a.src).then(tex=>{if(actors.get(a.img)===a){a.texture=tex;wake();}});
  }
  function queueScan(){if(!scanQueued){scanQueued=true;requestAnimationFrame(scan);}}
  new MutationObserver(changes=>{
    if(changes.some(c=>c.type==='childList'?Array.from(c.addedNodes).concat(Array.from(c.removedNodes)).some(n=>n.nodeType===1&&
      (n.matches?.('img')||n.querySelector?.('img'))):c.target.matches?.('img')))queueScan();
    for(const c of changes)if(c.type==='attributes'&&c.target.classList.contains('laria-troll-actor')){
      for(const a of actors.values())if(a.host===c.target)setMood(a,a.host.dataset.lariaTrollMood||'idle',performance.now());
    }
    wake();
  }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','data-laria-troll-mood','data-laria-troll-beat']});
  q.addEventListener('change',()=>{
    for(const a of actors.values())if(q.matches)release(a);else if(a.visible&&!a.texture)load(a);
    wake();
  });
  document.addEventListener('visibilitychange',wake);
  scan();
})();
