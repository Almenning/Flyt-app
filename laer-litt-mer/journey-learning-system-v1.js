/* Læria: systematic journey learning layer.
 * Pilot: Tallenga, 2. trinn.
 * Macro progression is fixed by explicit learning contracts. Concrete questions
 * vary inside each contract, while recent exact questions are avoided.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){
    root.LARIA_JOURNEY_LEARNING_SYSTEM=api;
    if(root.document)api.install(root);
  }
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const freezeList=list=>Object.freeze([...(list||[])]);
  const nodeContract=(objectiveId,learningGoal,skills,options={})=>Object.freeze({
    objectiveId,
    learningGoal,
    allowedSkills:freezeList(skills),
    allowedTypes:freezeList(options.allowedTypes||['learning-choice']),
    difficultyPattern:freezeList(options.difficultyPattern||[1,1,2,2,2]),
    questionCount:Number(options.questionCount||0)||null,
    kind:options.kind||'skill',
    chapter:options.chapter||'tallenga-1'
  });

  const MATH_G2_NODES=Object.freeze({
    plassverdi:nodeContract(
      'math-g2-place-value',
      'Forstå at plasseringen til et siffer bestemmer verdien i tosifrede tall.',
      ['place-value'],
      {questionCount:4,difficultyPattern:[1,1,1,2,2]}
    ),
    rekkefolge:nodeContract(
      'math-g2-number-order',
      'Sammenligne, plassere og fortsette tallrekkefølger innenfor 100.',
      ['number-order'],
      {questionCount:4,difficultyPattern:[1,1,2,2,2]}
    ),
    'tall100-challenge':nodeContract(
      'math-g2-number-sense-mix',
      'Bruke plassverdi og tallrekkefølge sammen i varierte oppgaver.',
      ['place-value','number-order'],
      {kind:'challenge',questionCount:5,difficultyPattern:[1,1,2,2,2]}
    ),
    'tall100-review':nodeContract(
      'math-g2-number-sense-review',
      'Repetere plassverdi og tallrekkefølge med nye varianter.',
      ['place-value','number-order'],
      {kind:'review',questionCount:5,difficultyPattern:[1,1,2,2,2]}
    ),
    'tall100-checkpoint':nodeContract(
      'math-g2-number-sense-checkpoint',
      'Vise trygghet i plassverdi og tallrekkefølge innenfor 100.',
      ['place-value','number-order'],
      {kind:'checkpoint',questionCount:5,difficultyPattern:[1,1,2,2,2]}
    ),
    addisjon100:nodeContract(
      'math-g2-addition-100',
      'Legge sammen tall innenfor 100 og kjenne igjen addisjon i en enkel situasjon.',
      ['addition-100'],
      {questionCount:4,difficultyPattern:[1,1,2,2,2]}
    ),
    'pluss100-challenge':nodeContract(
      'math-g2-addition-100-challenge',
      'Bruke addisjon innenfor 100 i flere uttrykksformer.',
      ['addition-100'],
      {kind:'challenge',questionCount:5,difficultyPattern:[1,1,2,2,2]}
    ),
    'pluss100-review':nodeContract(
      'math-g2-addition-100-review',
      'Repetere addisjon innenfor 100 med nye tall og situasjoner.',
      ['addition-100'],
      {kind:'review',questionCount:5,difficultyPattern:[1,1,2,2,2]}
    ),
    'pluss100-checkpoint':nodeContract(
      'math-g2-addition-100-checkpoint',
      'Vise trygghet i addisjon innenfor 100.',
      ['addition-100'],
      {kind:'checkpoint',questionCount:5,difficultyPattern:[1,1,2,2,2]}
    ),
    sub100:nodeContract(
      'math-g2-subtraction-100',
      'Trekke fra tall innenfor 100 og kjenne igjen subtraksjon i en enkel situasjon.',
      ['subtraction-100'],
      {questionCount:4,difficultyPattern:[1,1,2,2,2]}
    ),
    'minus100-challenge':nodeContract(
      'math-g2-subtraction-100-challenge',
      'Bruke subtraksjon innenfor 100 i flere uttrykksformer.',
      ['subtraction-100'],
      {kind:'challenge',questionCount:5,difficultyPattern:[1,1,2,2,2]}
    ),
    'minus100-review':nodeContract(
      'math-g2-subtraction-100-review',
      'Repetere subtraksjon innenfor 100 med nye tall og situasjoner.',
      ['subtraction-100'],
      {kind:'review',questionCount:5,difficultyPattern:[1,1,2,2,2]}
    ),
    'minus100-checkpoint':nodeContract(
      'math-g2-subtraction-100-checkpoint',
      'Vise trygghet i subtraksjon innenfor 100.',
      ['subtraction-100'],
      {kind:'checkpoint',questionCount:5,difficultyPattern:[1,1,2,2,2]}
    )
  });

  const CONTRACTS=Object.freeze({
    math:Object.freeze({
      2:Object.freeze({
        id:'tallenga-1',
        title:'Tallenga',
        chapter:1,
        philosophy:'systematic-progression-controlled-variation',
        nodes:MATH_G2_NODES
      })
    })
  });

  function contractFor(subject,grade,nodeId){
    return CONTRACTS?.[subject]?.[Number(grade)]?.nodes?.[nodeId]||null;
  }
  function chapterFor(subject,grade){
    return CONTRACTS?.[subject]?.[Number(grade)]||null;
  }
  function questionCount(node){
    const c=contractFor(node?.subject,node?.grade,node?.id);
    return c?.questionCount||null;
  }

  function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min}
  function shuffle(input){
    const a=[...(input||[])];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
    return a;
  }
  function uniqueOptions(answer,others){
    const out=[String(answer)];
    for(const item of others||[]){
      const value=String(item);
      if(!out.includes(value))out.push(value);
      if(out.length>=4)break;
    }
    let guard=0;
    while(out.length<3&&guard++<20){
      const n=Number(answer);
      const value=Number.isFinite(n)?String(Math.max(0,n+guard)):String(answer)+' '+guard;
      if(!out.includes(value))out.push(value);
    }
    return shuffle(out);
  }
  function choice(skill,prompt,answer,others,difficulty,family,objectiveId){
    return {
      subject:'math',
      skill,
      type:'learning-choice',
      prompt,
      answer:String(answer),
      options:uniqueOptions(answer,others),
      learning:Object.freeze({objectiveId,difficulty,family})
    };
  }
  function additionPair(difficulty){
    if(difficulty<=1){
      const a=rand(10,70),ones=rand(1,9);
      const maxB=Math.min(9,99-a);
      const b=Math.max(1,Math.min(ones,maxB));
      return [a,b];
    }
    const a=rand(12,68),b=rand(11,Math.min(31,99-a));
    return [a,b];
  }
  function subtractionPair(difficulty){
    if(difficulty<=1){
      const a=rand(20,90),b=rand(1,Math.min(9,a-1));
      return [a,b];
    }
    const a=rand(35,99),b=rand(11,Math.min(32,a-1));
    return [a,b];
  }
  function generatedForSkill(skill,objectiveId,count=18){
    const out=[];
    for(let i=0;i<count;i++){
      const difficulty=i%3===0?1:2;
      if(skill==='place-value'){
        const tens=rand(1,9),ones=rand(0,9),n=tens*10+ones;
        if(i%3===0){
          out.push(choice(skill,'Hva er verdien til '+tens+' i tallet '+n+'?',tens*10,[tens,ones,ones*10,tens*10+10],1,'digit-value',objectiveId));
        }else if(i%3===1){
          out.push(choice(skill,'Hvilket siffer står på tierplassen i '+n+'?',tens,[ones,tens*10,Math.max(0,tens-1)],1,'tens-digit',objectiveId));
        }else{
          out.push(choice(skill,'Hvilket tall er '+tens+' tiere og '+ones+' enere?',n,[tens+ones,tens*10,ones*10+tens],2,'compose-number',objectiveId));
        }
      }else if(skill==='number-order'){
        if(i%3===0){
          const vals=shuffle([rand(10,35),rand(36,65),rand(66,99)]);
          const answer=Math.max(...vals);
          out.push(choice(skill,'Hvilket tall er størst: '+vals.join(', ')+'?',answer,vals.filter(v=>v!==answer),1,'largest',objectiveId));
        }else if(i%3===1){
          const vals=shuffle([rand(10,35),rand(36,65),rand(66,99)]);
          const answer=Math.min(...vals);
          out.push(choice(skill,'Hvilket tall er minst: '+vals.join(', ')+'?',answer,vals.filter(v=>v!==answer),1,'smallest',objectiveId));
        }else{
          const start=rand(12,84),step=rand(2,5),a=start,b=start+step,c=start+step*2,answer=start+step*3;
          out.push(choice(skill,'Hva kommer videre? '+a+', '+b+', '+c+', …',answer,[answer+step,answer-1,answer+1],2,'continue-pattern',objectiveId));
        }
      }else if(skill==='addition-100'){
        const [a,b]=additionPair(difficulty),answer=a+b;
        if(i%3===0){
          out.push(choice(skill,a+' + '+b+' = ?',answer,[answer+1,answer-1,answer+10],difficulty,'direct-addition',objectiveId));
        }else if(i%3===1){
          out.push(choice(skill,'Reven har '+a+' kongler og finner '+b+' til. Hvor mange har reven nå?',answer,[answer-1,answer+1,a],difficulty,'story-addition',objectiveId));
        }else{
          const missing=b,total=answer;
          out.push(choice(skill,a+' + ? = '+total,missing,[missing-1,missing+1,a],difficulty,'missing-addend',objectiveId));
        }
      }else if(skill==='subtraction-100'){
        const [a,b]=subtractionPair(difficulty),answer=a-b;
        if(i%3===0){
          out.push(choice(skill,a+' − '+b+' = ?',answer,[answer+1,Math.max(0,answer-1),answer+10],difficulty,'direct-subtraction',objectiveId));
        }else if(i%3===1){
          out.push(choice(skill,'Reven har '+a+' steiner og gir bort '+b+'. Hvor mange er igjen?',answer,[answer+1,Math.max(0,answer-1),b],difficulty,'story-subtraction',objectiveId));
        }else{
          out.push(choice(skill,'Hvor stor er forskjellen mellom '+a+' og '+b+'?',answer,[answer+1,Math.max(0,answer-1),a+b],difficulty,'difference',objectiveId));
        }
      }
    }
    return out;
  }

  function identity(q){
    if(!q)return '';
    return [q.subject||'',q.skill||'',q.type||'',String(q.prompt||''),String(q.answer??''),String(q.visual||'')].join('|');
  }
  function withLearning(q,contract){
    if(q.learning?.objectiveId)return q;
    return {...q,learning:Object.freeze({
      objectiveId:contract.objectiveId,
      difficulty:2,
      family:'bank-'+String(q.type||'question')
    })};
  }
  function collectCandidates(root,node,contract,allowCooldown){
    const candidates=[],seen=new Set(),add=q=>{
      if(!q||!contract.allowedSkills.includes(q.skill)||!contract.allowedTypes.includes(q.type))return;
      const enriched=withLearning({...q},contract),sig=identity(enriched);
      if(seen.has(sig))return;
      if(!allowCooldown&&typeof root.questionOnCooldown==='function'&&root.questionOnCooldown(enriched))return;
      seen.add(sig);candidates.push(enriched);
    };
    const poolFn=typeof root.subjectPoolForGrade==='function'?root.subjectPoolForGrade:null;
    if(poolFn){
      for(let pass=0;pass<5;pass++){
        const pool=poolFn(node.subject,node.grade,node.module||null)||[];
        pool.forEach(add);
      }
    }
    for(const skill of contract.allowedSkills)generatedForSkill(skill,contract.objectiveId,22).forEach(add);
    return candidates;
  }
  function chooseSystematic(candidates,node,contract,count=5){
    const remaining=[...candidates],chosen=[],usedFamilies=new Set(),usedSkills=new Set();
    const take=predicate=>{
      const matches=remaining.filter(predicate);
      if(!matches.length)return false;
      matches.sort((a,b)=>{
        const af=usedFamilies.has(a.learning?.family)?1:0,bf=usedFamilies.has(b.learning?.family)?1:0;
        if(af!==bf)return af-bf;
        const as=usedSkills.has(a.skill)?1:0,bs=usedSkills.has(b.skill)?1:0;
        if(as!==bs)return as-bs;
        return Math.random()-.5;
      });
      const q=matches[0],idx=remaining.indexOf(q);
      if(idx>=0)remaining.splice(idx,1);
      chosen.push(q);usedFamilies.add(q.learning?.family);usedSkills.add(q.skill);
      return true;
    };

    if(contract.kind!=='skill'&&contract.allowedSkills.length>1){
      for(const skill of contract.allowedSkills){
        if(chosen.length>=count)break;
        take(q=>q.skill===skill);
      }
    }
    const pattern=contract.difficultyPattern.length?contract.difficultyPattern:[1,1,2,2,2];
    let pi=0;
    while(chosen.length<count&&remaining.length){
      const desired=pattern[Math.min(pi,pattern.length-1)];pi++;
      if(take(q=>Number(q.learning?.difficulty||2)===desired))continue;
      if(!take(()=>true))break;
    }
    return chosen.slice(0,count);
  }

  function buildForNode(root,subject,node,allowCooldown=false){
    const contract=contractFor(subject,node?.grade,node?.id);
    if(!contract)return null;
    const candidates=collectCandidates(root,node,contract,allowCooldown);
    return chooseSystematic(candidates,node,contract,5);
  }

  function decorateModel(model){
    if(!model||!Array.isArray(model.nodes))return model;
    const decorate=node=>{
      const learning=contractFor(node.subject,node.grade,node.id);
      return learning?{...node,learning}:node;
    };
    const areas=(model.areas||[]).map(area=>({...area,nodes:(area.nodes||[]).map(decorate)}));
    return {...model,areas,nodes:areas.flatMap(area=>area.nodes)};
  }

  function install(root){
    if(root.__LARIA_JOURNEY_LEARNING_SYSTEM_INSTALLED)return true;
    const originalModel=root.journeyModel;
    const originalBuilder=root.buildJourneyQuestions;
    if(typeof originalModel!=='function'||typeof originalBuilder!=='function')return false;

    root.journeyModel=function(subject,grade){
      return decorateModel(originalModel(subject,grade));
    };
    root.buildJourneyQuestions=function(subject,node,allowCooldown=false){
      const systematic=buildForNode(root,subject,node,allowCooldown);
      return systematic||originalBuilder(subject,node,allowCooldown);
    };
    root.__LARIA_JOURNEY_LEARNING_SYSTEM_INSTALLED=true;
    return true;
  }

  return Object.freeze({
    CONTRACTS,
    chapterFor,
    contractFor,
    questionCount,
    generatedForSkill,
    chooseSystematic,
    buildForNode,
    decorateModel,
    install
  });
});
