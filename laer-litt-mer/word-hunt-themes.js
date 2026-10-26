/* Læria Ordjakt: curated, repeatable themed word packs. No new learning grades. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LARIA_WORD_HUNT_THEMES=api;
})(typeof window==='object'?window:(typeof globalThis==='object'?globalThis:null),function(){
  'use strict';
  const data=[
    {id:'mixed',title:'Blandede ord',short:'Blandet',icon:'✨',description:'Litt av alt fra Eggenipa.',
      easy:['SOL','MUS','REV','BOK','IS','MAT','HUS','BIL','TRE','SKO','LYS','HAV','FISK','KATT','BALL','LEK','UGLE','EPLE','TROLL','KART','BÆR','ELG','VANN','OST','BIE','HARE','ROM','KONGE','BRØD','HEKS','SEBRA','SLOTT'],
      hard:['SKOG','BRO','KART','VANN','LYKT','REVEN','FJELL','VENN','LEKE','TALL','PIZZA','BLOMST','STJERNE','SPRÅK','ORD','BOKA','MONSTER','KANIN','EVENTYR','PANTER','NØKKEL','PORTAL','MIDDAG','GROTTE','TIGER','SVERIGE','ITALIA','BANAN','KJØTT','HJORT']},
    {id:'animals',title:'Dyrevenner',short:'Dyr',icon:'🦉',description:'Møt ugler, pinnsvin og andre dyrevenner.',
      easy:['REV','MUS','UGLE','HUND','KATT','HEST','KU','FISK','LAM','AND','ELG','BIE','HARE','GEIT','LØVE','SEBRA','EKORN','KANIN','HVAL','TIGER','MAUR','FUGL','ORM','RÅDYR'],
      hard:['BJØRN','HJORT','EKORN','KANIN','ROVDYR','PANTER','SEBRA','TIGER','PINGVIN','GREVING','GEITER','HVALEN','FUGLER','MAUREN','FROSKE','DYRENE','KATTEN','REVENE','HUNDEN','HESTER','BJØRNER','KRABBE']},
    {id:'magic',title:'Eventyr og magi',short:'Magi',icon:'🪄',description:'Oppdag slott, troll og magiske skatter.',
      easy:['HEKS','MAGI','FE','SKATT','KONGE','DRAGE','BORG','REV','KRONE','TROLL','ALV','STAV','SLOTT','NØKKEL','LYKT','RUNE','HELT','GULL','BOK','SKOG','ÅND'],
      hard:['DRAGE','TROLL','PORTAL','TRYLLE','STJERNE','EVENTYR','SKYGGE','GROTTE','KONGEN','KRONE','NØKKEL','MONSTER','FANTASI','MAGIEN','RIDDER','SKATTER','MÅNELY','SPØKEL','SVERDET','SKOGEN','SLANGE','RØVEREN','HEKS','GULL','SLOTT','MAGI','BORG','RUNE','STAV']},
    {id:'food',title:'Mat og hverdag',short:'Mat',icon:'🍎',description:'Finn ord fra kjøkkenet og hverdagen.',
      easy:['BRØD','OST','MELK','EPLE','IS','RIS','PÆRE','SAFT','KORN','KAKE','BÆR','SUPPE','FISK','MEL','AGURK','PIZZA','POTET','SMØR','BOLLE','MAT','VANN','BANAN','TOMAT'],
      hard:['PIZZA','BANAN','BOLLER','YOGHURT','TOMAT','AGURK','PAPRIKA','GRØT','SALAT','HAVRE','KJØTT','MIDDAG','DESSERT','HONNING','FRUKT','GULROT','OSTENE','BRØDET','SAFTEN','MATPAKKE','KAKENE','GRØNNSAK']},
    {id:'world',title:'Verden rundt',short:'Verden',icon:'🌍',description:'Land, steder og ord fra verden.',
      easy:['NORGE','KINA','JAPAN','KENYA','EGYPT','INDIA','PERU','MALI','LAOS','CHILE','NEPAL','CUBA','POLEN','GHANA','SUDAN','ITALIA','SPANIA','HAV','KART','FJELL','ELV','BY','ØY'],
      hard:['SVERIGE','ISLAND','ITALIA','SPANIA','FINLAND','LONDON','BERLIN','MADRID','DUBLIN','ATHEN','ANKARA','TOKYO','PARIS','KARTET','FJELLET','LANDET','BYENE','NATUREN','NORGE','EUROPA','VERDEN','KENYA']}
  ];
  const PACKS=Object.freeze(data.map(pack=>Object.freeze({
    ...pack,easy:Object.freeze(pack.easy.filter(w=>w.length>=2&&w.length<=6)),
    hard:Object.freeze(pack.hard.filter(w=>w.length>=2&&w.length<=7))
  })));
  const BY_ID=new Map(PACKS.map(pack=>[pack.id,pack]));
  const EFFECTS=Object.freeze({
    UGLE:['🦉','En ugle hilser fra tretoppene.'],
    REV:['🦊','Et vennlig spor dukker opp mellom trærne!'],
    KATT:['🐈','En katt titter frem i skogen.'],
    HUND:['🐕','Et vennlig bjeff høres langt borte.'],
    FISK:['🐟','Noe glitrer under vannet.'],
    BLOMST:['🌸','En blomst folder seg ut.'],
    SKATT:['✨','En skattekiste glitrer mellom røttene.'],
    TROLL:['🍄','Et lite trollspor dukker opp.'],
    DRAGE:['🐉','En drage flyr forbi skyene.'],
    MAGI:['✨','Støv av stjerner danser rundt.'],
    SLOTT:['🏰','Slottet lyser i det fjerne.'],
    VANN:['💧','Bekken glitrer litt ekstra.'],
    BRØD:['🍞','Det lukter nybakt brød fra hytta.'],
    EPLE:['🍎','Et rødt eple faller fra et tre.'],
    BANAN:['🍌','En gul overraskelse dukker opp.'],
    PIZZA:['🍕','En duft av pizza sprer seg.'],
    NORGE:['🇳🇴','Norge lyser opp på kartet.'],
    KART:['🗺️','Et nytt spor vises på kartet.'],
    JAPAN:['🌸','Et nytt eventyr venter i Japan.'],
    VERDEN:['🌍','Hele verden venter på å bli oppdaget.'],
    FJELL:['⛰️','Fjerne fjell blir synlige mellom trærne.']
  });
  const THEME_MOMENTS=Object.freeze({
    mixed:['✨','Bokstavene glitrer ved Eggenipa.'],
    animals:['🐾','Et lite dyrespor dukker opp mellom trærne.'],
    magic:['🌟','En magisk gnist svever over stien.'],
    food:['🍯','Det lukter noe godt fra skogshytta.'],
    world:['🧭','Et nytt spor dukker opp på verdenskartet.']
  });
  const clamp=n=>Number.isFinite(Number(n))?Math.max(0,Math.min(100000,Math.floor(Number(n)))):0;
  function normalizeProgress(raw){
    const source=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
    const rounds=clamp(source.rounds);
    const themeRounds={};
    for(const pack of PACKS)themeRounds[pack.id]=clamp(source.themeRounds?.[pack.id]);
    // All rounds from the original Ordjakt were mixed. Credit the child's
    // pre-existing play fairly without changing the lifetime round counter.
    if(!source.themeRounds&&rounds>0)themeRounds.mixed=rounds;
    return {rounds,theme:BY_ID.has(source.theme)?source.theme:'mixed',themeRounds};
  }
  function reaction(word,theme){
    const effect=EFFECTS[String(word).toUpperCase()]||THEME_MOMENTS[theme];
    return effect?{icon:effect[0],message:effect[1]}:null;
  }
  return Object.freeze({
    PACKS,DEFAULT:'mixed',get:id=>BY_ID.get(id)||BY_ID.get('mixed'),
    list:()=>PACKS.slice(),reaction,normalizeProgress
  });
});