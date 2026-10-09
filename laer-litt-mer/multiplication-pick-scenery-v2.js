/* Læria Plukk og tell: premium illustrated storybook scenery v2.
   Scenery contains no countable learning objects; math objects remain separate accessible DOM buttons.
   Scenic vector is scaled as artwork, NOT by stretching the math layout. */
(function(scope){
'use strict';
function hills(c){return '<path d="M0 302Q93 198 197 261Q321 145 438 243Q567 156 670 240Q811 156 960 249V620H0Z" fill="'+c[0]+'" opacity=".55"/><path d="M0 353Q135 263 270 318Q402 244 523 304Q655 237 791 300Q891 244 960 305V620H0Z" fill="'+c[1]+'"/><path d="M0 413Q124 354 285 395Q435 344 605 389Q798 326 960 387V620H0Z" fill="'+c[2]+'"/>';}
function leaves(cx,cy,color,n=56,r=80){
 let out='';
 for(let i=0;i<n;i++){let t=i*2.39996,dist=Math.sqrt((i+1)/n)*r,x=cx+Math.cos(t)*dist*1.25,y=cy+Math.sin(t)*dist*.72;
 let a=(i*7)%24-12,rx=9+i%4*2,ry=6+i%3*2;
 out+='<ellipse cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" rx="'+rx+'" ry="'+ry+'" transform="rotate('+a+' '+x.toFixed(1)+' '+y.toFixed(1)+')" fill="'+color[i%color.length]+'" opacity="'+(.85+(i%3)*.06)+'"/>';}
 return out;
}
function flower(cx,cy,s=1,c='#fff5d9'){return '<g transform="translate('+cx+' '+cy+') scale('+s+')"><path d="M0 0L-3 18" fill="none" stroke="#4c8152" stroke-width="2"/><g fill="'+c+'" stroke="#e7ceb0" stroke-width=".4"><ellipse cy="-6" rx="4" ry="7"/><ellipse cy="-6" rx="4" ry="7" transform="rotate(60)"/><ellipse cy="-6" rx="4" ry="7" transform="rotate(120)"/></g><circle r="4" fill="#e8b84f"/></g>';}
function flowers(n=75){let x='';for(let i=0;i<n;i++){let xx=(i*179+17)%960,yy=405+(i*53)%170,scale=.6+(i%5)*.22;x+=flower(xx,yy,scale,i%4===0?'#ffc4bf':i%4===1?'#ffecb5':'#fff9e9');}return x;}
function cloud(x,y,s=1){return '<g transform="translate('+x+' '+y+') scale('+s+')" fill="#fffaf0" opacity=".84"><ellipse cx="16" cy="17" rx="37" ry="14"/><ellipse cx="6" cy="7" rx="21" ry="18"/><ellipse cx="40" cy="9" rx="28" ry="20"/></g>';}
function tree(x,y,scale=1,warm=false){
 const colors=warm?['#6c9d4e','#779d50','#91b35b','#4e8350','#b7be69']:['#467e56','#568e59','#6f9e61','#397451','#8bb47a'];
 return '<g transform="translate('+x+' '+y+') scale('+scale+')"><path d="M-10 38Q-22 -42 -12 -122Q-1 -187 8 -178L18 -110L8 36" fill="#76543b" stroke="#654530" stroke-width="4"/><path d="M-9-116Q-55-168-66-206M12-135Q63-158 71-206" stroke="#765439" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M-7-106Q-8-164 2-196" stroke="#b4885c" stroke-width="5" fill="none" opacity=".72"/>'+
 leaves(-10,-196,colors,68,75)+leaves(-79,-202,colors,32,43)+leaves(65,-190,colors,35,50)+'</g>';
}
function fence(){let out='<path d="M0 387Q471 374 960 388" stroke="#bd9465" stroke-width="9" fill="none"/><path d="M0 405Q470 396 960 403" stroke="#edd2a3" stroke-width="8" fill="none"/>';for(let i=4;i<960;i+=35)out+='<path d="M'+i+' 428V363l9-9 9 9v65" fill="#efcc96" stroke="#b58654" stroke-width="2"/>';return out;}
function cottage(x=667,y=249){return '<g transform="translate('+x+' '+y+')"><path d="M0 156V59L108 0L218 61V156" fill="#f8dfad" stroke="#a77f58" stroke-width="7"/><path d="M-20 67L110 -27L242 67" fill="none" stroke="#ba7653" stroke-width="27" stroke-linejoin="round"/><path d="M-18 61L110 -33L242 61" fill="none" stroke="#edaa73" stroke-width="7"/><path d="M169 9V-61H197V32" fill="#b76549" stroke="#7c4c38" stroke-width="5"/><path d="M80 156V83Q109 53 140 83V156Z" fill="#83553c" stroke="#d9ac74" stroke-width="5"/><rect x="18" y="89" width="42" height="37" rx="4" fill="#d4e9d2" stroke="#ae855a" stroke-width="6"/><path d="M39 89V125M18 107H60" stroke="#ae855a" stroke-width="3"/><circle cx="130" cy="119" r="4" fill="#ecbf62"/></g>';}
function grass(n=90){let out='';for(let i=0;i<n;i++){const x=(i*177+33)%960,y=445+(i*37)%172,h=8+(i%5)*5;out+='<path d="M'+x+' '+y+'q-8 -'+(h/2)+' -'+(h/2)+' -'+h+'M'+x+' '+y+'q2 -'+h+' 9 -'+(h+5)+'" stroke="'+(i%3===0?'#417350':i%3===1?'#6f9a58':'#8bae64')+'" stroke-width="2.6" fill="none" opacity=".9"/>'; }return out;}
function garden(kind){
 const house=kind==='farm'?'<g transform="translate(670 252)"><rect width="246" height="174" fill="#ad6952" stroke="#f3cfad" stroke-width="9"/><path d="M-16 17L123 -90L265 17" fill="#bc6f57" stroke="#f7dcab" stroke-width="13"/><path d="M65 174V48H180V174" fill="#864e3f" stroke="#f5d5aa" stroke-width="7"/><path d="M66 50L180 172M180 50L66 172" stroke="#edc2a3" stroke-width="9"/></g>':cottage(671,254);
 return hills(['#9eb4aa','#8bb27b','#719e68'])+
 '<path d="M-25 525Q201 456 417 488Q644 451 990 519V620H-25Z" fill="url(#ppMeadow)"/>'+house+fence()+
 tree(91,393,1.3,kind!=='garden')+tree(885,377,1.15,true)+tree(467,355,.56,true)+
 '<path d="M-20 590Q190 484 397 561Q620 480 980 552V640H0Z" fill="#aa9e6f" opacity=".64"/>'+
 grass(82)+flowers(66)+
 (kind==='orchard'?'<path d="M419 525Q462 465 511 512" stroke="#a77d4b" stroke-width="12" fill="none"/>':'');
}
function bakery(){
 let brick='';for(let y=80;y<590;y+=38)for(let x=-30+(Math.floor(y/38)%2)*52;x<960;x+=105)brick+='<rect x="'+x+'" y="'+y+'" width="100" height="34" rx="4" fill="'+(Math.round(x+y)%3===0?'#d7a47a':'#d9b091')+'" stroke="#b68263" stroke-width="1.7" opacity=".74"/>';
 let jars='';for(let i=0;i<8;i++){let x=570+i*41; jars+='<rect x="'+x+'" y="160" width="25" height="39" rx="7" fill="#f6e1bb" stroke="#a77751" stroke-width="3"/><rect x="'+(x-2)+'" y="153" width="29" height="9" rx="3" fill="#d1a56e"/>';}
 return '<rect x="0" y="0" width="960" height="620" fill="url(#ppWall)"/>'+brick+
 '<path d="M68 419V208Q184 65 315 208V419Z" fill="#754d37" stroke="#f1d7ab" stroke-width="17"/><path d="M95 403V216Q187 115 287 216V403Z" fill="#bc8152" stroke="#69402e" stroke-width="8"/><path d="M126 380V253Q187 175 260 253V380Z" fill="url(#ppOven)"/>'+
 '<path d="M530 135H937M530 227H937" stroke="#7f5237" stroke-width="19"/>'+jars+
 '<path d="M743 335V253Q791 209 841 253V335Z" fill="#6e9d9a" stroke="#875e3d" stroke-width="10"/><path d="M790 256V330M747 292H839" stroke="#f7e8cf" stroke-width="8"/>'+
 '<path d="M0 440H960V620H0Z" fill="url(#ppBoard)"/><path d="M0 448H960" stroke="#f7d39b" stroke-width="15"/>'+
 Array.from({length:17},(_,i)=>'<path d="M0 '+(465+i*9)+'H960" stroke="'+(i%3===0?'#7c4c3260':'#edc49755')+'" stroke-width="'+(i%3===0?3:1.5)+'"/>').join('')+
 '<g stroke="#e8bd8d" stroke-width="6"><path d="M457 137V245M477 136V239M497 130V237"/></g>';
}
function forest(){
 let firs='';for(let i=0;i<11;i++){let x=(i*99+20)%960,base=370+(i%3)*34,size=64+(i%4)*17;firs+='<path d="M'+x+' '+base+'v-'+(size*1.3)+'" stroke="#644c3c" stroke-width="11"/><path d="M'+(x-size/2)+' '+(base-size*.55)+'L'+x+' '+(base-size*2)+'L'+(x+size/2)+' '+(base-size*.55)+'Z" fill="'+(i%3===0?'#336c54':i%3===1?'#3e7857':'#508964')+'" stroke="#2e6249" stroke-width="4"/>';}
 let ferns='';for(let i=0;i<24;i++){let x=(i*123+48)%960,y=447+(i*37)%142;ferns+='<path d="M'+x+' '+y+'q'+((i%2?1:-1)*24)+' -35 5 -72" stroke="#3c7851" stroke-width="5" fill="none"/>'+Array.from({length:6},(_,k)=>'<path d="M'+(x+k*2)+' '+(y-k*9)+'q'+((k%2?1:-1)*20)+' -17 '+((k%2?1:-1)*30)+' -10" stroke="#639b5c" stroke-width="4" fill="none"/>').join('');}
 return hills(['#70988c','#53876d','#3b6f59'])+firs+
 '<path d="M0 485Q130 436 290 482Q510 415 695 466Q842 422 960 461V620H0Z" fill="url(#ppForest)"/>'+
 tree(81,361,1.65,false)+tree(882,364,1.55,false)+
 '<path d="M350 620Q425 480 585 472Q665 466 739 620" fill="#b8b08a" opacity=".36"/>'+ferns+
 '<g fill="#fff5cc" opacity=".7">'+Array.from({length:28},(_,i)=>'<circle cx="'+((i*139+9)%960)+'" cy="'+(110+(i*43)%310)+'" r="'+(i%3+1)*1.5+'"/>').join('')+'</g>';
}
function treasure(){
 let stones='';for(let j=0;j<16;j++)for(let i=0;i<19;i++){let x=i*54+(j%2)*27,y=j*38;stones+='<rect x="'+x+'" y="'+y+'" width="49" height="33" rx="5" fill="'+(i+j)%4===0?'#a99a86':'#b2a08c'+'" stroke="#716254" stroke-width="1.8" opacity=".56"/>';}
 return '<rect width="960" height="620" fill="url(#ppCave)"/>'+stones+
 '<path d="M247 492V185Q480 -71 713 185V492Z" fill="#635b59" stroke="#b39b80" stroke-width="36"/>'+
 '<path d="M280 493V203Q480 -7 681 203V493Z" fill="#46525a" stroke="#8d7a67" stroke-width="8"/>'+
 '<path d="M0 465H960V620H0Z" fill="#806b58"/>'+
 '<path d="M0 472H960" stroke="#c1a583" stroke-width="13"/>'+
 Array.from({length:15},(_,i)=>'<path d="M'+(i*75)+' 470L'+(i*69)+' 620" stroke="#574a42" stroke-width="3" opacity=".54"/>').join('')+
 '<g fill="#e7b55a"><circle cx="209" cy="207" r="16"/><circle cx="759" cy="207" r="16"/></g>'+
 '<path d="M209 222Q187 155 209 119Q231 151 209 222M759 222Q737 155 759 119Q781 151 759 222" fill="url(#ppFlame)"/>'+
 '<path d="M63 448V360H172V448M790 448V343H902V448" fill="#76502f" stroke="#c99e5d" stroke-width="12"/>';
}
function train(){
 let windows='';for(let i=0;i<3;i++)windows+='<rect x="'+(635+i*88)+'" y="324" width="61" height="68" rx="7" fill="#e7d99e" stroke="#324e60" stroke-width="9"/>';
 return hills(['#a3c0a4','#8eb79c','#73a581'])+cottage(52,232)+
 '<rect x="527" y="263" width="430" height="169" rx="26" fill="#2e6575" stroke="#193f51" stroke-width="11"/>'+
 windows+'<path d="M507 279Q609 200 817 230Q937 241 970 291" fill="#c94c39" stroke="#9d3b35" stroke-width="9"/>'+
 '<g fill="#263d4c"><circle cx="627" cy="444" r="30"/><circle cx="859" cy="444" r="30"/></g><g fill="#d4a760"><circle cx="627" cy="444" r="13"/><circle cx="859" cy="444" r="13"/></g>'+
 '<rect y="472" width="960" height="148" fill="#b4a17e"/><path d="M0 538H960M0 576H960" stroke="#564d47" stroke-width="9"/>'+
 Array.from({length:24},(_,i)=>'<path d="M'+(i*44)+' 532L'+(i*51)+' 590" stroke="#d2b187" stroke-width="8"/>').join('')+
 '<path d="M380 427V192" stroke="#846849" stroke-width="15"/><circle cx="380" cy="177" r="42" fill="#f1e3b5" stroke="#7e634c" stroke-width="11"/><path d="M380 150V177L400 191" fill="none" stroke="#76533c" stroke-width="7"/>';
}
function beach(){
 let waves='';for(let j=0;j<9;j++)waves+='<path d="M-10 '+(313+j*15)+'Q75 '+(298+j*15)+' 154 '+(313+j*15)+'T314 '+(313+j*15)+'T484 '+(313+j*15)+'T655 '+(313+j*15)+'T980 '+(313+j*15)+'" stroke="'+(j%2?'#b8e5e0':'#ffffff')+'" stroke-width="'+(j%2?3:5)+'" opacity=".62" fill="none"/>';
 return '<path d="M0 299Q208 270 459 295Q728 258 960 288V620H0Z" fill="url(#ppWater)"/>'+waves+
 '<path d="M0 451Q230 421 465 470Q766 410 960 447V620H0Z" fill="url(#ppSand)"/>'+
 '<path d="M701 388V201H779V388Z" fill="#fbe1b7" stroke="#a97f66" stroke-width="7"/><path d="M690 205L739 152L792 205Z" fill="#b65d51" stroke="#8f403c" stroke-width="7"/>'+
 '<rect x="714" y="244" width="52" height="49" rx="5" fill="#b1d7d8" stroke="#a47358" stroke-width="5"/>'+
 '<path d="M0 526Q162 468 334 519Q522 461 715 517Q846 479 960 504" stroke="#fff1c8" stroke-width="8" fill="none" opacity=".7"/>'+
 Array.from({length:30},(_,i)=>{let x=(i*131+11)%960,y=492+(i*31)%122;return '<path d="M'+x+' '+y+'q-4 -13 3 -24M'+x+' '+y+'q8 -15 12 -15" stroke="#8fa46b" stroke-width="3" fill="none"/>';}).join('')+
 '<g stroke="#eef4dd" stroke-width="3" fill="none"><path d="M145 130q15 -12 28 0q13 -12 27 0M205 166q13 -9 25 0q13 -9 24 0"/></g>';
}
function aquarium(){
 let rays='';for(let i=0;i<18;i++)rays+='<path d="M480 -80L'+(i*85-120)+' 620L'+(i*85+2-120)+' 620Z" fill="#b4f5d9" opacity=".06"/>';
 let coral='';for(let i=0;i<26;i++){let x=(i*173+15)%960,y=575+(i%3)*18,branch=25+(i%4)*12;coral+='<g transform="translate('+x+' '+y+')"><path d="M0 30V-'+branch+'M0-8Q-25-20-18-43M0-23Q28-24 20-44" stroke="'+(i%3?'#ef9e86':'#c97891')+'" stroke-width="8" fill="none" stroke-linecap="round"/></g>';}
 return '<rect width="960" height="620" fill="url(#ppSea)"/>'+rays+
 '<path d="M0 510Q213 475 430 521Q654 474 960 510V620H0Z" fill="#709999"/>'+
 coral+Array.from({length:36},(_,i)=>'<circle cx="'+((i*239+39)%960)+'" cy="'+(68+(i*131)%480)+'" r="'+(3+i%4*3)+'" fill="none" stroke="#dcfffb" stroke-width="2" opacity=".67"/>').join('')+
 '<g stroke="#4ba486" stroke-width="13" fill="none"><path d="M82 620Q22 495 69 379M139 621Q187 468 127 356M837 620Q773 466 836 343M908 620Q962 481 901 352"/></g>';
}
function park(){
 let wheel='';for(let i=0;i<12;i++){let a=Math.PI*i/6,cx=788+109*Math.cos(a),cy=260+109*Math.sin(a);wheel+='<path d="M788 260L'+cx.toFixed(2)+' '+cy.toFixed(2)+'" stroke="#d5ac77" stroke-width="6"/><circle cx="'+cx.toFixed(2)+'" cy="'+cy.toFixed(2)+'" r="12" fill="'+(i%2?'#f1b184':'#ffe4ad')+'" stroke="#ad7e61" stroke-width="3"/>';}
 return hills(['#b4cca4','#9abf88','#80a579'])+
 '<circle cx="788" cy="260" r="109" fill="none" stroke="#f0cd8b" stroke-width="15"/>'+wheel+
 '<circle cx="788" cy="260" r="18" fill="#dfb274" stroke="#93634f" stroke-width="6"/>'+
 '<path d="M721 470L788 258L861 470" fill="none" stroke="#b27d61" stroke-width="19"/>'+
 '<path d="M81 465L225 161L377 465Z" fill="#fff0cc" stroke="#ba795f" stroke-width="11"/>'+
 '<path d="M226 160V465" stroke="#c37a64" stroke-width="15"/>'+
 '<path d="M79 466H376" stroke="#85583f" stroke-width="21"/>'+
 '<path d="M0 520Q266 465 465 525Q706 485 960 517V620H0Z" fill="#b6b17d"/>'+
 Array.from({length:18},(_,i)=>'<path d="M'+(i*60)+' 65l20 24 20-24 20 24" stroke="#d2aa75" stroke-width="2" fill="none"/><path d="M'+(i*60)+' 67l20 24-1-22Z" fill="'+(i%3===0?'#ce786e':i%3===1?'#f4d78d':'#85b39b')+'"/>').join('')+flowers(19);
}
function scene(kind){
 const palette={garden:['#a3dcdb','#f2efc9'],orchard:['#b6dada','#f4edc5'],farm:['#aed7d9','#ece3b7'],forest:['#9abfb3','#c6ddae'],bakery:['#d7a981','#ead5ab'],treasure:['#8a7771','#c4b397'],train:['#b2e1df','#f0e8c6'],beach:['#8ed5e8','#ffe5b2'],aquarium:['#65bdce','#2d788c'],park:['#9bdadc','#f5e7c4']}[kind]||['#b7ddcb','#e1ebc9'];
 const body=({garden:()=>garden('garden'),orchard:()=>garden('orchard'),farm:()=>garden('farm'),forest,bakery,treasure,train,beach,aquarium,park}[kind]||(()=>garden('garden')))();
 return '<svg class="mp-pick-landscape mp-pick-storyscape" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 620" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>'+
 '<linearGradient id="ppSky" x2="0" y2="1"><stop stop-color="'+palette[0]+'"/><stop offset=".74" stop-color="'+palette[1]+'"/><stop offset="1" stop-color="#f6e5c2"/></linearGradient>'+
 '<linearGradient id="ppMeadow" x2=".1" y2="1"><stop stop-color="#b1c487"/><stop offset=".5" stop-color="#88a16e"/><stop offset="1" stop-color="#667e58"/></linearGradient>'+
 '<linearGradient id="ppWall" x2="1" y2="1"><stop stop-color="#e9d0ab"/><stop offset="1" stop-color="#ad7857"/></linearGradient>'+
 '<linearGradient id="ppBoard" x2="0" y2="1"><stop stop-color="#bf9066"/><stop offset="1" stop-color="#714b35"/></linearGradient>'+
 '<radialGradient id="ppOven"><stop stop-color="#ffe09b"/><stop offset=".6" stop-color="#e49e58"/><stop offset="1" stop-color="#683d30"/></radialGradient>'+
 '<linearGradient id="ppForest" x2=".1" y2="1"><stop stop-color="#709772"/><stop offset="1" stop-color="#385a43"/></linearGradient>'+
 '<linearGradient id="ppCave" x2=".7" y2="1"><stop stop-color="#c3b197"/><stop offset="1" stop-color="#64574f"/></linearGradient>'+
 '<radialGradient id="ppFlame"><stop stop-color="#fff7c0"/><stop offset=".55" stop-color="#f4bf68"/><stop offset="1" stop-color="#bb6543"/></radialGradient>'+
 '<linearGradient id="ppWater" x2="0" y2="1"><stop stop-color="#6dbbc8"/><stop offset="1" stop-color="#3c94a9"/></linearGradient>'+
 '<linearGradient id="ppSand" x2="0" y2="1"><stop stop-color="#f2e1b4"/><stop offset="1" stop-color="#d9b887"/></linearGradient>'+
 '<linearGradient id="ppSea" x2="0" y2="1"><stop stop-color="#65c0cb"/><stop offset="1" stop-color="#22577b"/></linearGradient>'+
 '<radialGradient id="ppLight"><stop stop-color="#fff7d1" stop-opacity=".82"/><stop offset="1" stop-color="#fff8df" stop-opacity="0"/></radialGradient>'+
 '</defs><rect width="960" height="620" fill="url(#ppSky)"/><circle cx="706" cy="105" r="170" fill="url(#ppLight)"/><circle cx="706" cy="105" r="43" fill="#fff7cf" opacity=".9"/>'+
 (['garden','farm','orchard','train','park','beach'].includes(kind)?cloud(105,87,1.08)+cloud(474,120,.76):'')+
 body+
 '<rect x="0" y="0" width="960" height="620" fill="none" stroke="#fff9dc" stroke-width="12" opacity=".48"/>'+
 '</svg>';
}
scope.LARIA_PICK_SCENERY_V2={scene};
})(window);