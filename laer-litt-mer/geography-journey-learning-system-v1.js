/* Læria: systematic geography journey layer.
 * Pilot: Nordlysleiren, 2. trinn.
 * Keeps the geography engine separate from the shared language/math engine.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){
    root.LARIA_GEOGRAPHY_JOURNEY_SYSTEM=api;
    if(root.document)api.install(root);
  }
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const freezeList=list=>Object.freeze([...(list||[])]);
  const nodeContract=(objectiveId,learningGoal,types,options={})=>Object.freeze({
    objectiveId,
    learningGoal,
    allowedGeoTypes:freezeList(types),
    questionCount:Number(options.questionCount||0)||5,
    kind:options.kind||'skill',
    placeIndex:Number.isInteger(options.placeIndex)?options.placeIndex:null,
    geoType:options.geoType||null,
    title:options.title||null,
    chapter:'nordlysleiren-1'
  });

  const G2_PLACES=Object.freeze([
    Object.freeze({index:0,title:'Basecamp',adventurePrompt:'Start i Norden og kjenn igjen flaggene til landene nærmest oss.',learningFocus:'nordiske land og flagg'}),
    Object.freeze({index:1,title:'Kartkroken',adventurePrompt:'Koble landene i Norden til hovedsteder og riktig plass på kartet.',learningFocus:'nordiske hovedsteder og kartplassering'}),
    Object.freeze({index:2,title:'Utforskertårnet',adventurePrompt:'Se sørover fra Norden og oppdag flere europeiske land gjennom flaggene.',learningFocus:'utvide landkjennskap i Europa'}),
    Object.freeze({index:3,title:'Naturstien',adventurePrompt:'Følg stien fra land til hovedstad og bygg flere forbindelser i Europa.',learningFocus:'hovedsteder i Norden og nære europeiske land'}),
    Object.freeze({index:4,title:'Observatoriet',adventurePrompt:'Se hele ruten ovenfra og finn landene på kartet før ekspedisjonen avsluttes.',learningFocus:'kartplassering og samlet geografiforståelse'})
  ]);

  const G2_NODES=Object.freeze({
    'norden-flag':nodeContract(
      'geography-g2-nordic-flags',
      'Kjenne igjen flaggene til nordiske land.',
      ['flag'],{placeIndex:0}
    ),
    'norden-capital':nodeContract(
      'geography-g2-nordic-capitals',
      'Koble nordiske land til riktig hovedstad.',
      ['capital'],{placeIndex:1}
    ),
    'norden-map':nodeContract(
      'geography-g2-nordic-map',
      'Finne nordiske land på kartet.',
      ['map'],{placeIndex:1}
    ),
    'norden-challenge':nodeContract(
      'geography-g2-nordic-challenge',
      'Bruke flagg, hovedsteder og kartplassering sammen.',
      ['flag','capital','map'],{kind:'challenge',placeIndex:1}
    ),
    'norden-review':nodeContract(
      'geography-g2-nordic-review',
      'Repetere Norden med nye land og representasjoner.',
      ['flag','capital','map'],{kind:'review',placeIndex:1}
    ),
    'norden-checkpoint':nodeContract(
      'geography-g2-nordic-checkpoint',
      'Vise trygghet i Norden før ekspedisjonen går videre.',
      ['flag','capital','map'],{kind:'checkpoint',placeIndex:1}
    ),
    'naboer-flag':nodeContract(
      'geography-g2-near-europe-flags',
      'Kjenne igjen flagg i Norden og noen sentrale land like utenfor Norden.',
      ['flag'],{placeIndex:2}
    ),
    // Behold legacy-ID-en for lagret fremgang, men gi stoppet reelt faglig innhold:
    // alle landene i denne banken ligger allerede i Europa, så verdensdelsspørsmålet
    // ville ellers hatt samme svar fem ganger.
    'naboer-continent':nodeContract(
      'geography-g2-near-europe-capitals',
      'Koble Norden, Storbritannia, Tyskland og Frankrike til hovedstedene deres.',
      ['capital'],{placeIndex:3,geoType:'capital',title:'Hovedsteder'}
    ),
    'naboer-map':nodeContract(
      'geography-g2-near-europe-map',
      'Finne Norden, Storbritannia, Tyskland og Frankrike på kartet.',
      ['map'],{placeIndex:4}
    ),
    'naboer-challenge':nodeContract(
      'geography-g2-near-europe-challenge',
      'Veksle mellom flagg, hovedsteder og kart i den utvidede Europa-ruten.',
      ['flag','capital','map'],{kind:'challenge',placeIndex:4}
    ),
    'naboer-review':nodeContract(
      'geography-g2-near-europe-review',
      'Repetere land, hovedsteder, flagg og plassering i den utvidede Europa-ruten.',
      ['flag','capital','map'],{kind:'review',placeIndex:4}
    ),
    'naboer-checkpoint':nodeContract(
      'geography-g2-near-europe-checkpoint',
      'Vise trygghet i Norden og de første europeiske landene utenfor Norden.',
      ['flag','capital','map'],{kind:'checkpoint',placeIndex:4}
    )
  });

  const CONTRACT=Object.freeze({
    id:'nordlysleiren-1',
    title:'Nordlysleiren',
    chapter:1,
    philosophy:'systematic-progression-controlled-variation',
    places:G2_PLACES,
    areaTypeOverrides:Object.freeze({
      naboer:Object.freeze({continent:'capital'})
    }),
    nodes:G2_NODES
  });

  function chapterFor(grade){return Number(grade)===2?CONTRACT:null}
  function contractFor(grade,nodeId){return chapterFor(grade)?.nodes?.[nodeId]||null}
  function placeRoleFor(grade,index){return chapterFor(grade)?.places?.[Number(index)]||null}

  function identity(q){
    if(!q)return '';
    return [String(q.k||''),String(q.type||''),String(q.prompt||''),String(q.answer??'')].join('|');
  }
  function withLearning(q,contract){
    return {...q,learning:Object.freeze({
      objectiveId:contract.objectiveId,
      family:'geo-'+String(q.type||'question')
    })};
  }

  function collectCandidates(root,node,contract,allowCooldown){
    const candidates=[],seen=new Set();
    const add=(id,type)=>{
      if(!contract.allowedGeoTypes.includes(type))return;
      const available=typeof root.questionTypesForCountry==='function'
        ?root.questionTypesForCountry(id,true,node.grade):[];
      if(!available.includes(type))return;
      const q=root.makeQuestion(id,type,node.ids,node.grade);
      if(!q)return;
      const cooling=typeof root.questionOnCooldown==='function'&&root.questionOnCooldown(q);
      if(cooling&&!allowCooldown)return;
      q.practiceRepeat=!!cooling;
      const enriched=withLearning(q,contract),sig=identity(enriched);
      if(seen.has(sig))return;
      seen.add(sig);candidates.push(enriched);
    };
    for(const id of node.ids||[]){
      for(const type of contract.allowedGeoTypes)add(id,type);
    }
    return candidates;
  }

  function choose(candidates,contract,count=5){
    const remaining=[...candidates],chosen=[],usedCountries=new Set(),usedTypes=new Set();
    const take=predicate=>{
      const matches=remaining.filter(predicate);
      if(!matches.length)return false;
      matches.sort((a,b)=>{
        const ac=usedCountries.has(a.k)?1:0,bc=usedCountries.has(b.k)?1:0;
        if(ac!==bc)return ac-bc;
        const at=usedTypes.has(a.type)?1:0,bt=usedTypes.has(b.type)?1:0;
        if(at!==bt)return at-bt;
        return Math.random()-.5;
      });
      const q=matches[0],i=remaining.indexOf(q);
      if(i>=0)remaining.splice(i,1);
      chosen.push(q);usedCountries.add(q.k);usedTypes.add(q.type);
      return true;
    };

    if(contract.kind!=='skill'&&contract.allowedGeoTypes.length>1){
      for(const type of contract.allowedGeoTypes){
        if(chosen.length>=count)break;
        take(q=>q.type===type);
      }
    }
    while(chosen.length<count&&remaining.length){
      if(!take(()=>true))break;
    }
    return chosen.slice(0,count);
  }

  function buildForNode(root,node,allowCooldown=false){
    const contract=contractFor(node?.grade,node?.id);
    if(!contract)return null;
    return choose(collectCandidates(root,node,contract,allowCooldown),contract,contract.questionCount);
  }

  function decorateModel(model){
    if(!model||Number(model.grade)!==2||!Array.isArray(model.nodes))return model;
    const areas=(model.areas||[]).map(area=>{
      const replacements=CONTRACT.areaTypeOverrides?.[area.id]||{};
      const types=(area.types||[]).map(type=>replacements[type]||type);
      const nodes=(area.nodes||[]).map(node=>{
        const learning=contractFor(model.grade,node.id);
        let next={...node,areaTypes:types};
        if(learning){
          next={...next,learning};
          if(learning.geoType)next.geoType=learning.geoType;
          if(learning.title)next.title=learning.title;
        }
        return next;
      });
      return {...area,types,nodes};
    });
    return {...model,areas,nodes:areas.flatMap(a=>a.nodes),learningPlaces:CONTRACT.places};
  }

  function install(root){
    if(root.__LARIA_GEOGRAPHY_JOURNEY_SYSTEM_INSTALLED)return true;
    const originalModel=root.geoJourneyModel;
    const originalBuilder=root.buildGeoJourneyQuestions;
    if(typeof originalModel!=='function'||typeof originalBuilder!=='function')return false;

    root.geoJourneyModel=function(grade){
      return decorateModel(originalModel(grade));
    };
    root.buildGeoJourneyQuestions=function(node,allowCooldown=false){
      const systematic=buildForNode(root,node,allowCooldown);
      return systematic||originalBuilder(node,allowCooldown);
    };
    root.__LARIA_GEOGRAPHY_JOURNEY_SYSTEM_INSTALLED=true;
    return true;
  }

  return Object.freeze({
    CONTRACT,
    chapterFor,
    contractFor,
    placeRoleFor,
    collectCandidates,
    choose,
    buildForNode,
    decorateModel,
    install
  });
});
