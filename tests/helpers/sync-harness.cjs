const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto').webcrypto;
const root=path.join(__dirname,'../..');
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return{promise,resolve,reject};}
function storage(initial={}){
  const map=new Map(Object.entries(initial));
  return{get length(){return map.size},key:i=>[...map.keys()][i]??null,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),entries:()=>Object.fromEntries(map)};
}
const blank=()=>({version:5,user:'A',view:'home',tasks:[],status:{A:{}},completions:[],points:{A:0},recognitions:[]});
function server(initial=blank()){
  let state=structuredClone(initial),revision=0,householdId='house-a';
  const api={
    get state(){return structuredClone(state)},get revision(){return revision},
    context(userId='user-a'){
      return{user_id:userId,household:householdId?{id:householdId,name:'Home'}:null,members:[{id:userId,display_name:'A'}],state:structuredClone(state),revision,requires_consent:false,consent:{privacy_version:'v1',sensitive_version:null,sensitive_current:false}};
    },
    save(args){
      if(args.p_expected_revision!==revision)return{data:{ok:false,conflict:true,revision,state:structuredClone(state)},error:null};
      state=structuredClone(args.p_data);revision++;
      return{data:{ok:true,revision},error:null};
    },
    edit(fn){state=fn(state);revision++},disconnect(){householdId=null;state={};revision++},
  };return api;
}
function harness(options={}){
  const store=options.storage||storage(),remote=options.server||server();
  let state=blank(),session={user:{id:options.userId||'user-a',user_metadata:{display_name:'A'}}};
  let authHandler=()=>{},requestHandler=options.rpc,getSessionHandler=options.getSession,signoutHandler=options.signOut;
  const listeners={},nodes=new Map(),timers=new Map(),intervals=new Map(),calls=[];let timerId=0;
  function element(id){
    if(nodes.has(id))return nodes.get(id);
    const classes=new Set();let markup='';
    const el={id,value:'',disabled:false,dataset:{},style:{},attrs:{},textContent:'',
      classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,force)=>{if(force===false)classes.delete(x);else classes.add(x)}},
      setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},addEventListener(k,f){this['on'+k]=f},matches(){return false},remove(){nodes.delete(id)},select(){},
      get innerHTML(){return markup},set innerHTML(value){markup=value;for(const match of value.matchAll(/id="([^"]+)"/g))element(match[1]);},
    };nodes.set(id,el);return el;
  }
  for(const id of ['.app','login','setup','flytSetupV2','betaGate','betaGateBox','switchUser','syncBtn','lock','content'])element(id);
  const document={readyState:'complete',activeElement:null,querySelector(selector){return selector.split(',').map(k=>nodes.get(k.trim().replace(/^#/,''))).find(Boolean)||null},querySelectorAll(){return[]},createElement(){return element('created-'+(++timerId))},addEventListener(k,f){listeners['doc:'+k]=f},body:{appendChild(el){nodes.set(el.id,el)}},head:{appendChild(){}}};
  const auth={getSession:async()=>getSessionHandler?getSessionHandler():{data:{session},error:null},
    signOut:async()=>{calls.push('signout');if(signoutHandler)return signoutHandler();session=null;authHandler('SIGNED_OUT',null);return{error:null}},
    signInWithPassword:async({email})=>{session={user:{id:email,user_metadata:{display_name:'B'}}};authHandler('SIGNED_IN',session);return{data:{session,user:session.user},error:null}},
    onAuthStateChange:fn=>{authHandler=fn;return{data:{subscription:{unsubscribe(){}}}}},
    startAutoRefresh(){calls.push('start-refresh')},stopAutoRefresh(){calls.push('stop-refresh')},
  };
  const client={auth,rpc:async(name,args)=>{
    calls.push(name);
    if(requestHandler)return requestHandler(name,args,remote);
    if(name==='get_my_flyt_context')return{data:remote.context(session?.user?.id),error:null};
    if(name==='save_my_flyt_state_v2')return remote.save(args);
    return{data:{},error:null};
  }};
  const window={supabase:{createClient:()=>client},
    FlytPlatform:{isNative:options.native===true,secureAuthStorage:{},async clearSecureAuthStorage(){calls.push('clear-keychain');if(options.clearKeychain)await options.clearKeychain()},lockAuthStorage(){},unlockAuthStorage(){},async getAppState(){return{isActive:true}},async addAppStateListener(fn){listeners.native=fn},async addUrlOpenListener(){},async getLaunchUrl(){return null}},
    FlytBridge:{getState:()=>state,setState(next){state=structuredClone(next);const ctx=window.FlytSync?.getContext();if(ctx?.user_id&&ctx?.household)store.setItem('flyt_state_v6:'+ctx.user_id+':'+ctx.household.id,JSON.stringify(state));},toast(text){calls.push('toast:'+text)}},
    addEventListener(k,f){listeners[k]=f},dispatchEvent(event){listeners[event.type]?.(event)},
  };
  const navigator={onLine:options.online!==false};
  const context=vm.createContext({window,document,navigator,localStorage:store,sessionStorage:storage(),location:{href:'https://almenning.github.io/Flyt-app/',...(options.reload?{reload:options.reload}:{})},history:{replaceState(){}},URL,Date,Intl,Promise,AbortController,structuredClone,crypto,CustomEvent:class{constructor(type){this.type=type}},
    console:{log(){},warn(){},error(){}},
    setTimeout(fn,ms=0){const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),
    setInterval(fn,ms){const id=++timerId;intervals.set(id,{fn,ms});return id},clearInterval:id=>intervals.delete(id),
  });
  for(const name of ['sync-merge.js','sync-journal.js','sync.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
  return{window,api:window.FlytSync,remote,store,calls,auth,navigator,nodes,document,listeners,
    get state(){return structuredClone(state)},
    edit(fn){state=fn(structuredClone(state));window.FlytSync.queueSave()},
    rpc(fn){requestHandler=fn},getSession(fn){getSessionHandler=fn},signOut(fn){signoutHandler=fn},
    switchUser(id){session={user:{id,user_metadata:{display_name:'B'}}};authHandler('SIGNED_IN',session)},
    async timers(max=650){for(const[id,t]of [...timers])if(t.ms<=max){timers.delete(id);await t.fn()}},
    intervals:()=>intervals.size,
  };
}
module.exports={harness,storage,server,deferred,blank};
