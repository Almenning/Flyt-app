const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {harness,storage,server}=require('./helpers/sync-harness.cjs');
const root=path.join(__dirname,'..');
test('the legacy hydration helper cannot overwrite restored offline edits or suppress the save queue',async()=>{
 const store=storage(),remote=server(),first=harness({storage:store,server:remote});await first.api.bootstrap();
 first.navigator.onLine=false;first.edit(s=>({...s,recognitions:[{id:'draft',text:'offline'}]}));
 const next=harness({storage:store,server:remote});await next.api.bootstrap();const queue=next.api.queueSave;
 const window={...next.window};vm.runInNewContext(fs.readFileSync(path.join(root,'startup-hydration-ui.js'),'utf8'),{window,document:next.document});
 assert.equal(await window.FlytStartupHydration.hydrate(),true);assert.equal(next.api.queueSave,queue);
 assert.equal(next.state.recognitions[0].text,'offline');await next.api.retrySave();assert.equal(remote.state.recognitions[0].text,'offline');
});
test('watchdog forwards silent state updates without rendering over a focused input',()=>{
 const source=fs.readFileSync(path.join(root,'app-watchdog.js'),'utf8');
 const fn=source.slice(source.indexOf('function installRenderGuard()'),source.indexOf('function keepGuardAlive()'));
 const updates=[],renders=[];const window={FlytBridge:{getState:()=>null,setState:(...args)=>updates.push(args)}};
 vm.runInNewContext(fn+';installRenderGuard();',{window,restoreOwnedView:v=>renders.push(v)});renders.length=0;
 window.FlytBridge.setState({view:'tasks'},{render:false});assert.equal(updates[0][1].render,false);assert.equal(renders.length,0);
 window.FlytBridge.setState({view:'tasks'});assert.equal(renders[0],'tasks');
});
