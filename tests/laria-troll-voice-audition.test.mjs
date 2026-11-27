import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudition,localNorwegianVoice,PROFILES} from '../laer-litt-mer/laria-troll-voice-audition-v1.mjs';

const nb={lang:'nb-NO',localService:true};
const no={lang:'no-NO',localService:true};
const fixture=()=>{
 const states=[],spoken=[];
 let canceled=0,timeout;
 const synth={speaking:false,pending:false,paused:false,
  getVoices:()=>[{lang:'nb-NO',localService:false},no,nb],
  speak:u=>spoken.push(u),
  cancel:()=>canceled++};
 class Utterance{constructor(text){this.text=text}}
 const make=(overrides={})=>createAudition({
  synth,Utterance,onStatus:(message,playing,enabled)=>states.push({message,playing,enabled}),
  timer:fn=>{timeout=fn;return fn},cancelTimer:()=>{timeout=undefined},...overrides});
 return {synth,make,states,spoken,canceled:()=>canceled,timeout:()=>timeout?.()};
};

test('only local Norwegian voices: Bokmål before generic Norwegian and Nynorsk',()=>{
 assert.equal(localNorwegianVoice([{lang:'nb-NO',localService:false},{lang:'en-GB',localService:true}]),null);
 const nn={lang:'nn-NO',localService:true};
 assert.equal(localNorwegianVoice([nn,no]),no);
 assert.equal(localNorwegianVoice([nn,no,nb]),nb);
 assert.equal(localNorwegianVoice([nn,{lang:'nb_SE',localService:true},nb]),nb);
 assert.equal(localNorwegianVoice([nn]),nn);
});

test('rehearses each exact asked line, tone and rate from a fresh deliberate request',()=>{
 const f=fixture(),a=f.make();
 a.ready();
 assert.equal(f.spoken.length,0);
 const expected=[
  ['Bra jobbet! Du klarte det.',.90,.85],
  ['Wow, se på deg! Dette var flott!',1.25,1],
  ['Hehe, jeg heier på deg!',1.15,1.05]
 ];
 PROFILES.forEach((p,i)=>{
  assert.equal(a.play(p),true);
  const u=f.spoken.at(-1);
  assert.deepEqual([u.text,u.pitch,u.rate],expected[i]);
  assert.equal(u.voice,nb);
  assert.equal(u.lang,'nb-NO');
  u.onstart();assert.match(f.states.at(-1).message,/^Spiller/);
  u.onend();assert.equal(f.states.at(-1).playing,false);
 });
 assert.equal(f.canceled(),0);
});

test('does not cancel or queue against another lesson or audition',()=>{
 const f=fixture(),a=f.make();
 for(const property of ['speaking','pending','paused']){
  f.synth[property]=true;
  assert.equal(a.play(PROFILES[0]),false);
  assert.match(f.states.at(-1).message,/annen opplesning/);
  a.stop();assert.equal(f.canceled(),0);
  f.synth[property]=false;
 }
 assert.equal(a.play(PROFILES[0]),true);
 assert.equal(a.play(PROFILES[1]),false);
 assert.equal(f.spoken.length,1);
 a.release(); // App uses this immediately before its normal lesson speech.
 a.stop(); // A subsequent visibility/navigation check must not cancel the lesson.
 assert.equal(f.canceled(),0);
});

test('off, ownership timeout, late speech events, unavailable voices and API failure are safe',()=>{
 const f=fixture(),a=f.make();
 a.play(PROFILES[0]);
 const previous=f.spoken.at(-1);
 a.setEnabled(false);assert.equal(f.canceled(),1);
 assert.equal(a.play(PROFILES[1]),false);assert.equal(f.spoken.length,1);
 a.setEnabled(true);a.play(PROFILES[1]);
 previous.onend();
 assert.equal(f.states.at(-1).playing,true);
 f.timeout();assert.match(f.states.at(-1).message,/svarte ikke/);assert.equal(f.canceled(),2);
 f.synth.getVoices=()=>[{lang:'nb-NO',localService:false}];
 assert.equal(a.play(PROFILES[2]),false);assert.match(f.states.at(-1).message,/Ingen lokal norsk/);
 f.synth.getVoices=()=>[nb];
 f.synth.speak=()=>{throw new Error('audio failure')};
 assert.equal(a.play(PROFILES[2]),false);assert.match(f.states.at(-1).message,/kunne ikke startes/);
 const unavailable=f.make({synth:undefined});
 assert.equal(unavailable.play(PROFILES[0]),false);assert.match(f.states.at(-1).message,/ikke tilgjengelig/);
});
