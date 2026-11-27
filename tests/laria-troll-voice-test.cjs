'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../laer-litt-mer/home-kjosnes-v15.js'),'utf8');
const start=source.indexOf('(function installTrollVoiceTest(){');
assert(start>=0,'Voice test entry point missing');
const script=source.slice(start);
function fixture({enabled=true,onboarding=false,supported=true,busy=false}={}){
 const nodes=[],observers=[],spoken=[];
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.style={};this.attrs={};this.listeners={};this.classes=new Set();this.classList={contains:name=>this.classes.has(name)};nodes.push(this);}
  append(...elements){this.children.push(...elements)}
  setAttribute(key,value){this.attrs[key]=value}
  addEventListener(type,listener){this.listeners[type]=listener}
  click(){this.listeners.click?.()}
  querySelector(selector){return selector==='.bc12'?host:null}
 }
 const screen=new Element('section');screen.id='home-screen';screen.classes.add('active');
 const host=new Element('main');host.dataset.mode='home';host.dataset.bc13View='home';
 const intro=new Element('div');intro.id='onboarding';if(onboarding)intro.classes.add('show');
 const nbRemote={lang:'nb-NO',localService:false},nbLocal={lang:'nb_NO',localService:true};
 const synth={speaking:busy,pending:false,cancels:0,getVoices:()=>[{lang:'en-US',localService:true},nbRemote,nbLocal],speak(u){spoken.push(u);this.speaking=true},cancel(){this.cancels++;this.speaking=false}};
 const window=supported?{speechSynthesis:synth,SpeechSynthesisUtterance:class{constructor(text){this.text=text}}}:{};
 const document={readyState:'complete',getElementById:id=>nodes.find(n=>n.id===id),createElement:tag=>new Element(tag)};
 class MutationObserver{constructor(callback){observers.push(callback)}observe(){}}
 vm.runInNewContext(script,{window,document,location:{search:enabled?'?app=laria&lariaTrollVoiceTest=1':'?app=laria'},URLSearchParams,MutationObserver});
 const panel=document.getElementById('laria-troll-voice-test');
 return {panel,buttons:panel?.children[2].children,status:panel?.children[1],screen,host,intro,synth,spoken,nbLocal,sync:()=>observers.forEach(fn=>fn())};
}
test('voice audition is absent unless explicitly enabled',()=>assert.equal(fixture({enabled:false}).panel,undefined));
test('three explicit click gestures retain exact Norwegian speech profiles',()=>{
 const f=fixture();
 assert.equal(f.buttons.length,3);
 assert.equal(f.spoken.length,0,'must not autoplay');
 const expected=[
  ['storesoster','Bra jobbet! Du klarte det.',0.9,0.85],
  ['lillesoster','Wow, se på deg! Dette var flott!',1.25,1.0],
  ['lillebror','Hehe, jeg heier på deg!',1.15,1.05]
 ];
 for(let i=0;i<expected.length;i++){
  const [id,text,pitch,rate]=expected[i];
  assert.equal(f.buttons[i].dataset.trollVoiceTest,id);
  f.buttons[i].click();
  const u=f.spoken[i];
  assert.equal(u.text,text);assert.equal(u.pitch,pitch);assert.equal(u.rate,rate);
  assert.equal(u.lang,'nb-NO');assert.equal(u.voice,f.nbLocal);
 }
 assert.equal(f.synth.cancels,2,'repeated test taps replace only test speech');
 f.spoken[2].onend();
 assert.match(f.status.textContent,/igjen/);
});
test('does not cancel existing lesson speech or enqueue a test while busy',()=>{
 const f=fixture({busy:true});
 f.buttons[0].click();
 assert.equal(f.synth.cancels,0);assert.equal(f.spoken.length,0);
 assert.match(f.status.textContent,/Vent/);
});
test('onboarding and all non-Home views hide the test',()=>{
 const f=fixture({onboarding:true});
 assert.equal(f.panel.style.display,'none');
 f.intro.classes.delete('show');f.sync();assert.equal(f.panel.style.display,'block');
 f.buttons[0].click();f.host.dataset.bc13View='travel';f.sync();
 assert.equal(f.panel.style.display,'none');assert.equal(f.synth.cancels,1);
 f.host.dataset.bc13View='home';f.host.dataset.mode='explore';f.sync();
 assert.equal(f.panel.style.display,'none');
 f.host.dataset.mode='home';f.sync();assert.equal(f.panel.style.display,'block');
 f.screen.classes.delete('active');f.sync();assert.equal(f.panel.style.display,'none');
});
test('unsupported speech API reports a usable error',()=>{
 const f=fixture({supported:false});f.buttons[0].click();
 assert.match(f.status.textContent,/ikke tilgjengelig/);
});
