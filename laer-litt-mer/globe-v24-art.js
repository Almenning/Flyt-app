(()=>{'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

/* Broad biome washes. They stay clipped to real land geometry in the renderer. */
const TERRAIN=[
  ['forest',18,61,1.20],['forest',52,60,1.28],['forest',99,58,1.18],['forest',-106,53,1.12],
  ['forest',-62,-5,1.28],['forest',-73,-12,.94],['forest',23,1,.96],['forest',104,17,1.00],['forest',118,-4,.78],
  ['desert',12,24,1.34],['desert',48,25,.92],['desert',78,27,.72],['desert',134,-24,1.08],
  ['savanna',28,-5,1.08],['savanna',24,-22,.98],['savanna',-58,-20,.70],
  ['snow',-42,72,1.18],['snow',92,68,1.06],['snow',-108,68,.92]
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

window.LariaGlobeArtV24={clamp,TERRAIN,FEATURES,draw:{trees,jungle,mountains,cloud,ship,whale,dolphin,pyramids,village,elephant,giraffe,camel,island,lighthouse,plane}};
})();