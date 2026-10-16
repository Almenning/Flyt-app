/* Læria: systematic journey learning layer.
 * Chapter 1 contracts for the grade-2 journeys. Macro progression is explicit;
 * concrete questions vary inside each learning goal, with recent repeats avoided.
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
    chapter:options.chapter||'tallenga-1',
    placeIndex:Number.isInteger(options.placeIndex)?options.placeIndex:null
  });

  const MATH_G2_PLACES=Object.freeze([
    Object.freeze({index:0,title:'Tallverkstedet',adventurePrompt:'Bygg tall og finn hva sifrene egentlig er verdt.',learningFocus:'plassverdi'}),
    Object.freeze({index:1,title:'Formfabrikken',adventurePrompt:'Finn mønstre og sett tallene i riktig rekkefølge.',learningFocus:'tallrekkefølge og mønster'}),
    Object.freeze({index:2,title:'Brøklaben',adventurePrompt:'Del, bygg og eksperimenter med brøker i ditt eget tempo.',learningFocus:'fri utforskning av brøk',freePlay:'fraction-lab'}),
    Object.freeze({index:3,title:'Målebroen',adventurePrompt:'Regn deg over broen med pluss, minus og forskjeller.',learningFocus:'addisjon og subtraksjon i konkrete situasjoner'}),
    Object.freeze({index:4,title:'Problemtårnet',adventurePrompt:'Bruk det du har oppdaget til å løse den siste utfordringen.',learningFocus:'problemløsning og checkpoint'})
  ]);

  const MATH_G2_NODES=Object.freeze({
    plassverdi:nodeContract(
      'math-g2-place-value',
      'Forstå at plasseringen til et siffer bestemmer verdien i tosifrede tall.',
      ['place-value'],
      {questionCount:4,difficultyPattern:[1,1,1,2,2],placeIndex:0}
    ),
    rekkefolge:nodeContract(
      'math-g2-number-order',
      'Sammenligne, plassere og fortsette tallrekkefølger innenfor 100.',
      ['number-order'],
      {questionCount:4,difficultyPattern:[1,1,2,2,2],placeIndex:1}
    ),
    'tall100-challenge':nodeContract(
      'math-g2-number-sense-mix',
      'Bruke plassverdi og tallrekkefølge sammen i varierte oppgaver.',
      ['place-value','number-order'],
      {kind:'challenge',questionCount:5,difficultyPattern:[1,1,2,2,2],placeIndex:1}
    ),
    'tall100-review':nodeContract(
      'math-g2-number-sense-review',
      'Repetere plassverdi og tallrekkefølge med nye varianter.',
      ['place-value','number-order'],
      {kind:'review',questionCount:5,difficultyPattern:[1,1,2,2,2],placeIndex:1}
    ),
    'tall100-checkpoint':nodeContract(
      'math-g2-number-sense-checkpoint',
      'Vise trygghet i plassverdi og tallrekkefølge innenfor 100.',
      ['place-value','number-order'],
      {kind:'checkpoint',questionCount:5,difficultyPattern:[1,1,2,2,2],placeIndex:1}
    ),
    addisjon100:nodeContract(
      'math-g2-addition-100',
      'Legge sammen tall innenfor 100 og kjenne igjen addisjon i en enkel situasjon.',
      ['addition-100'],
      {questionCount:4,difficultyPattern:[1,1,2,2,2],placeIndex:3}
    ),
    'pluss100-challenge':nodeContract(
      'math-g2-addition-100-challenge',
      'Bruke addisjon innenfor 100 i flere uttrykksformer.',
      ['addition-100'],
      {kind:'challenge',questionCount:5,difficultyPattern:[1,1,2,2,2],placeIndex:3}
    ),
    'pluss100-review':nodeContract(
      'math-g2-addition-100-review',
      'Repetere addisjon innenfor 100 med nye tall og situasjoner.',
      ['addition-100'],
      {kind:'review',questionCount:5,difficultyPattern:[1,1,2,2,2],placeIndex:3}
    ),
    'pluss100-checkpoint':nodeContract(
      'math-g2-addition-100-checkpoint',
      'Vise trygghet i addisjon innenfor 100.',
      ['addition-100'],
      {kind:'checkpoint',questionCount:5,difficultyPattern:[1,1,2,2,2],placeIndex:3}
    ),
    sub100:nodeContract(
      'math-g2-subtraction-100',
      'Trekke fra tall innenfor 100 og kjenne igjen subtraksjon i en enkel situasjon.',
      ['subtraction-100'],
      {questionCount:4,difficultyPattern:[1,1,2,2,2],placeIndex:3}
    ),
    'minus100-challenge':nodeContract(
      'math-g2-subtraction-100-challenge',
      'Bruke subtraksjon innenfor 100 i flere uttrykksformer.',
      ['subtraction-100'],
      {kind:'challenge',questionCount:5,difficultyPattern:[1,1,2,2,2],placeIndex:4}
    ),
    'minus100-review':nodeContract(
      'math-g2-subtraction-100-review',
      'Repetere subtraksjon innenfor 100 med nye tall og situasjoner.',
      ['subtraction-100'],
      {kind:'review',questionCount:5,difficultyPattern:[1,1,2,2,2],placeIndex:4}
    ),
    'minus100-checkpoint':nodeContract(
      'math-g2-subtraction-100-checkpoint',
      'Vise trygghet i subtraksjon innenfor 100.',
      ['subtraction-100'],
      {kind:'checkpoint',questionCount:5,difficultyPattern:[1,1,2,2,2],placeIndex:4}
    )
  });

  const languageContract=(objectiveId,learningGoal,skills,options={})=>
    nodeContract(objectiveId,learningGoal,skills,{
      questionCount:options.questionCount||4,
      difficultyPattern:options.difficultyPattern||[1,1,2,2,2],
      allowedTypes:options.allowedTypes||['learning-choice'],
      kind:options.kind||'skill',
      chapter:options.chapter,
      placeIndex:options.placeIndex
    });

  const NORWEGIAN_G2_PLACES=Object.freeze([
    Object.freeze({index:0,title:'Leselyset',adventurePrompt:'Tenn leselyset og koble bokstaver til lydene du hører.',learningFocus:'bokstavlyd og enkel avkoding'}),
    Object.freeze({index:1,title:'Ordverkstedet',adventurePrompt:'Bygg, finn og lek med ord som passer sammen.',learningFocus:'ordgjenkjenning, rim og ordforråd'}),
    Object.freeze({index:2,title:'Historiehytta',adventurePrompt:'Sett ord sammen så små historier begynner å leve.',learningFocus:'setningsbygging og betydning'}),
    Object.freeze({index:3,title:'Setningsbroen',adventurePrompt:'Les korte tekster og finn det teksten faktisk forteller.',learningFocus:'detaljer og leseforståelse'}),
    Object.freeze({index:4,title:'Fortellingstårnet',adventurePrompt:'Klatre til toppen ved å lese mellom linjene og tenke videre.',learningFocus:'inferens og samlet leseforståelse'})
  ]);

  const NORWEGIAN_G2_NODES=Object.freeze({
    lyder:languageContract('norwegian-g2-letter-sound','Koble bokstaver, lyder og manglende bokstaver i korte kjente ord.',
      ['letter-sound','missing-letter'],{allowedTypes:['build-word','learning-choice'],placeIndex:0,chapter:'bokskogen-1'}),
    ordbilder:languageContract('norwegian-g2-word-picture','Kjenne igjen vanlige ord og koble dem til riktig bilde.',
      ['word-picture'],{placeIndex:1,chapter:'bokskogen-1'}),
    ordlek:languageContract('norwegian-g2-word-play','Oppdage rim og ord med lik eller nær betydning.',
      ['rhyme','synonyms'],{placeIndex:1,chapter:'bokskogen-1'}),
    'ordstart-challenge':languageContract('norwegian-g2-word-start-challenge','Bruke bokstavlyd, ordgjenkjenning og ordlek sammen.',
      ['letter-sound','missing-letter','word-picture','rhyme','synonyms'],{allowedTypes:['build-word','learning-choice'],kind:'challenge',questionCount:5,placeIndex:1,chapter:'bokskogen-1'}),
    'ordstart-review':languageContract('norwegian-g2-word-start-review','Hente fram bokstaver og ord igjen gjennom variert repetisjon.',
      ['letter-sound','missing-letter','word-picture','rhyme','synonyms'],{allowedTypes:['build-word','learning-choice'],kind:'review',questionCount:5,placeIndex:1,chapter:'bokskogen-1'}),
    'ordstart-checkpoint':languageContract('norwegian-g2-word-start-checkpoint','Vise trygghet i bokstavlyd, ordgjenkjenning og enkel ordlek.',
      ['letter-sound','missing-letter','word-picture','rhyme','synonyms'],{allowedTypes:['build-word','learning-choice'],kind:'checkpoint',questionCount:5,placeIndex:1,chapter:'bokskogen-1'}),

    setningsrekkefolge:languageContract('norwegian-g2-sentence-order','Sette ord i riktig rekkefølge og bygge en meningsfull enkel setning.',
      ['sentence-order'],{allowedTypes:['sentence-order'],placeIndex:2,chapter:'bokskogen-1'}),
    ordbetydning:languageContract('norwegian-g2-word-meaning','Forstå ord gjennom rim, synonym og betydningslikhet.',
      ['synonyms','rhyme'],{placeIndex:2,chapter:'bokskogen-1'}),
    'setninger-challenge':languageContract('norwegian-g2-sentence-challenge','Bruke ordforståelse og setningsbygging sammen.',
      ['sentence-order','synonyms','rhyme'],{allowedTypes:['sentence-order','learning-choice'],kind:'challenge',questionCount:5,placeIndex:2,chapter:'bokskogen-1'}),
    'setninger-review':languageContract('norwegian-g2-sentence-review','Repetere ordforståelse og setningsbygging med nye eksempler.',
      ['sentence-order','synonyms','rhyme'],{allowedTypes:['sentence-order','learning-choice'],kind:'review',questionCount:5,placeIndex:2,chapter:'bokskogen-1'}),
    'setninger-checkpoint':languageContract('norwegian-g2-sentence-checkpoint','Vise trygghet i enkel setningsbygging og ordforståelse.',
      ['sentence-order','synonyms','rhyme'],{allowedTypes:['sentence-order','learning-choice'],kind:'checkpoint',questionCount:5,placeIndex:2,chapter:'bokskogen-1'}),

    detaljer:languageContract('norwegian-g2-reading-detail','Finne uttrykt informasjon og konkrete detaljer i en kort tekst.',
      ['reading-detail'],{placeIndex:3,chapter:'bokskogen-1'}),
    forsta:languageContract('norwegian-g2-reading-comprehension','Forstå hovedinnhold og enkle årsaker i korte tekster.',
      ['reading-comprehension'],{placeIndex:3,chapter:'bokskogen-1'}),
    tenkvidere:languageContract('norwegian-g2-reading-inference','Bruke spor i teksten til å trekke en enkel slutning.',
      ['reading-inference'],{placeIndex:4,chapter:'bokskogen-1'}),
    'lesedetektiv-challenge':languageContract('norwegian-g2-reading-challenge','Veksle mellom detaljer, forståelse og enkle slutninger i tekst.',
      ['reading-detail','reading-comprehension','reading-inference'],{kind:'challenge',questionCount:5,placeIndex:4,chapter:'bokskogen-1'}),
    'lesedetektiv-review':languageContract('norwegian-g2-reading-review','Repetere leseforståelse med andre korte tekster og spørsmål.',
      ['reading-detail','reading-comprehension','reading-inference'],{kind:'review',questionCount:5,placeIndex:4,chapter:'bokskogen-1'}),
    'lesedetektiv-checkpoint':languageContract('norwegian-g2-reading-checkpoint','Vise trygghet i å hente mening fra en kort tekst.',
      ['reading-detail','reading-comprehension','reading-inference'],{kind:'checkpoint',questionCount:5,placeIndex:4,chapter:'bokskogen-1'})
  });

  const ENGLISH_G2_PLACES=Object.freeze([
    Object.freeze({index:0,title:'Startplassen',adventurePrompt:'Start reisen med de engelske ordene du møter aller oftest.',learningFocus:'grunnleggende ord'}),
    Object.freeze({index:1,title:'Ordhandelen',adventurePrompt:'Samle flere engelske ord, tall og stavemønstre.',learningFocus:'ord, tall og staving'}),
    Object.freeze({index:2,title:'Grammatikkhuset',adventurePrompt:'Sett sammen små engelske uttrykk og se hvordan ordene henger sammen.',learningFocus:'nyttige fraser og språkstruktur'}),
    Object.freeze({index:3,title:'Snakkekaféen',adventurePrompt:'Bygg engelske setninger du faktisk kan bruke når du snakker.',learningFocus:'setningsbygging og enkel kommunikasjon'}),
    Object.freeze({index:4,title:'Fortellingsslottet',adventurePrompt:'Les små engelske historier og finn ut hva som skjer.',learningFocus:'leseforståelse'})
  ]);

  const ENGLISH_G2_NODES=Object.freeze({
    words:languageContract('english-g2-first-words','Kjenne igjen og stave vanlige engelske ord med støtte i bilde og mening.',
      ['words','spelling'],{allowedTypes:['learning-choice','build-word'],placeIndex:0,chapter:'ordlandsbyen-1'}),
    numbers:languageContract('english-g2-numbers','Forstå og bruke enkle engelske tallord.',
      ['numbers'],{placeIndex:1,chapter:'ordlandsbyen-1'}),
    'firstwords-challenge':languageContract('english-g2-first-words-challenge','Veksle mellom vanlige ord, staving og engelske tallord.',
      ['words','spelling','numbers'],{allowedTypes:['learning-choice','build-word'],kind:'challenge',questionCount:5,placeIndex:1,chapter:'ordlandsbyen-1'}),
    'firstwords-review':languageContract('english-g2-first-words-review','Hente fram vanlige ord, staving og tallord igjen.',
      ['words','spelling','numbers'],{allowedTypes:['learning-choice','build-word'],kind:'review',questionCount:5,placeIndex:1,chapter:'ordlandsbyen-1'}),
    'firstwords-checkpoint':languageContract('english-g2-first-words-checkpoint','Vise trygghet i første engelske ord, staving og tall.',
      ['words','spelling','numbers'],{allowedTypes:['learning-choice','build-word'],kind:'checkpoint',questionCount:5,placeIndex:1,chapter:'ordlandsbyen-1'}),

    phrases:languageContract('english-g2-useful-phrases','Forstå og velge enkle engelske fraser i kjente situasjoner.',
      ['phrases'],{placeIndex:2,chapter:'ordlandsbyen-1'}),
    sentences:languageContract('english-g2-sentences','Bygge og kjenne igjen enkle engelske setninger.',
      ['sentence'],{allowedTypes:['learning-choice','sentence-order'],placeIndex:3,chapter:'ordlandsbyen-1'}),
    'talk-challenge':languageContract('english-g2-talk-challenge','Bruke enkle fraser og setninger i varierte hverdagssituasjoner.',
      ['phrases','sentence'],{allowedTypes:['learning-choice','sentence-order'],kind:'challenge',questionCount:5,placeIndex:3,chapter:'ordlandsbyen-1'}),
    'talk-review':languageContract('english-g2-talk-review','Repetere fraser og setninger med nye situasjoner.',
      ['phrases','sentence'],{allowedTypes:['learning-choice','sentence-order'],kind:'review',questionCount:5,placeIndex:3,chapter:'ordlandsbyen-1'}),
    'talk-checkpoint':languageContract('english-g2-talk-checkpoint','Vise trygghet i enkel engelsk kommunikasjon og setningsbygging.',
      ['phrases','sentence'],{allowedTypes:['learning-choice','sentence-order'],kind:'checkpoint',questionCount:5,placeIndex:3,chapter:'ordlandsbyen-1'}),

    reading:languageContract('english-g2-reading','Forstå eksplisitt innhold og enkle sammenhenger i svært korte engelske tekster.',
      ['reading'],{placeIndex:4,chapter:'ordlandsbyen-1'}),
    'read-challenge':languageContract('english-g2-reading-challenge','Lese flere korte engelske tekster og svare på varierte spørsmål.',
      ['reading'],{kind:'challenge',questionCount:5,placeIndex:4,chapter:'ordlandsbyen-1'}),
    'read-review':languageContract('english-g2-reading-review','Hente fram engelsk leseforståelse igjen med nye korte tekster.',
      ['reading'],{kind:'review',questionCount:5,placeIndex:4,chapter:'ordlandsbyen-1'}),
    'read-checkpoint':languageContract('english-g2-reading-checkpoint','Vise trygghet i å forstå en kort engelsk tekst.',
      ['reading'],{kind:'checkpoint',questionCount:5,placeIndex:4,chapter:'ordlandsbyen-1'})
  });

  const CONTRACTS=Object.freeze({
    norwegian:Object.freeze({
      2:Object.freeze({
        id:'bokskogen-1',title:'Bokskogen',chapter:1,
        philosophy:'systematic-progression-controlled-variation',
        places:NORWEGIAN_G2_PLACES,nodes:NORWEGIAN_G2_NODES
      })
    }),
    math:Object.freeze({
      2:Object.freeze({
        id:'tallenga-1',
        title:'Tallenga',
        chapter:1,
        philosophy:'systematic-progression-controlled-variation',
        places:MATH_G2_PLACES,
        nodes:MATH_G2_NODES
      })
    }),
    english:Object.freeze({
      2:Object.freeze({
        id:'ordlandsbyen-1',title:'Ordlandsbyen',chapter:1,
        philosophy:'systematic-progression-controlled-variation',
        places:ENGLISH_G2_PLACES,nodes:ENGLISH_G2_NODES
      })
    })
  });

  function contractFor(subject,grade,nodeId){
    return CONTRACTS?.[subject]?.[Number(grade)]?.nodes?.[nodeId]||null;
  }
  function chapterFor(subject,grade){
    return CONTRACTS?.[subject]?.[Number(grade)]||null;
  }
  function placeRoleFor(subject,grade,index){
    return CONTRACTS?.[subject]?.[Number(grade)]?.places?.[Number(index)]||null;
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
          out.push(choice(skill,'Broen er '+a+' steg lang, og reven bygger '+b+' steg til. Hvor lang er broen nå?',answer,[answer-1,answer+1,a],difficulty,'bridge-addition',objectiveId));
        }else{
          const missing=b,total=answer;
          out.push(choice(skill,a+' + ? = '+total,missing,[missing-1,missing+1,a],difficulty,'missing-addend',objectiveId));
        }
      }else if(skill==='subtraction-100'){
        const [a,b]=subtractionPair(difficulty),answer=a-b;
        if(i%3===0){
          out.push(choice(skill,a+' − '+b+' = ?',answer,[answer+1,Math.max(0,answer-1),answer+10],difficulty,'direct-subtraction',objectiveId));
        }else if(i%3===1){
          out.push(choice(skill,'Reven skal over '+a+' steg på broen og har gått '+b+'. Hvor mange steg er igjen?',answer,[answer+1,Math.max(0,answer-1),b],difficulty,'bridge-subtraction',objectiveId));
        }else{
          out.push(choice(skill,'Hvor stor er forskjellen mellom '+a+' og '+b+'?',answer,[answer+1,Math.max(0,answer-1),a+b],difficulty,'difference',objectiveId));
        }
      }
    }
    return out;
  }

  function identity(q){
    if(!q)return '';
    return [q.subject||'',q.skill||'',q.type||'',String(q.prompt||''),String(q.answer??''),String(q.passage||''),String(q.visual||'')].join('|');
  }
  function bankDifficulty(q){
    if(q?.type==='build-word')return 1;
    if(q?.visual&&q?.type==='learning-choice')return 1;
    if(q?.type==='sentence-order')return 2;
    if(q?.passage)return 2;
    if(q?.type==='learning-choice'&&Array.isArray(q.options)&&q.options.length<=3)return 1;
    return 2;
  }
  function bankFamily(q){
    if(q?.passage)return 'bank-reading';
    if(q?.visual)return 'bank-visual-'+String(q.type||'question');
    return 'bank-'+String(q?.type||'question');
  }
  function withLearning(q,contract){
    if(q.learning?.objectiveId)return q;
    return {...q,learning:Object.freeze({
      objectiveId:contract.objectiveId,
      difficulty:bankDifficulty(q),
      family:bankFamily(q)
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
    if(node.subject==='math'){
      for(const skill of contract.allowedSkills)generatedForSkill(skill,contract.objectiveId,22).forEach(add);
    }
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

    if(contract.allowedSkills.length>1){
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
    const chapter=chapterFor(model.subject,model.grade);
    return {...model,areas,nodes:areas.flatMap(area=>area.nodes),
      learningPlaces:chapter?.places||model.learningPlaces||null};
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
    placeRoleFor,
    questionCount,
    generatedForSkill,
    chooseSystematic,
    buildForNode,
    decorateModel,
    install
  });
});
