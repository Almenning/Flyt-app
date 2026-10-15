'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const bank=require('../laer-litt-mer/country-discoveries-v1.js');
const code=fs.readFileSync(path.join(__dirname,'..','laer-litt-mer','country-discoveries-ui-v1.js'),'utf8');
function element(){
 const classes=new Set(),attributes={},listeners={},span={textContent:''};
 return {dataset:{},isConnected:true,textContent:'',attributes,listeners,
   classList:{add:s=>classes.add(s),remove:s=>classes.delete(s),toggle(s,on){if(on)classes.add(s);else classes.delete(s)}},
   setAttribute:(k,v)=>{attributes[k]=v},querySelector:()=>span,
   addEventListener:(k,f)=>{listeners[k]=f}};
}
function fixture(){
 const button=element(),article=element(),status=element(),cards=[element(),element(),element()];
 const host={querySelector:s=>s==='.country-story'?article:s==='.country-read-aloud'?button:status,querySelectorAll:()=>cards};
 const docEvents={},windowEvents={},items=[];let cancels=0;
 const root={LARIA_COUNTRY_DISCOVERIES:bank,document:{hidden:false,addEventListener:(k,f,capture)=>{docEvents[k]={f,capture}}},
   addEventListener:(k,f)=>{windowEvents[k]=f},SpeechSynthesisUtterance:class{constructor(text){this.text=text}},
   speechSynthesis:{getVoices:()=>[],speak:u=>items.push(u),cancel:()=>{cancels++}}};
 vm.runInNewContext(code,{window:root,URL});
 const ui=root.LARIA_COUNTRY_DISCOVERY_UI;
 root.stopSpeech=()=>{ui.stopReading();root.speechSynthesis.cancel()};
 ui.mount(host,'ch');
 return {ui,root,button,article,status,items,docEvents,windowEvents,click:()=>button.listeners.click(),cancels:()=>cancels};
}
test('Practice is a capture-phase narration hand-off, with no stale queue restart',()=>{
 const f=fixture();assert.equal(f.items.length,0);f.click();assert.equal(f.items.length,1);
 const stale=f.items[0].onend,cancels=f.cancels();
 assert.equal(f.docEvents.click.capture,true);
 f.docEvents.click.f({target:{closest:selector=>selector==='[data-country-story-practice]'?{}:null}});
 assert.equal(f.button.attributes['aria-pressed'],'false');assert(f.cancels()>cancels);
 stale();assert.equal(f.items.length,1);
});
test('All three chunks complete once and reset the reader',()=>{
 const f=fixture();f.click();f.items[0].onend();f.items[1].onend();
 assert.equal(f.items.length,3);assert.match(f.items[2].text,/flagget/);
 f.items[2].onend();assert.equal(f.button.attributes['aria-pressed'],'false');
 assert.equal(f.items.length,3);
});
test('Hidden document and page departure stop reading',()=>{
 const f=fixture();f.click();f.root.document.hidden=true;f.docEvents.visibilitychange.f();
 assert.equal(f.button.attributes['aria-pressed'],'false');
 f.root.document.hidden=false;f.click();f.windowEvents.pagehide();
 assert.equal(f.button.attributes['aria-pressed'],'false');
});
test('Editorial and country text are escaped, missing data is not an invented story',()=>{
 const f=fixture(),markup=f.ui.intro('al',{name:'<script>alert(1)</script>'});
 assert(!markup.includes('<script>'));assert(markup.includes('&lt;script&gt;'));
 assert(!markup.includes('country-discoveries"'));
 const sources=f.ui.sources('ch',{name:'Sveits',population:9005582,populationYear:2024,a3:'CHE'});
 assert(sources.includes('noopener noreferrer'));assert(sources.includes('2024'));
 assert(f.ui.sources('al',{name:'Albania',population:2800000}).includes('eldre anslag'));
});
