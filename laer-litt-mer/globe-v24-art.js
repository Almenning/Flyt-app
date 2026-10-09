(()=>{'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

/* Broad biome washes. They stay clipped to real land geometry in the renderer. */
const TERRAIN=[
  ['forest',-112,55,1.02],['forest',-88,51,.82],['forest',-63,-4,1.34],['forest',-72,-12,.98],
  ['forest',12,55,.82],['forest',28,60,.92],['forest',54,60,1.18],['forest',82,61,1.18],['forest',108,58,1.12],
  ['forest',23,1,1.02],['forest',104,17,1.06],['forest',118,-4,.84],
  ['desert',-8,25,1.22],['desert',11,25,1.48],['desert',31,25,1.42],['desert',49,25,1.02],
  ['desert',68,37,.72],['desert',78,27,.74],['desert',134,-24,1.14],['desert',-108,31,.58],
  ['savanna',12,8,.92],['savanna',28,-4,1.14],['savanna',25,-21,1.04],['savanna',-58,-20,.72],
  ['savanna',78,18,.64],['savanna',103,39,.62],
  ['snow',-42,72,1.28],['snow',18,69,.82],['snow',92,68,1.12],['snow',-108,68,.98]
];

/* Discovery details: natural first, landmarks second. Coordinates are intentionally sparse. */
const FEATURES=[
  ['mountains',10,46,.92],['mountains',79,31,1.22],['mountains',91,37,.88],['mountains',-109,40,.96],
  ['mountains',-70,-24,1.02],['mountains',39,8,.64],['mountains',147,-37,.72],
  ['trees',20,61,.92],['trees',54,58,.96],['trees',99,57,.92],['trees',-104,52,.92],
  ['jungle',-61,-5,1.02],['jungle',23,0,.86],['jungle',104,16,.78],
  ['village',16,50,.84],['village',33,56,.66],['village',77,28,.70],
  ['pyramids',30,27,.78],['camel',11,24,.68],['elephant',28,-3,.78],['giraffe',23,-25,.76],
  ['lighthouse',-9,38,.62],['lighthouse',-71,42,.58],
  ['ship',-29,24,.96,0],['ship',72,-15,.84,1],['ship',145,-9,.68,1],
  ['whale',-27,-31,1.04],['whale',150,-31,.72],['dolphin',-119,18,.66],['dolphin',112,-22,.62],
  ['island',73,5,.72],['island',151,-18,.62],['cloud',-8,44,.94],['cloud',43,-5,.84],
  ['cloud',-145,18,.72],['cloud',112,-20,.72],['plane',7,-1,.56]
];

function shadow(ctx,blur=8,y=3,color='rgba(49,53,39,.22)'){
  ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.shadowOffsetY=y;
}
function stroke(ctx,color='rgba(87,61,35,.50)',w=1.5){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineJoin='round';ctx.lineCap='round'}

function tree(ctx,x,y,k,variant=0){
  ctx.save();ctx.translate(x,y);shadow(ctx,k*.15,k*.06,'rgba(38,66,40,.20)');
  ctx.fillStyle='#765032';ctx.fillRect(-k*.065,k*.03,k*.13,k*.42);
  const cols=variant?['#35804A','#50A358','#76B55F']:['#286943','#3F8850','#5AA45A'];
  for(const a of [[-.38,.58,cols[0]],[-.16,.78,cols[1]],[.09,.94,cols[2]]]){
    ctx.fillStyle=a[2];ctx.beginPath();ctx.moveTo(0,k*(a[0]-.42));ctx.lineTo(-k*a[1]*.48,k*(a[0]+.24));ctx.quadraticCurveTo(0,k*(a[0]+.12),k*a[1]*.48,k*(a[0]+.24));ctx.closePath();ctx.fill();
  }ctx.restore();
}
function trees(ctx,x,y,k){
  ctx.save();ctx.globalAlpha=.98;tree(ctx,x-k*.38,y+k*.10,k*.72);tree(ctx,x+k*.31,y+k*.13,k*.63,1);tree(ctx,x,y-k*.06,k,1);ctx.restore();
}
function jungle(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);shadow(ctx,k*.16,k*.05,'rgba(38,76,42,.18)');
  for(const a of [[-.43,.08,.42,'#2F8248'],[-.15,-.18,.56,'#4FA35A'],[.22,-.08,.50,'#2A7644'],[.46,.11,.36,'#70B45F']]){
    ctx.fillStyle=a[3];ctx.beginPath();ctx.arc(k*a[0],k*a[1],k*a[2],0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='#E6C95E';for(const a of [[-.28,-.25],[.08,.18],[.38,-.02]]){ctx.beginPath();ctx.arc(k*a[0],k*a[1],k*.055,0,Math.PI*2);ctx.fill()}
  ctx.restore();
}
function mountains(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);shadow(ctx,k*.14,k*.055,'rgba(45,55,48,.16)');
  for(const a of [[-.46,.10,.68,'#9A9485'],[0,-.08,1,'#8C8B82'],[.47,.12,.65,'#7E8982']]){
    const m=k*a[2];ctx.save();ctx.translate(k*a[0],k*a[1]);ctx.fillStyle=a[3];
    ctx.beginPath();ctx.moveTo(0,-m*.68);ctx.lineTo(-m*.72,m*.48);ctx.lineTo(m*.72,m*.48);ctx.closePath();ctx.fill();
    ctx.fillStyle='#FFFCF1';ctx.beginPath();ctx.moveTo(0,-m*.68);ctx.lineTo(-m*.30,-m*.17);ctx.lineTo(-m*.08,-m*.28);ctx.lineTo(m*.12,-m*.10);ctx.lineTo(m*.31,-m*.02);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=Math.max(1,m*.045);ctx.beginPath();ctx.moveTo(-m*.51,m*.35);ctx.lineTo(0,-m*.58);ctx.stroke();ctx.restore();
  }ctx.restore();
}
function cloud(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);shadow(ctx,k*.10,k*.05,'rgba(41,72,79,.13)');ctx.fillStyle='rgba(252,254,255,.92)';
  for(const a of [[-.34,.05,.33],[-.07,-.18,.41],[.28,-.02,.34],[.04,.16,.48]]){ctx.beginPath();ctx.arc(k*a[0],k*a[1],k*a[2],0,Math.PI*2);ctx.fill()}
  ctx.restore();
}
function ship(ctx,x,y,k,flip){
  ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);shadow(ctx,k*.12,k*.05,'rgba(47,54,43,.20)');
  ctx.fillStyle='#754524';stroke(ctx,'#4D321F',Math.max(1,k*.055));ctx.beginPath();ctx.moveTo(-k*.62,k*.24);ctx.lineTo(k*.60,k*.24);ctx.lineTo(k*.36,k*.52);ctx.lineTo(-k*.42,k*.52);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#66401F';ctx.lineWidth=Math.max(1,k*.065);ctx.beginPath();ctx.moveTo(0,-k*.66);ctx.lineTo(0,k*.24);ctx.stroke();
  ctx.fillStyle='#FFF0C8';ctx.beginPath();ctx.moveTo(-k*.04,-k*.58);ctx.lineTo(-k*.04,k*.08);ctx.lineTo(-k*.52,k*.04);ctx.closePath();ctx.fill();
  ctx.fillStyle='#EFC15A';ctx.beginPath();ctx.moveTo(k*.07,-k*.43);ctx.lineTo(k*.07,k*.10);ctx.lineTo(k*.44,k*.08);ctx.closePath();ctx.fill();
  ctx.fillStyle='#D95643';ctx.fillRect(-k*.03,-k*.66,k*.19,k*.11);ctx.restore();
}
function whale(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.12);shadow(ctx,k*.10,k*.04,'rgba(25,61,86,.16)');ctx.fillStyle='#236B9B';
  ctx.beginPath();ctx.ellipse(0,0,k*.62,k*.28,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(k*.50,-k*.04);ctx.lineTo(k*.97,-k*.33);ctx.lineTo(k*.79,k*.02);ctx.lineTo(k*.98,k*.25);ctx.lineTo(k*.51,k*.09);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.ellipse(-k*.20,-k*.11,k*.23,k*.065,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#123F5D';ctx.beginPath();ctx.arc(-k*.35,-k*.03,k*.035,0,Math.PI*2);ctx.fill();ctx.restore();
}
function dolphin(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.22);shadow(ctx,k*.08,k*.03,'rgba(24,67,88,.15)');ctx.fillStyle='#3A87AC';
  ctx.beginPath();ctx.moveTo(-k*.60,k*.08);ctx.quadraticCurveTo(-k*.18,-k*.38,k*.35,-k*.08);ctx.quadraticCurveTo(k*.52,0,k*.65,-k*.03);ctx.quadraticCurveTo(k*.50,k*.20,k*.22,k*.16);ctx.quadraticCurveTo(-k*.18,k*.34,-k*.60,k*.08);ctx.fill();
  ctx.beginPath();ctx.moveTo(-k*.08,-k*.18);ctx.lineTo(k*.10,-k*.48);ctx.lineTo(k*.17,-k*.12);ctx.fill();ctx.restore();
}
function pyramids(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);shadow(ctx,k*.12,k*.05,'rgba(94,67,31,.18)');
  for(const a of [[-.32,.76,'#D79A3B'],[.20,1,'#E4AE4C'],[.52,.55,'#C78935']]){
    ctx.fillStyle=a[2];stroke(ctx,'rgba(124,77,29,.38)',Math.max(1,k*.035));ctx.beginPath();ctx.moveTo(k*a[0],-k*.46*a[1]);ctx.lineTo(k*(a[0]-.42*a[1]),k*.34*a[1]);ctx.lineTo(k*(a[0]+.42*a[1]),k*.34*a[1]);ctx.closePath();ctx.fill();ctx.stroke();
  }ctx.restore();
}
function village(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);shadow(ctx,k*.14,k*.055,'rgba(71,54,35,.18)');
  for(const a of [[-.42,.14,.70,'#CC5A41'],[0,.02,1,'#E0784A'],[.42,.16,.70,'#C45A3D']]){
    ctx.fillStyle='#F7E4B9';ctx.fillRect(k*(a[0]-.17*a[2]),k*(a[1]-.02*a[2]),k*.34*a[2],k*.30*a[2]);ctx.fillStyle=a[3];
    ctx.beginPath();ctx.moveTo(k*(a[0]-.23*a[2]),k*(a[1]-.02*a[2]));ctx.lineTo(k*a[0],k*(a[1]-.25*a[2]));ctx.lineTo(k*(a[0]+.23*a[2]),k*(a[1]-.02*a[2]));ctx.closePath();ctx.fill();
    ctx.fillStyle='#8BC0C9';ctx.fillRect(k*(a[0]-.06*a[2]),k*(a[1]+.07*a[2]),k*.10*a[2],k*.09*a[2]);
  }
  ctx.fillStyle='#EEE5CE';ctx.fillRect(-k*.06,-k*.54,k*.12,k*.50);ctx.fillStyle='#C6543F';ctx.beginPath();ctx.moveTo(-k*.10,-k*.54);ctx.lineTo(0,-k*.70);ctx.lineTo(k*.10,-k*.54);ctx.closePath();ctx.fill();ctx.restore();
}
function elephant(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);shadow(ctx,k*.10,k*.04,'rgba(68,66,55,.18)');ctx.fillStyle='#7A7B70';ctx.beginPath();ctx.ellipse(-k*.05,0,k*.46,k*.29,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(k*.34,-k*.03,k*.22,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#7A7B70';ctx.lineWidth=k*.10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(k*.47,k*.04);ctx.quadraticCurveTo(k*.65,k*.22,k*.55,k*.42);ctx.stroke();ctx.fillStyle='#EEE6D5';ctx.beginPath();ctx.arc(k*.41,-k*.02,k*.025,0,Math.PI*2);ctx.fill();ctx.restore();
}
function giraffe(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);shadow(ctx,k*.10,k*.04,'rgba(77,61,35,.18)');ctx.fillStyle='#D8A644';ctx.beginPath();ctx.ellipse(-k*.08,k*.10,k*.31,k*.20,0,0,Math.PI*2);ctx.fill();ctx.fillRect(k*.08,-k*.44,k*.10,k*.50);ctx.beginPath();ctx.ellipse(k*.17,-k*.50,k*.16,k*.10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8D6330';for(const a of [[-.18,.03],[-.01,.12],[.12,-.20],[.10,-.36]]){ctx.beginPath();ctx.arc(k*a[0],k*a[1],k*.055,0,Math.PI*2);ctx.fill()}ctx.restore();
}
function camel(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);shadow(ctx,k*.10,k*.04,'rgba(78,58,32,.18)');ctx.fillStyle='#AA6F37';ctx.beginPath();ctx.moveTo(-k*.42,k*.18);ctx.quadraticCurveTo(-k*.30,-k*.18,-k*.12,k*.05);ctx.quadraticCurveTo(k*.02,-k*.26,k*.18,k*.03);ctx.quadraticCurveTo(k*.34,-k*.08,k*.45,k*.10);ctx.lineTo(k*.34,k*.28);ctx.lineTo(-k*.36,k*.28);ctx.closePath();ctx.fill();ctx.fillRect(k*.34,-k*.18,k*.08,k*.30);ctx.restore();
}
function island(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);shadow(ctx,k*.09,k*.04,'rgba(64,65,40,.15)');ctx.fillStyle='#E9CB68';ctx.beginPath();ctx.ellipse(0,k*.18,k*.38,k*.12,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#785532';ctx.lineWidth=k*.06;ctx.beginPath();ctx.moveTo(0,k*.12);ctx.lineTo(k*.03,-k*.40);ctx.stroke();ctx.strokeStyle='#2F8B4B';ctx.lineWidth=k*.10;for(const a of [-1.2,-.65,-.15,.4,1]){ctx.beginPath();ctx.moveTo(k*.02,-k*.30);ctx.quadraticCurveTo(k*.22*Math.cos(a),-k*.50,k*.38*Math.cos(a),-k*.37+k*.10*Math.sin(a));ctx.stroke()}ctx.restore();
}
function lighthouse(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);shadow(ctx,k*.12,k*.04,'rgba(60,52,37,.17)');ctx.fillStyle='#F8EBC8';ctx.beginPath();ctx.moveTo(-k*.18,k*.42);ctx.lineTo(-k*.12,-k*.25);ctx.lineTo(k*.12,-k*.25);ctx.lineTo(k*.18,k*.42);ctx.closePath();ctx.fill();ctx.fillStyle='#D95A47';ctx.fillRect(-k*.13,-k*.02,k*.26,k*.13);ctx.fillStyle='#6E4A2B';ctx.fillRect(-k*.20,-k*.34,k*.40,k*.09);ctx.fillStyle='#FFD76B';ctx.fillRect(-k*.10,-k*.30,k*.20,k*.08);ctx.restore();
}
function plane(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.22);ctx.fillStyle='rgba(247,253,255,.94)';shadow(ctx,k*.08,k*.03,'rgba(56,78,83,.12)');ctx.beginPath();ctx.moveTo(-k*.55,0);ctx.lineTo(k*.58,-k*.07);ctx.lineTo(k*.14,k*.05);ctx.lineTo(-k*.06,k*.32);ctx.lineTo(-k*.16,k*.31);ctx.lineTo(-k*.03,k*.04);ctx.closePath();ctx.fill();ctx.restore();
}


