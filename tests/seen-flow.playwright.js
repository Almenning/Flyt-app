'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.setContent('<html lang="nb"><head><style>:root{--ink:#452f29;--muted:#806b61;--accent:#e87961;--deep:#ad4a3c;--line:#ead8d0}.hidden{display:none}.primary{min-height:44px}.card{padding:12px}.taskmeta{font-size:12px}</style></head><body><main id="content"></main><nav id="nav"><button data-view="seen">Sett</button></nav><div id="toast" class="hidden"></div></body></html>');
    await page.addScriptTag({path:path.join(root,'seen-core.js')});
    await page.evaluate(()=>{
      const day=window.FlytSeenCore.dateKey(),stamp=(hour)=>new Date(`${day}T${hour}:00+02:00`).toISOString();
      window.__state={
        user:'Tore',view:'seen',status:{Tore:{},Jannicke:{}},points:{Tore:120,Jannicke:180},taskClaims:[{taskId:'dinner',by:'Jannicke'}],
        tasks:[
          {id:'bed',name:'Legging av barna',pts:40},{id:'shop',name:'Handle mat',pts:30},{id:'laundry',name:'Vask klær',pts:20},{id:'dinner',name:'Lage middag',pts:50},{id:'mine',name:'Rydde kjøkkenet',pts:20}
        ],
        completions:[
          {id:'bed-1',taskId:'bed',date:day,by:'Jannicke',registeredAt:stamp('19:42')},
          {id:'shop-1',taskId:'shop',date:day,by:'Jannicke',registeredAt:stamp('16:18')},
          {id:'laundry-1',taskId:'laundry',date:day,by:'Jannicke',registeredAt:stamp('12:03')},
          {id:'dinner-1',taskId:'dinner',date:day,by:'Jannicke',registeredAt:stamp('10:00')},
          {id:'mine-1',taskId:'mine',date:day,by:'Tore',registeredAt:stamp('20:00')}
        ],plannedTasks:[],recognitions:[],seenPersonalNudges:{u_tore:[{id:'p1',category:'nice',text:'Du er favorittmennesket mitt'}]},seenSuggestionPreferences:{Tore:['Tok initiativ','Var tålmodig']}
      };
      window.__saves=0;window.__toasts=[];
      window.FlytBridge={getState:()=>window.__state,setState:next=>{window.__state=next},toast:text=>window.__toasts.push(text)};
      window.FlytSync={getContext:()=>({user_id:window.__state.user==='Tore'?'u_tore':'u_jannicke',members:[{id:'u_tore',display_name:'Tore'},{id:'u_jannicke',display_name:'Jannicke'}]}),queueSave:()=>{window.__saves+=1}};
      window.FlytSettingsUI={enabled:()=>true};window.FlytEdgeSwipeBack={bind(){},unbind(){}};
    });
    await page.addScriptTag({path:path.join(root,'seen-ui.js')});
    await page.evaluate(()=>window.FlytSeenUI.render({resetScroll:true}));

    assert.equal(await page.locator('.seenContribution').count(),4);
    assert.equal(await page.getByText('Rydde kjøkkenet').count(),0,'egne fullføringer skal ikke kunne anerkjennes');
    assert.equal(await page.locator('.seenContributionList').evaluate(el=>getComputedStyle(el).maxHeight),'222px');
    const first=page.locator('.seenContribution').first();
    assert.match(await first.innerText(),/Legging av barna/);
    await first.getByRole('button',{name:'Sett ♡'}).click();
    await first.getByRole('button',{name:'Sett ♥'}).waitFor();
    let snapshot=await page.evaluate(()=>structuredClone(window.__state));
    assert.deepEqual(snapshot.points,{Tore:120,Jannicke:180});
    assert.deepEqual(snapshot.taskClaims,[{taskId:'dinner',by:'Jannicke'}]);
    assert.equal(snapshot.completions.find(item=>item.id==='bed-1').acknowledgements.length,1);
    assert.equal(await page.getByText(/Sendt til .*Ferdig/).count(),0);

    await first.getByRole('button',{name:'+ Legg til en melding'}).click();
    await page.locator('#seenText').fill('Takk for at du tok leggingen. Jeg trengte pausen ❤️');
    await page.getByRole('button',{name:'Lagre melding'}).click();
    snapshot=await page.evaluate(()=>structuredClone(window.__state));
    assert.equal(snapshot.completions.find(item=>item.id==='bed-1').acknowledgements[0].text,'Takk for at du tok leggingen. Jeg trengte pausen ❤️');

    await page.getByRole('button',{name:/Gi anerkjennelse/}).click();
    assert.match(await page.locator('.seenSheet').innerText(),/Tok initiativ/);
    assert.equal(await page.getByRole('button',{name:'Send anerkjennelse'}).isDisabled(),true);
    await page.getByRole('button',{name:'Tok initiativ'}).click();
    assert.equal(await page.locator('#seenText').inputValue(),'Takk for at du tok initiativ. Jeg satte skikkelig pris på det ❤️');
    await page.getByRole('button',{name:'Støttet meg'}).click();
    assert.equal(await page.locator('#seenText').inputValue(),'Takk for at du støttet meg. Jeg satte veldig pris på det ❤️');
    await page.locator('#seenText').fill('Jeg satte pris på at du ordnet alt i morges.');
    await page.getByRole('button',{name:'Send anerkjennelse'}).click();
    assert.equal(await page.locator('.seenSheet').count(),0);
    assert.match((await page.evaluate(()=>window.__toasts.at(-1))),/Anerkjennelse sendt/);

    await page.getByRole('button',{name:/Send noe til Jannicke/}).click();
    await page.getByRole('button',{name:/Gi litt rom/}).click();
    await page.getByRole('button',{name:'Send',exact:true}).click();
    await page.getByRole('button',{name:/Send noe til Jannicke/}).click();
    await page.getByRole('button',{name:/Noe fint/}).click();
    assert.match(await page.locator('.seenSheet').innerText(),/Du er favorittmennesket mitt/);
    await page.getByRole('button',{name:'Send',exact:true}).click();
    await page.getByRole('button',{name:/Send noe til Jannicke/}).click();
    await page.getByRole('button',{name:/Flørt/}).click();
    await page.getByRole('button',{name:'Send',exact:true}).click();
    snapshot=await page.evaluate(()=>structuredClone(window.__state));
    assert.deepEqual(snapshot.recognitions.map(item=>item.type),['recognition','space','nice','flirt']);
    assert.equal(snapshot.quickTemptations?.length||0,0);
    assert.deepEqual(snapshot.points,{Tore:120,Jannicke:180});

    await page.evaluate(()=>{window.__state={...window.__state,user:'Jannicke',view:'home'};window.FlytSeenRecognitionAlert.check()});
    await page.locator('#seenRecognitionAlert').waitFor();
    const popup=await page.locator('#seenRecognitionAlert').innerText();
    assert.match(popup,/Nytt i Sett/);assert.match(popup,/Fra Tore/);assert.match(popup,/Takk for at du tok leggingen/);assert.match(popup,/1 av 5/);
    await page.locator('[data-recognition-alert-next]').click();
    snapshot=await page.evaluate(()=>structuredClone(window.__state));
    assert.equal(windowSafe(snapshot.completions.find(item=>item.id==='bed-1').acknowledgements[0].seenBy).includes('Jannicke'),true);
    assert.equal(windowSafe(snapshot.recognitions).length,4,'historikken beholdes etter popup');
    console.log('seen flow browser test passed');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});

function windowSafe(value){return Array.isArray(value)?value:[]}
