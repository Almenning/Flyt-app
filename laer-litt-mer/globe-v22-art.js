(()=>{'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const TERRAIN=[
['forest',18,61,1.15],['forest',55,59,1.25],['forest',98,57,1.12],['forest',-106,53,1.12],
['forest',-61,-5,1.18],['forest',23,0,.9],['forest',104,16,.9],['forest',118,-3,.72],
['desert',12,23,1.28],['desert',48,24,.86],['desert',134,-24,1.05],
['savanna',28,-5,1],['savanna',24,-22,.92],['snow',-42,72,1.15],['snow',92,68,1]
];
const FEATURES=[
['mountains',10,46,.78],['mountains',79,31,1.15],['mountains',91,37,.82],['mountains',-109,40,.88],['mountains',-70,-24,.98],['mountains',39,8,.58],
['trees',20,61,.82],['trees',54,58,.9],['trees',99,57,.86],['trees',-104,52,.82],['trees',-60,-6,.9],['trees',23,0,.78],['trees',104,16,.68],
['village',16,50,.78],['village',33,56,.62],['village',77,28,.65],['pyramids',30,27,.72],['camel',11,24,.62],
['elephant',28,-3,.72],['giraffe',23,-25,.72],['ship',-29,24,.9,0],['ship',72,-15,.78,1],['ship',145,-9,.62,1],
['whale',-27,-31,1],['whale',150,-31,.68],['island',73,5,.68],['island',151,-18,.58],
['cloud',-8,44,.9],['cloud',43,-5,.8],['cloud',-145,18,.68],['cloud',112,-20,.68],['plane',7,-1,.52]
];
function tree(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#754823';ctx.fillRect(-k*.07,k*.05,k*.14,k*.40);
  for(const a of [[-.48,.68,'#245F3D'],[-.25,.88,'#2D7845'],[0,1.02,'#398D4D']]){
    ctx.fillStyle=a[2];ctx.beginPath();ctx.moveTo(0,k*(a[0]-.36));ctx.lineTo(-k*a[1]*.46,k*(a[0]+.25));ctx.lineTo(k*a[1]*.46,k*(a[0]+.25));ctx.closePath();ctx.fill();
  }ctx.restore();
}
function trees(ctx,x,y,k){tree(ctx,x-k*.32,y+k*.06,k*.72);tree(ctx,x+k*.25,y+k*.10,k*.62);tree(ctx,x,y-k*.08,k)}
function mountains(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);
  for(const a of [[-.45,.10,.68],[0,-.08,1],[.46,.12,.64]]){
    const m=k*a[2];ctx.save();ctx.translate(k*a[0],k*a[1]);
    ctx.fillStyle='#8B918C';ctx.beginPath();ctx.moveTo(0,-m*.63);ctx.lineTo(-m*.72,m*.48);ctx.lineTo(m*.72,m*.48);ctx.closePath();ctx.fill();
    ctx.fillStyle='#FFF8E9';ctx.beginPath();ctx.moveTo(0,-m*.63);ctx.lineTo(-m*.24,-m*.20);ctx.lineTo(-m*.03,-m*.30);ctx.lineTo(m*.18,-m*.10);ctx.lineTo(m*.34,-m*.04);ctx.closePath();ctx.fill();ctx.restore();
  }ctx.restore();
}
function cloud(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(250,254,255,.90)';
  for(const a of [[-.34,.05,.33],[-.07,-.18,.41],[.28,-.02,.34],[.04,.16,.48]]){ctx.beginPath();ctx.arc(k*a[0],k*a[1],k*a[2],0,Math.PI*2);ctx.fill()}ctx.restore();
}
function ship(ctx,x,y,k,flip){
  ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);
  ctx.fillStyle='#7F4826';ctx.beginPath();ctx.moveTo(-k*.58,k*.26);ctx.lineTo(k*.57,k*.26);ctx.lineTo(k*.34,k*.50);ctx.lineTo(-k*.38,k*.50);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#67411F';ctx.lineWidth=Math.max(1,k*.07);ctx.beginPath();ctx.moveTo(0,-k*.62);ctx.lineTo(0,k*.25);ctx.stroke();
  ctx.fillStyle='#FFF1CA';ctx.beginPath();ctx.moveTo(-k*.04,-k*.55);ctx.lineTo(-k*.04,k*.07);ctx.lineTo(-k*.49,k*.03);ctx.closePath();ctx.fill();
  ctx.fillStyle='#F3C15E';ctx.beginPath();ctx.moveTo(k*.06,-k*.40);ctx.lineTo(k*.06,k*.09);ctx.lineTo(k*.42,k*.08);ctx.closePath();ctx.fill();
  ctx.fillStyle='#D85743';ctx.fillRect(-k*.03,-k*.62,k*.18,k*.10);ctx.restore();
}
function whale(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.12);ctx.fillStyle='#1F6596';ctx.beginPath();ctx.ellipse(0,0,k*.62,k*.27,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(k*.52,-k*.05);ctx.lineTo(k*.95,-k*.31);ctx.lineTo(k*.78,k*.02);ctx.lineTo(k*.98,k*.24);ctx.lineTo(k*.52,k*.09);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.34)';ctx.beginPath();ctx.ellipse(-k*.18,-k*.10,k*.22,k*.06,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
function pyramids(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);for(const a of [[-.30,.76,'#D89B3C'],[.22,1,'#E4AD4C'],[.50,.55,'#C88934']]){
    ctx.fillStyle=a[2];ctx.beginPath();ctx.moveTo(k*a[0],-k*.44*a[1]);ctx.lineTo(k*(a[0]-.40*a[1]),k*.34*a[1]);ctx.lineTo(k*(a[0]+.40*a[1]),k*.34*a[1]);ctx.closePath();ctx.fill();
  }ctx.restore();
}
function village(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);for(const a of [[-.42,.14,.70,'#D45C42'],[0,.02,1,'#E27A4B'],[.42,.16,.70,'#C75B3D']]){
    ctx.fillStyle='#F6E2B8';ctx.fillRect(k*(a[0]-.17*a[2]),k*(a[1]-.02*a[2]),k*.34*a[2],k*.30*a[2]);
    ctx.fillStyle=a[3];ctx.beginPath();ctx.moveTo(k*(a[0]-.22*a[2]),k*(a[1]-.02*a[2]));ctx.lineTo(k*a[0],k*(a[1]-.24*a[2]));ctx.lineTo(k*(a[0]+.22*a[2]),k*(a[1]-.02*a[2]));ctx.closePath();ctx.fill();
  }ctx.fillStyle='#EEE6CE';ctx.fillRect(-k*.06,-k*.52,k*.12,k*.48);ctx.fillStyle='#C6543F';ctx.beginPath();ctx.moveTo(-k*.10,-k*.52);ctx.lineTo(0,-k*.68);ctx.lineTo(k*.10,-k*.52);ctx.closePath();ctx.fill();ctx.restore();
}
function elephant(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#77786D';ctx.beginPath();ctx.ellipse(-k*.05,0,k*.45,k*.28,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(k*.34,-k*.03,k*.22,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#77786D';ctx.lineWidth=k*.10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(k*.47,k*.04);ctx.quadraticCurveTo(k*.62,k*.22,k*.55,k*.40);ctx.stroke();ctx.restore();
}
function giraffe(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#D5A341';ctx.beginPath();ctx.ellipse(-k*.08,k*.10,k*.30,k*.20,0,0,Math.PI*2);ctx.fill();ctx.fillRect(k*.08,-k*.42,k*.10,k*.48);ctx.beginPath();ctx.ellipse(k*.17,-k*.48,k*.16,k*.10,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#8C6330';for(const a of [[-.18,.03],[-.01,.12],[.12,-.20],[.10,-.36]]){ctx.beginPath();ctx.arc(k*a[0],k*a[1],k*.055,0,Math.PI*2);ctx.fill()}ctx.restore();
}
function camel(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#A96E35';ctx.beginPath();ctx.moveTo(-k*.42,k*.18);ctx.quadraticCurveTo(-k*.30,-k*.18,-k*.12,k*.05);ctx.quadraticCurveTo(k*.02,-k*.26,k*.18,k*.03);ctx.quadraticCurveTo(k*.34,-k*.08,k*.45,k*.10);ctx.lineTo(k*.34,k*.28);ctx.lineTo(-k*.36,k*.28);ctx.closePath();ctx.fill();ctx.fillRect(k*.34,-k*.18,k*.08,k*.30);ctx.restore();
}
function island(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#E8CB6A';ctx.beginPath();ctx.ellipse(0,k*.18,k*.36,k*.12,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#7A5631';ctx.lineWidth=k*.06;ctx.beginPath();ctx.moveTo(0,k*.12);ctx.lineTo(k*.03,-k*.38);ctx.stroke();ctx.strokeStyle='#2F8B4B';ctx.lineWidth=k*.10;for(const a of [-1.2,-.65,-.15,.4,1]){ctx.beginPath();ctx.moveTo(k*.02,-k*.30);ctx.quadraticCurveTo(k*.22*Math.cos(a),-k*.48,k*.36*Math.cos(a),-k*.36+k*.10*Math.sin(a));ctx.stroke()}ctx.restore();
}
function plane(ctx,x,y,k){
  ctx.save();ctx.translate(x,y);ctx.rotate(-.22);ctx.fillStyle='rgba(244,252,255,.92)';ctx.beginPath();ctx.moveTo(-k*.55,0);ctx.lineTo(k*.58,-k*.07);ctx.lineTo(k*.14,k*.05);ctx.lineTo(-k*.06,k*.32);ctx.lineTo(-k*.16,k*.31);ctx.lineTo(-k*.03,k*.04);ctx.closePath();ctx.fill();ctx.restore();
}
window.LariaGlobeArtV22={clamp,TERRAIN,FEATURES,draw:{trees,mountains,cloud,ship,whale,pyramids,village,elephant,giraffe,camel,island,plane}};
})();