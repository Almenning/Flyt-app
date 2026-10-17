/* Original Norwegian stories for Fortellingsdalen, chapter 2. No school-grade completion. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LARIA_FORTELLINGSDALEN_STORIES=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const story=(id,stage,title,passage,rows)=>Object.freeze({
    id,stage,title,passage,
    questions:Object.freeze(rows.map((r,i)=>Object.freeze({
      id:id+'-q'+(i+1),prompt:r[0],options:Object.freeze([...r[1]]),
      answer:r[1][r[2]],skill:r[3]
    })))
  });
  const BANK=Object.freeze({
    brevhytta:Object.freeze([
      story('brev-eira','brevhytta','Et brev fra Eira',
        'Hei, Noah! På lørdag skal jeg fly den røde dragen min på haugen. Bestefar blir med. Etterpå skal vi spise vafler hjemme hos meg. Hilsen Eira.',
        [
          ['Hvem har skrevet brevet?',['Eira','Noah','Bestefar'],0,'detail'],
          ['Hvilken dag skal de fly dragen?',['Mandag','Lørdag','Søndag'],1,'detail'],
          ['Hvilken farge har dragen?',['Grønn','Rød','Blå'],1,'detail'],
          ['Hvor skal de fly dragen?',['Ved sjøen','På skolen','På haugen'],2,'detail']
        ]),
      story('brev-reven','brevhytta','Post til reven',
        'Hei, Lea! Kom til skogbiblioteket i morgen. Ta med den blå sekken din. Vi møtes ved det store eiketreet klokken tolv. Reven har funnet en ny bok. Hilsen Amir.',
        [
          ['Hvem skrev beskjeden?',['Lea','Amir','Reven'],1,'detail'],
          ['Hva skal Lea ta med?',['Blå sekk','Rød hatt','Grønn ball'],0,'detail'],
          ['Hvor skal de møtes?',['Ved bekken','Ved eiketreet','Ved skolen'],1,'detail'],
          ['Når skal de møtes?',['Klokken ni','Klokken tre','Klokken tolv'],2,'detail']
        ]),
      story('brev-iben','brevhytta','Lappen på døren',
        'Pappa! Jeg gikk til parken med Miko. Den grønne vannskålen står på hyllen på kjøkkenet. Når vi kommer tilbake, må Miko få vann. Vi sees snart! Hilsen Iben.',
        [
          ['Hvem skrev lappen?',['Iben','Pappa','Miko'],0,'detail'],
          ['Hvor gikk Iben?',['Til butikken','Til parken','Til skolen'],1,'detail'],
          ['Hvilken farge har vannskålen?',['Blå','Gul','Grønn'],2,'detail'],
          ['Hvor står skålen?',['På hyllen','Under sengen','Ved døren'],0,'detail']
        ])
    ]),
    eventyrbrua:Object.freeze([
      story('bru-nokkel','eventyrbrua','Nøkkelen ved broen',
        'Sander fant en nøkkel ved broen. Han la den i lommen og gikk til bakeriet. Bakeren kjente igjen nøkkelen. Sander ga den tilbake, og bakeren smilte.',
        [
          ['Hva gjorde Sander først?',['Gikk til bakeriet','Fant en nøkkel','Ga bort nøkkelen'],1,'sequence'],
          ['Hva gjorde han etter at han fant nøkkelen?',['La den i lommen','Gikk hjem','Kastet den i elven'],0,'sequence'],
          ['Hvor gikk han etterpå?',['Til parken','Til skolen','Til bakeriet'],2,'sequence'],
          ['Hva skjedde til slutt?',['Han fant en mynt','Han ga nøkkelen tilbake','Han kjøpte en båt'],1,'sequence']
        ]),
      story('bru-bat','eventyrbrua','Den lille båten',
        'Ada malte en liten trebåt. Først lot hun malingen tørke. Så satte hun båten på vannet. Båten drev inn i sivet. Ada tok en pinne og dro båten tilbake.',
        [
          ['Hva gjorde Ada først?',['Malte en båt','Fant en pinne','Dro båten tilbake'],0,'sequence'],
          ['Hva måtte skje før båten kom på vannet?',['Hun gikk hjem','Malingen måtte tørke','Båten måtte synke'],1,'sequence'],
          ['Hvor drev båten?',['Inn i sivet','Under broen','Opp i et tre'],0,'sequence'],
          ['Hva gjorde Ada til slutt?',['Malte huset','Spiste frokost','Dro båten tilbake'],2,'sequence']
        ]),
      story('bru-vott','eventyrbrua','En vott i snøen',
        'Mila tok på seg varme støvler. Hun gikk over jordet og så små spor i snøen. Ved et gjerde fant hun en rød vott. Hun tok votten med hjem.',
        [
          ['Hva gjorde Mila først?',['Fant en vott','Tok på støvler','Gikk hjem'],1,'sequence'],
          ['Hva så hun på jordet?',['Spor i snøen','En sykkel','En katt'],0,'sequence'],
          ['Hvor fant hun votten?',['Ved butikken','Under bordet','Ved gjerdet'],2,'sequence'],
          ['Hva skjedde etter at hun fant votten?',['Hun tok den hjem','Hun kastet den','Hun sovnet'],0,'sequence']
        ])
    ]),
    sporstien:Object.freeze([
      story('spor-regn','sporstien','De våte støvlene',
        'Nora kom inn i gangen. På gulvet sto et par våte støvler. En åpen paraply lå ved døren. Fra kjøkkenet hørte hun noen nynne. Ute trommet regnet mot taket.',
        [
          ['Hva tyder de våte støvlene på?',['Noen har vært ute i regnet','Noen har badet inne','Det er sommer'],0,'inference'],
          ['Hvilket spor passer best med regnværet?',['En lukket bok','En åpen paraply','En tørr pute'],1,'inference'],
          ['Hvorfor kan Nora tro at noen er hjemme?',['Hun ser en buss','Hun finner en ball','Hun hører noen nynne'],2,'inference'],
          ['Hva er mest sannsynlig ute?',['Det regner','Det snør mye','Det er helt skyfritt'],0,'inference']
        ]),
      story('spor-katt','sporstien','Den tomme skålen',
        'Katten Tussi gikk rundt matskålen og mjauet. Skålen var tom. Jonas fylte den med mat. Tussi begynte straks å spise og sluttet å mjau.',
        [
          ['Hvorfor mjauet Tussi trolig?',['Hun ville ut','Hun var sulten','Hun ville sove'],1,'inference'],
          ['Hvilket spor viser hva Tussi trengte?',['Skålen var tom','Vinduet var åpent','Jonas hadde sko'],0,'inference'],
          ['Hvorfor ble det stille?',['Jonas gikk ut','Døren lukket seg','Tussi fikk mat'],2,'inference'],
          ['Hva kan vi slutte av at Tussi spiste straks?',['Hun var mett fra før','Hun hadde lyst på mat','Hun lette etter en leke'],1,'inference']
        ]),
      story('spor-hytte','sporstien','Lys i hytta',
        'Da Emil kom til hytta, steg det røyk fra pipa. Det var ferske spor ved trappa. Gjennom vinduet så han en lampe lyse. Han banket forsiktig på døren.',
        [
          ['Hva er mest sannsynlig?',['Noen er i hytta','Hytta er tom og kald','Hytta har flyttet seg'],0,'inference'],
          ['Hvilket spor kan bety at noen har gått inn?',['En gammel stein','Ferske spor ved trappa','Et tre langt unna'],1,'inference'],
          ['Hva viser den tente lampen?',['At det er midnatt','At ingen har vært der','At noen kan ha slått på lyset'],2,'inference'],
          ['Hvorfor banker Emil?',['Han håper noen åpner','Han vil male døren','Han vil telle vinduer'],0,'inference']
        ])
    ]),
    fortellermolla:Object.freeze([
      story('molle-bru','fortellermolla','Omveien til skolen',
        'Det regnet hardt hele natten. Om morgenen hadde en planke løsnet fra den gamle broen. Derfor gikk barna rundt skogen for å komme til skolen. Turen tok litt lengre tid.',
        [
          ['Hvorfor kunne barna ikke bruke broen?',['Broen var for lang','En planke hadde løsnet','Det sto en katt på den'],1,'cause'],
          ['Hva gjorde barna i stedet?',['Gikk en omvei','Ble på broen','Tok et fly'],0,'cause'],
          ['Hva betyr omvei her?',['Den korteste veien','En hemmelig lek','En annen og lengre vei'],2,'vocabulary'],
          ['Hva var følgen av omveien?',['Turen tok lengre tid','Det sluttet å regne','Skolen ble borte'],0,'cause']
        ]),
      story('molle-marked','fortellermolla','Brødet på markedet',
        'Liv gikk til markedet for å kjøpe brød. Da hun kom til boden, oppdaget hun at myntene lå hjemme. Hun måtte gå tilbake og hente dem. Etterpå kjøpte hun et varmt brød.',
        [
          ['Hvorfor måtte Liv gå hjem?',['Hun var trøtt','Hun hadde glemt myntene','Brødet var kaldt'],1,'cause'],
          ['Hva ønsket Liv å kjøpe?',['Brød','En bok','En blomst'],0,'detail'],
          ['Hvorfor måtte Liv hente myntene?',['For å kjøpe brød','For å finne sko','For å låne et kart'],0,'cause'],
          ['Hva betyr oppdaget her?',['Hun fant ut noe','Hun gjemte noe','Hun sang høyt'],0,'vocabulary']
        ]),
      story('molle-blomst','fortellermolla','Blomstene ved gjerdet',
        'Solen skinte varmt i flere dager. Ingen hadde vannet blomstene ved gjerdet, og bladene hang ned. Theo hentet en kanne vann. Neste morgen sto blomstene friskere.',
        [
          ['Hvorfor hang bladene ned?',['Blomstene fikk for lite vann','Det var for mye snø','Blomstene var malt'],0,'cause'],
          ['Hva gjorde Theo?',['Flyttet gjerdet','Vannet blomstene','Klippet håret'],1,'detail'],
          ['Hva skjedde etter vanningen?',['Blomstene forsvant','Solen ble blå','Blomstene så friskere ut'],2,'cause'],
          ['Hva betyr friskere om blomstene?',['At de har fått det bedre','At de er laget av papir','At de vokser baklengs'],0,'vocabulary']
        ])
    ]),
    stjernetoppen:Object.freeze([
      story('topp-lykt','stjernetoppen','Lykten på toppen',
        'Mina fant en gammel lykt på stien. Den hadde nesten ikke lys. Hun byttet batteriene før hun gikk opp bakken. På toppen fikk hun øye på en liten hytte. Lyset hjalp henne å finne veien hjem.',
        [
          ['Hva fant Mina på stien?',['Et kart','En lykt','En nøkkel'],1,'detail'],
          ['Hva gjorde hun før hun gikk opp bakken?',['Byttet batterier','Spiste middag','Lukket hytta'],0,'sequence'],
          ['Hvorfor byttet hun batteriene?',['For å bære mindre','For å lage lyd','For å få bedre lys'],2,'inference'],
          ['Hva fikk hun øye på fra toppen?',['En liten hytte','En buss','En stor båt'],0,'detail'],
          ['Hva hjalp Mina hjem?',['En paraply','Lyset fra lykten','En rød ball'],1,'cause']
        ]),
      story('topp-bekk','stjernetoppen','Skatten ved bekken',
        'Reven fant et kart i et hult tre. Kartet viste en stein ved bekken. Reven fulgte stien, men bekken var høy etter regnet. Han ventet til vannet sank. Under steinen lå en eske med et brev.',
        [
          ['Hvor fant reven kartet?',['I et hult tre','I en sekk','På skolen'],0,'detail'],
          ['Hvor viste kartet veien?',['Til en butikk','Til en stein ved bekken','Til en høy bro'],1,'detail'],
          ['Hvorfor ventet reven?',['Han var trøtt','Han hadde glemt kartet','Bekken var for høy'],2,'inference'],
          ['Hva skjedde før reven fant esken?',['Vannet sank','Brevet ble lest','Steinen forsvant'],0,'sequence'],
          ['Hva lå under steinen?',['En blå lue','En eske med et brev','En pose brød'],1,'detail']
        ]),
      story('topp-fugler','stjernetoppen','Fuglehuset i skogen',
        'Ella og Amir bygget et lite fuglehus. Først sagde de noen planker. Så festet de taket og hang huset i et tre. Neste dag lå det små kvister inne i huset. De smilte da de oppdaget dem.',
        [
          ['Hva bygget Ella og Amir?',['En bro','En båt','Et fuglehus'],2,'detail'],
          ['Hva gjorde de først?',['Sagde planker','Hang opp huset','Fant kvister'],0,'sequence'],
          ['Hvor hang de huset?',['Ved døren','I et tre','Under en seng'],1,'detail'],
          ['Hva kan kvistene bety?',['Noen har malt huset','Det skal regne','En fugl kan ha begynt å bygge rede'],2,'inference'],
          ['Hvorfor smilte de trolig?',['De så tegn til at fugler ville bruke huset','Huset var borte','Taket hadde falt av'],0,'inference']
        ])
    ])
  });
  const STAGE_IDS=Object.freeze(['brevhytta','eventyrbrua','sporstien','fortellermolla','stjernetoppen']);
  const allStories=()=>STAGE_IDS.flatMap(id=>BANK[id]);
  const storyFor=id=>allStories().find(s=>s.id===id)||null;
  function validate(){
    const ids=new Set();
    for(const stage of STAGE_IDS){
      if(BANK[stage].length<3)throw new Error('Too few story variants for '+stage);
      for(const s of BANK[stage]){
        if(ids.has(s.id))throw new Error('Duplicate story id '+s.id);
        ids.add(s.id);
        if(s.stage!==stage||s.passage.length<80||s.passage.length>550)throw new Error('Invalid passage '+s.id);
        if(s.questions.length!==(stage==='stjernetoppen'?5:4))throw new Error('Incorrect question count '+s.id);
        for(const q of s.questions){
          if(q.options.length!==3||new Set(q.options).size!==3||q.options.filter(x=>x===q.answer).length!==1)
            throw new Error('Ambiguous or missing answer '+q.id);
          if(!['detail','sequence','inference','cause','vocabulary'].includes(q.skill))
            throw new Error('Invalid skill '+q.id);
        }
      }
    }
    return true;
  }
  validate();
  return Object.freeze({BANK,STAGE_IDS,allStories,storyFor,validate});
});