/* v37: illustrated micro-terrain, not infographic symbols.
   The primitives are drawn at geographic positions by globe-v25-renderer and
   remain subordinate to the real coastline/country geometry. */
function paintedMountainRange(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.lineJoin='round';ctx.lineCap='round';
  shadow(ctx,Math.max(1,k*.15),k*.08,'rgba(41,65,63,.22)');
  const peaks=[
    {x:-.48,y:.12,size:.66,light:'#A6B7A7',shade:'#627E87'},
    {x:.03,y:-.09,size:1,light:'#B5C3B9',shade:'#728995'},
    {x:.53,y:.13,size:.72,light:'#AAB5A5',shade:'#657E82'}
  ];
  peaks.forEach((peak,i)=>{
    const m=k*peak.size,cx=k*peak.x,cy=k*peak.y;
    const apex=-m*.75,foot=m*.49;
    ctx.fillStyle=peak.shade;
    ctx.beginPath();ctx.moveTo(cx,cy+apex);
    ctx.lineTo(cx-m*.72,cy+foot);ctx.lineTo(cx+m*.72,cy+foot);
    ctx.closePath();ctx.fill();
    ctx.fillStyle=peak.light;
    ctx.beginPath();ctx.moveTo(cx,cy+apex);
    ctx.lineTo(cx-m*.72,cy+foot);
    ctx.lineTo(cx-m*.13,cy+foot*.8);
    ctx.closePath();ctx.fill();
    const snow=ctx.createLinearGradient(0,cy+apex,0,cy-m*.02);
    snow.addColorStop(0,'rgba(255,255,252,.98)');
    snow.addColorStop(.82,'rgba(247,253,246,.90)');
    snow.addColorStop(1,'rgba(239,248,249,.38)');
    ctx.fillStyle=snow;
    ctx.beginPath();ctx.moveTo(cx,cy+apex);
    ctx.lineTo(cx-m*.35,cy-m*.18);
    ctx.lineTo(cx-m*.19,cy-m*.21);
    ctx.lineTo(cx-m*.06,cy-m*.08);
    ctx.lineTo(cx+m*.12,cy-m*.18);
    ctx.lineTo(cx+m*.30,cy-m*.09);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle=i%2?'rgba(248,255,247,.49)':'rgba(243,251,247,.40)';
    ctx.lineWidth=Math.max(.8,k*.029);
    ctx.beginPath();ctx.moveTo(cx+m*.03,cy-m*.54);ctx.lineTo(cx+m*.25,cy+m*.19);ctx.stroke();
  });
  ctx.restore();
}
function paintedPines(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);
  const group=[[-.55,.14,.71],[-.21,.06,.64],[.34,.12,.69],[.09,-.14,1]];
  for(let i=0;i<group.length;i++){
    const [dx,dy,scale]=group[i],h=k*scale;
    const px=k*dx,py=k*dy;
    ctx.fillStyle='rgba(49,49,34,.23)';
    ctx.beginPath();ctx.ellipse(px,py+h*.38,h*.30,h*.10,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#725039';ctx.fillRect(px-h*.053,py-h*.02,h*.107,h*.57);
    for(let j=0;j<3;j++){
      const top=py-h*(.72-j*.26),half=h*(.20+j*.115);
      const g=ctx.createLinearGradient(px-half,top,px+half,py+h*.11);
      g.addColorStop(0,i%2?'#34815B':'#276F55');
      g.addColorStop(.52,i%2?'#4AA368':'#3C9965');
      g.addColorStop(1,'#174B48');
      ctx.fillStyle=g;
      ctx.beginPath();ctx.moveTo(px,top);
      ctx.quadraticCurveTo(px-half*.15,top+h*.11,px-half,top+h*.43);
      ctx.quadraticCurveTo(px,top+h*.30,px+half,top+h*.43);
      ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(184,227,164,.28)';
      ctx.lineWidth=Math.max(.65,h*.028);
      ctx.beginPath();ctx.moveTo(px-h*.07,top+h*.20);ctx.lineTo(px-half*.62,top+h*.37);ctx.stroke();
    }
  }
  ctx.restore();
}
function paintedVillage(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);
  shadow(ctx,k*.12,k*.06,'rgba(80,55,33,.20)');
  ctx.fillStyle='rgba(50,102,65,.37)';
  ctx.beginPath();ctx.ellipse(0,k*.40,k*.75,k*.16,0,0,Math.PI*2);ctx.fill();
  for(const [cx,cy,scale,color] of [
    [-.52,.18,.58,'#CC6043'],[-.17,.14,.84,'#BD5942'],
    [.20,.09,1,'#D77750'],[.54,.19,.63,'#BE5A45']
  ]){
    const q=k*scale,bx=k*cx,by=k*cy;
    ctx.fillStyle='#FFF3D6';
    ctx.fillRect(bx-q*.17,by-q*.10,q*.34,q*.41);
    ctx.fillStyle='#DEBA83';ctx.fillRect(bx+q*.10,by-q*.10,q*.07,q*.41);
    ctx.fillStyle=color;
    ctx.beginPath();ctx.moveTo(bx-q*.25,by-q*.10);
    ctx.lineTo(bx,by-q*.39);ctx.lineTo(bx+q*.26,by-q*.10);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(245,200,145,.70)';ctx.lineWidth=Math.max(.7,k*.020);
    ctx.beginPath();ctx.moveTo(bx-q*.18,by-q*.08);ctx.lineTo(bx,by-q*.30);ctx.stroke();
    ctx.fillStyle='#81BED0';
    ctx.fillRect(bx-q*.09,by+q*.02,q*.09,q*.105);
    ctx.fillRect(bx+q*.065,by+q*.02,q*.075,q*.105);
    ctx.fillStyle='#936447';ctx.fillRect(bx-q*.02,by+q*.17,q*.10,q*.14);
  }
  ctx.fillStyle='#FFF3D3';ctx.fillRect(-k*.025,-k*.48,k*.105,k*.48);
  ctx.fillStyle='#C85E45';
  ctx.beginPath();ctx.moveTo(-k*.08,-k*.48);
  ctx.lineTo(k*.029,-k*.69);ctx.lineTo(k*.14,-k*.48);ctx.closePath();ctx.fill();
  ctx.fillStyle='#D6A94B';ctx.fillRect(k*.029,-k*.74,k*.025,k*.07);
  ctx.restore();
}
function paintedJungle(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);shadow(ctx,k*.1,k*.04,'rgba(36,70,45,.17)');
  const layers=[
    [-.44,.08,.40,'#236F52'],[.40,.08,.37,'#2D7A4F'],
    [-.14,-.10,.55,'#398A5A'],[.18,-.17,.49,'#4A9D64'],
    [.05,.03,.44,'#66B77A']
  ];
  for(const [px,py,radius,color] of layers){
    const g=ctx.createRadialGradient(k*(px-.10),k*(py-.14),k*.035,k*px,k*py,k*radius);
    g.addColorStop(0,'#A1D68D');g.addColorStop(.32,color);g.addColorStop(1,'#1E664B');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(k*px,k*py,k*radius,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='#EAD36E';
  for(const [px,py] of [[-.23,-.30],[.18,-.21],[.36,.16]]){
    ctx.beginPath();ctx.arc(k*px,k*py,k*.043,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

window.LariaGlobeArtV24={clamp,TERRAIN,FEATURES,draw:{trees:paintedPines,jungle:paintedJungle,mountains:paintedMountainRange,cloud,ship,whale,dolphin,pyramids,village:paintedVillage,elephant,giraffe,camel,island,lighthouse,plane}};
})();