// Norsk oppgavebank for Lær litt mer.
// Innholdet er statisk og kvalitetssikret. Selve øktmotoren i index.html velger adaptivt
// og bruker cooldown slik at barnet ikke får den samme oppgaven igjen med en gang.
(function(){
  'use strict';

  function buildNorwegianPool(grade,module){
    const q=[];
    const addChoice=(skill,prompt,answer,options,extra={})=>q.push(choiceQuestion('norwegian',skill,prompt,answer,options,extra));
    const addSentence=(answer,words)=>q.push({subject:'norwegian',skill:'sentence-order',type:'sentence-order',prompt:'Bygg setningen',answer,words:shuffle(words),curriculum:CURRICULUM.norwegian});
    const addReading=(passage,items)=>items.forEach(item=>addChoice(item[0],item[1],item[2],item[3],{passage}));
    const addMissing=(pattern,answer,options)=>addChoice('missing-letter','Hvilken bokstav mangler? '+pattern,answer,options);
    const addSpelling=(word,wrong)=>addChoice('spelling','Hvilket ord er skrevet riktig?',word,[word,...wrong]);

    if(grade<=2){
      [
        ['KATT','🐱'],['SOL','☀️'],['MUS','🐭'],['BIL','🚗'],['HUND','🐶'],['BOK','📘'],['HUS','🏠'],['FISK','🐟'],
        ['OST','🧀'],['IS','🍦'],['BÅT','⛵'],['TRE','🌳'],['LUE','🧢'],['SKO','👟'],['BALL','⚽'],['REV','🦊'],
        ['TOG','🚆'],['KU','🐄'],['LAM','🐑'],['KOPP','☕'],['SENG','🛏️'],['EPLER','🍎'],['MÅNE','🌙'],['BLOMST','🌼']
      ].forEach(([word,emoji])=>q.push(makeBuildWord(word,emoji,'letter-sound')));

      [
        ['F _ S K','I',['I','A','O']],['S _ L','O',['O','A','I']],['M _ S','U',['U','A','E']],['B _ K','O',['O','A','U']],
        ['H _ S','U',['U','A','O']],['S K _','O',['O','E','I']],['L _ E','U',['U','I','A']],['B _ T','Å',['Å','A','Ø']],
        ['T R _','E',['E','A','O']],['O _ T','S',['S','T','L']],['I _','S',['S','L','R']],['R _ V','E',['E','A','I']],
        ['M _ T','A',['A','E','O']],['K _ P P','O',['O','A','U']],['D _ R','Ø',['Ø','Å','O']],['S _ K K','E',['E','A','I']],
        ['V _ N N','E',['E','A','I']],['B _ L L','A',['A','O','E']],['H _ N D','U',['U','A','O']],['K _ T T','A',['A','E','I']],
        ['T _ G','O',['O','A','E']],['K _','U',['U','O','A']],['L _ M','A',['A','E','I']],['M _ N E','Å',['Å','Ø','O']]
      ].forEach(x=>addMissing(...x));

      [
        ['🐶','hund',['hund','hus','sol']],['🚗','bil',['bil','bok','båt']],['🐱','katt',['katt','ku','kopp']],['📘','bok',['bok','bil','ball']],
        ['🏠','hus',['hus','hund','hatt']],['🐟','fisk',['fisk','fugl','fot']],['⚽','ball',['ball','båt','bok']],['🌳','tre',['tre','tog','tak']],
        ['🧀','ost',['ost','orm','ovn']],['🦊','rev',['rev','ris','rot']],['👟','sko',['sko','ski','sky']],['⛵','båt',['båt','bil','bok']],
        ['🚆','tog',['tog','tak','tre']],['🐄','ku',['ku','ko','kopp']],['🌙','måne',['måne','mat','mus']],['🌼','blomst',['blomst','båt','bok']]
      ].forEach(([visual,answer,options])=>addChoice('word-picture','Hvilket ord passer til bildet?',answer,options,{visual}));

      [
        ['Katten spiser fisk.',['Katten','spiser','fisk.']],['Mia har en ball.',['Mia','har','en','ball.']],['Ola leser en bok.',['Ola','leser','en','bok.']],
        ['Hunden løper fort.',['Hunden','løper','fort.']],['Vi går til skolen.',['Vi','går','til','skolen.']],['Sola skinner i dag.',['Sola','skinner','i','dag.']],
        ['Leo sykler hjem.',['Leo','sykler','hjem.']],['Jeg liker is.',['Jeg','liker','is.']],['Fuglen sitter i treet.',['Fuglen','sitter','i','treet.']],
        ['Sara har en rød lue.',['Sara','har','en','rød','lue.']],['Pappa lager middag.',['Pappa','lager','middag.']],['Vi leker ute.',['Vi','leker','ute.']],
        ['Bussen kommer snart.',['Bussen','kommer','snart.']],['Mamma kjøper melk.',['Mamma','kjøper','melk.']],['Regnet faller på taket.',['Regnet','faller','på','taket.']],
        ['Ane tegner en sol.',['Ane','tegner','en','sol.']],['Bjørnen sover i hiet.',['Bjørnen','sover','i','hiet.']],['Barna bygger et tårn.',['Barna','bygger','et','tårn.']],
        ['Toget kjører gjennom tunnelen.',['Toget','kjører','gjennom','tunnelen.']],['Kua står på jordet.',['Kua','står','på','jordet.']]
      ].forEach(x=>addSentence(...x));

      [
        ['katt','hatt',['hatt','hus','sol']],['mus','hus',['hus','hatt','bil']],['sol','stol',['stol','skog','sko']],['bil','pil',['pil','bok','ball']],
        ['båt','våt',['våt','vei','vind']],['tre','kne',['kne','tak','tog']],['sko','ro',['ro','ris','rev']],['bok','krok',['krok','katt','ku']],
        ['is','gris',['gris','ost','ål']],['rev','brev',['brev','båt','bil']],['ball','fall',['fall','fugl','fisk']],['lue','due',['due','dør','dag']],
        ['lam','kam',['kam','ku','lys']],['tog','skog',['skog','tak','mat']],['måne','låne',['låne','mat','lyd']],['hund','rund',['rund','hus','rev']]
      ].forEach(([word,answer,options])=>addChoice('rhyme','Hvilket ord rimer på '+word+'?',answer,options));

      [
        ['MUS','HUS','Bytt M med H i MUS. Hvilket ord får du?',['HUS','MUS','HUND']],
        ['BIL','PIL','Bytt B med P i BIL. Hvilket ord får du?',['PIL','BIL','BALL']],
        ['KATT','HATT','Bytt K med H i KATT. Hvilket ord får du?',['HATT','KATT','HUS']],
        ['SOL','SOV','Bytt L med V i SOL. Hvilket ord får du?',['SOV','SOL','SOKK']],
        ['REV','REN','Bytt V med N i REV. Hvilket ord får du?',['REN','REV','RIS']],
        ['BOK','BOL','Bytt K med L i BOK. Hvilket ord får du?',['BOL','BOK','BIL']],
        ['S','SKO','Legg S foran KO. Hvilket ord får du?',['SKO','KO','KU']],
        ['B','BÅT','Legg B foran ÅT. Hvilket ord får du?',['BÅT','BIL','BOK']],
        ['M','MUS','Legg M foran US. Hvilket ord får du?',['MUS','HUS','IS']],
        ['H','HUS','Legg H foran US. Hvilket ord får du?',['HUS','MUS','IS']],
        ['T','TRE','Legg T foran RE. Hvilket ord får du?',['TRE','REV','TOG']],
        ['K','KU','Legg K foran U. Hvilket ord får du?',['KU','KO','KATT']]
      ].forEach(([,answer,prompt,options],i)=>addChoice(i<6?'change-letter':'add-letter',prompt,answer,options));

      [
        ['SKO','S','KO',['KO','KU','TO']],['BÅT','B','ÅT',['ÅT','BÅ','AT']],['MUS','M','US',['US','MU','IS']],
        ['HUS','H','US',['US','HU','IS']],['TRE','T','RE',['RE','TE','TRE']],['KU','K','U',['U','KU','K']]
      ].forEach(([word,letter,answer,options])=>addChoice('remove-letter','Ta bort '+letter+' fra '+word+'. Hva står igjen?',answer,options));

      [
        ['glad','blid',['blid','sur','våt']],['stor','svær',['svær','liten','rask']],['rask','fort',['fort','sakte','tung']],['snill','grei',['grei','sint','mørk']],
        ['redd','engstelig',['engstelig','mett','glad']],['liten','små',['små','store','lange']],['se','kikke',['kikke','rope','hoppe']],['gå','spasere',['spasere','sove','tegne']],
        ['rolig','stille',['stille','bråkete','rask']],['fin','pen',['pen','vond','sur']],['sint','sur',['sur','glad','snill']],['morsom','artig',['artig','trist','kald']]
      ].forEach(([word,answer,options])=>addChoice('synonyms','Hvilket ord betyr omtrent det samme som «'+word+'»?',answer,options));

      [
        ['Mia har en rød sykkel. Hun sykler til parken.',[
          ['reading-comprehension','Hvilken farge har sykkelen?','Rød',['Rød','Blå','Grønn']],
          ['reading-detail','Hvor sykler Mia?','Til parken',['Til parken','Til skolen','Til butikken']]
        ]],
        ['Leo tar på sekken og går inn på skolen.',[
          ['reading-comprehension','Hvor er Leo?','På skolen',['På skolen','I butikken','På stranden']],
          ['reading-detail','Hva har Leo med seg?','Sekken',['Sekken','Skiene','Sykkelen']]
        ]],
        ['Emma spiser frokost. Hun har melk i glasset og brød på tallerkenen.',[
          ['reading-detail','Hva drikker Emma?','Melk',['Melk','Saft','Vann']],
          ['reading-comprehension','Hva spiser Emma?','Brød',['Brød','Is','Fisk']]
        ]],
        ['Noah finner en liten frosk ved dammen. Frosken hopper ut i vannet.',[
          ['reading-detail','Hva finner Noah?','En frosk',['En frosk','En katt','En fugl']],
          ['reading-detail','Hvor hopper frosken?','Ut i vannet',['Ut i vannet','Opp i treet','Inn i huset']]
        ]],
        ['Det regner ute. Nora tar på støvler og en gul regnjakke.',[
          ['reading-comprehension','Hvorfor tar Nora på regnjakke?','Det regner',['Det regner','Det snør','Det er varmt']],
          ['reading-detail','Hvilken farge har regnjakken?','Gul',['Gul','Rød','Blå']]
        ]],
        ['Ali bygger et høyt tårn av klosser. Den blå klossen ligger øverst.',[
          ['reading-detail','Hva bygger Ali?','Et tårn',['Et tårn','En bil','En bro']],
          ['reading-detail','Hvilken kloss ligger øverst?','Den blå',['Den blå','Den røde','Den grønne']]
        ]],
        ['Sofie og pappa baker boller. De setter bollene i ovnen.',[
          ['reading-comprehension','Hva baker Sofie og pappa?','Boller',['Boller','Brød','Kake']],
          ['reading-detail','Hvor setter de bollene?','I ovnen',['I ovnen','I fryseren','På gulvet']]
        ]],
        ['Elias går tur med hunden Max. Max stopper ved et stort tre.',[
          ['reading-detail','Hva heter hunden?','Max',['Max','Leo','Pelle']],
          ['reading-detail','Hvor stopper Max?','Ved et stort tre',['Ved et stort tre','Ved bilen','Ved skolen']]
        ]],
        ['Lina har bursdag. På bordet står en kake med sju lys.',[
          ['reading-comprehension','Hva feirer Lina?','Bursdag',['Bursdag','Jul','Skolestart']],
          ['reading-detail','Hvor mange lys er det på kaken?','Sju',['Sju','Fem','Ni']]
        ]],
        ['Oskar tar med ballen ut. Han og vennene spiller fotball på banen.',[
          ['reading-detail','Hva tar Oskar med seg?','Ballen',['Ballen','Boken','Sykkelen']],
          ['reading-comprehension','Hva gjør vennene?','Spiller fotball',['Spiller fotball','Leser','Baker']]
        ]],
        ['Ava ser mørke skyer. Hun tar med en paraply før hun går ut.',[
          ['reading-inference','Hva tror Ava kan skje?','Det kan begynne å regne',['Det kan begynne å regne','Det blir veldig varmt','Det kommer snø inne']],
          ['reading-detail','Hva tar Ava med?','En paraply',['En paraply','En ball','En bok']]
        ]],
        ['Theo gjesper og legger hodet på puten. Lyset på rommet blir slått av.',[
          ['reading-inference','Hva skal Theo trolig gjøre?','Sove',['Sove','Spise frokost','Gå på skolen']],
          ['reading-detail','Hva legger Theo hodet på?','Puten',['Puten','Bordet','Sekken']]
        ]],
        ['Maja finner vottene sine i gangen. Ute ligger det snø på bakken.',[
          ['reading-inference','Hvorfor trenger Maja votter?','Det er kaldt ute',['Det er kaldt ute','Hun skal svømme','Det er sommer']],
          ['reading-detail','Hva ligger på bakken?','Snø',['Snø','Sand','Løv']]
        ]],
        ['Iver heller vann i en skål til katten. Katten kommer løpende fra stua.',[
          ['reading-comprehension','Hvem får vann?','Katten',['Katten','Hunden','Iver']],
          ['reading-detail','Hvor kommer katten fra?','Stua',['Stua','Skolen','Hagen']]
        ]]
      ].forEach(x=>addReading(...x));

    }else if(grade<=4){
      [
        ['kanskje',['kansje','kanskjee']],['sykkel',['sykel','sykkell']],['kjøkken',['kjøken','skjøkken']],['venninne',['venine','veninne']],
        ['alltid',['alti','alltidd']],['plutselig',['plutseli','pluttselig']],['dessverre',['desverre','dessvere']],['interessant',['interesant','interessangt']],
        ['nysgjerrig',['nyskjerrig','nysgjærig']],['skjedde',['skjede','sjeddde']],['hjemme',['hjeme','hjemmme']],['hemmelig',['hemelig','hemmelligt']],
        ['vanskelig',['vansklig','vanskeligg']],['forsiktig',['forsikti','fårsiktig']],['menneske',['meneske','menneskje']],['egentlig',['egentli','egentelig']],
        ['mulighet',['muligheit','muliggett']],['fortelle',['fortele','fårtelle']],['begynne',['begyne','begynnee']],['spennende',['spenende','spennnende']],
        ['dessuten',['desuten','dessutten']],['skikkelig',['skiklig','skikkeli']],['heldigvis',['heldivis','helligvis']],['nødvendig',['nødvendi','nødvennig']]
      ].forEach(x=>addSpelling(...x));

      [
        ['fotball',['fotball','løper','rask']],['skolegård',['skolegård','skole','går']],['matpakke',['matpakke','spiser','sulten']],['tannbørste',['tannbørste','børster','tann']],
        ['regnjakke',['regnjakke','våt','jakke']],['bokhylle',['bokhylle','leser','hylle']],['sommerferie',['sommerferie','ferie','varm']],['snømann',['snømann','snø','mann']],
        ['fotballbane',['fotballbane','spille','grønn']],['bursdagskake',['bursdagskake','kake','feire']],['skolebuss',['skolebuss','skole','kjører']],['vannflaske',['vannflaske','drikker','flaske']],
        ['tannlege',['tannlege','tann','lege']],['håndkle',['håndkle','hånd','tørke']],['solbriller',['solbriller','sol','briller']],['leksebok',['leksebok','lese','bok']]
      ].forEach(([answer,options])=>addChoice('compound-words','Hvilket ord er et sammensatt ord?',answer,options));

      [
        ['sommer',['sommer','sol','reise']],['ball',['ball','bil','bok']],['katt',['katt','kat','kart']],['venn',['venn','ven','vei']],['hopp',['hopp','hop','hus']],
        ['nummer',['nummer','numer','navn']],['sitte',['sitte','site','se']],['grønn',['grønn','grøn','gul']],['mellom',['mellom','melom','med']],['klasse',['klasse','klase','skole']],
        ['kopp',['kopp','kop','krok']],['telle',['telle','tele','tale']],['himmel',['himmel','himel','hav']],['buss',['buss','bus','bil']],['rygg',['rygg','ryg','arm']],['tømme',['tømme','tøme','ta']]
      ].forEach(([answer,options])=>addChoice('double-consonant','Hvilket ord har dobbel konsonant?',answer,options));

      [
        ['glad','fornøyd',['fornøyd','sint','trøtt']],['rask','hurtig',['hurtig','langsom','tung']],['modig','tappert',['tappert','redd','søvnig']],
        ['viktig','betydningsfull',['betydningsfull','uvanlig','liten']],['rolig','stille',['stille','bråkete','travel']],['vakker','fin',['fin','stygg','sint']],
        ['svær','stor',['stor','smal','kort']],['starte','begynne',['begynne','stanse','glemme']],['snakke','prate',['prate','sove','tegne']],
        ['lete','søke',['søke','finne','miste']],['klok','smart',['smart','sliten','sulten']],['vanskelig','krevende',['krevende','enkelt','morsomt']],
        ['sint','irritert',['irritert','glad','rolig']],['gammel','eldre',['eldre','ny','liten']],['slutt','ende',['ende','start','midt']],['hjelpe','bistå',['bistå','hindre','glemme']]
      ].forEach(([word,answer,options])=>addChoice('synonyms','Hvilket ord betyr omtrent det samme som «'+word+'»?',answer,options));

      [
        ['hopper','verb',['hopper','grønn','skole','rolig']],['skole','substantiv',['skole','løper','vakker','fort']],['rød','adjektiv',['rød','spiser','hund','under']],
        ['synger','verb',['synger','sang','glad','høy']],['vennskap','substantiv',['vennskap','snill','hopper','ofte']],['kald','adjektiv',['kald','fryser','vinter','ute']],
        ['skriver','verb',['skriver','blyant','lang','stille']],['fjell','substantiv',['fjell','klatrer','bratt','opp']],['morsom','adjektiv',['morsom','ler','vits','alltid']],
        ['tenker','verb',['tenker','tanke','klok','inne']],['reise','substantiv',['reise','drar','lang','snart']],['sterk','adjektiv',['sterk','løfter','muskel','ofte']],
        ['svømmer','verb',['svømmer','basseng','våt','under']],['glede','substantiv',['glede','glad','smiler','veldig']],['bratt','adjektiv',['bratt','klatrer','fjell','opp']],['arbeider','verb',['arbeider','jobb','flittig','ofte']]
      ].forEach(([answer,klass,options])=>addChoice('word-class','Hvilket ord er et '+klass+'?',answer,options));

      [
        ['Hvor bor du?',['Hvor bor du?','Hvor bor du.','Hvor bor du!']],['Jeg liker å lese.',['Jeg liker å lese.','Jeg liker å lese?','Jeg liker å lese!']],
        ['Pass deg!',['Pass deg!','Pass deg.','Pass deg?']],['Når begynner filmen?',['Når begynner filmen?','Når begynner filmen.','Når begynner filmen!']],
        ['I dag skal vi bade.',['I dag skal vi bade.','I dag skal vi bade?','I dag skal vi bade!']],['Kom hit!',['Kom hit!','Kom hit.','Kom hit?']],
        ['Har du sett katten?',['Har du sett katten?','Har du sett katten.','Har du sett katten!']],['Bussen kommer klokken tre.',['Bussen kommer klokken tre.','Bussen kommer klokken tre?','Bussen kommer klokken tre!']],
        ['Så flott!',['Så flott!','Så flott.','Så flott?']],['Hvor la du boka?',['Hvor la du boka?','Hvor la du boka.','Hvor la du boka!']],
        ['Vi spiser middag nå.',['Vi spiser middag nå.','Vi spiser middag nå?','Vi spiser middag nå!']],['Stopp!',['Stopp!','Stopp.','Stopp?']]
      ].forEach(([answer,options])=>addChoice('punctuation','Hvilken setning har riktig tegnsetting?',answer,options));

      [
        ['Vi leser en spennende bok.',['Vi','leser','en','spennende','bok.']],['Hunden sover under bordet.',['Hunden','sover','under','bordet.']],
        ['I morgen skal vi på tur.',['I','morgen','skal','vi','på','tur.']],['Sara fant en gammel mynt.',['Sara','fant','en','gammel','mynt.']],
        ['Bussen stopper ved skolen.',['Bussen','stopper','ved','skolen.']],['Et ekorn klatrer i treet.',['Et','ekorn','klatrer','i','treet.']],
        ['Vi spiste middag sammen.',['Vi','spiste','middag','sammen.']],['Læreren skrev på tavla.',['Læreren','skrev','på','tavla.']],
        ['Regnet trommet mot vinduet.',['Regnet','trommet','mot','vinduet.']],['Mina pakket sekken sin.',['Mina','pakket','sekken','sin.']],
        ['Etter skolen møtte jeg Noah.',['Etter','skolen','møtte','jeg','Noah.']],['Den lille båten seilte fort.',['Den','lille','båten','seilte','fort.']],
        ['Bestemor baker gode vafler.',['Bestemor','baker','gode','vafler.']],['Vi fant blåbær i skogen.',['Vi','fant','blåbær','i','skogen.']],
        ['Katten hoppet opp på stolen.',['Katten','hoppet','opp','på','stolen.']],['Lina tok bussen til byen.',['Lina','tok','bussen','til','byen.']]
      ].forEach(x=>addSentence(...x));

      [
        ['Det begynte å regne før Lea gikk til skolen. Hun tok på regnjakken før hun gikk ut.',[
          ['reading-comprehension','Hvorfor tok Lea på regnjakke?','Det regnet',['Det regnet','Det var varmt','Hun skulle bade']],
          ['reading-detail','Når begynte det å regne?','Før Lea gikk til skolen',['Før Lea gikk til skolen','Etter middag','Om natten']]
        ]],
        ['Amir gikk til butikken fordi familien manglet brød til frokosten.',[
          ['reading-comprehension','Hva skulle Amir kjøpe?','Brød',['Brød','Sko','En bok']],
          ['reading-inference','Hvorfor trengte familien brød?','Til frokosten',['Til frokosten','Til en fotballkamp','Til katten']]
        ]],
        ['Nora trekker jakken tett rundt seg og blåser varm luft i hendene.',[
          ['reading-inference','Hva er mest sannsynlig?','Nora er kald',['Nora er kald','Nora er mett','Nora skal svømme']],
          ['reading-detail','Hva gjør Nora med hendene?','Blåser varm luft på dem',['Blåser varm luft på dem','Vasker dem','Tegner på dem']]
        ]],
        ['Søndag gikk familien mellom høye trær. De fant kongler, så et ekorn og spiste matpakken ved et lite vann.',[
          ['reading-main-idea','Hva handler teksten mest om?','En tur i skogen',['En tur i skogen','En fotballkamp','En skoledag']],
          ['reading-detail','Hvilket dyr så familien?','Et ekorn',['Et ekorn','En rev','En hest']]
        ]],
        ['Ella våknet tidlig lørdag. Hun pakket badetøy, håndkle og solkrem før familien kjørte til stranden.',[
          ['reading-inference','Hvor skulle Ella trolig?','Til stranden',['Til stranden','Til skolen','Til biblioteket']],
          ['reading-detail','Hva pakket Ella?','Badetøy, håndkle og solkrem',['Mattebok og blyant','Støvler og skjerf','Ski og hjelm']]
        ]],
        ['På vei hjem fant Jonas en lommebok på fortauet. Han leverte den til en voksen i butikken ved siden av.',[
          ['reading-main-idea','Hva gjorde Jonas med lommeboken?','Han leverte den til en voksen',['Han beholdt den','Han kastet den','Han gjemte den']],
          ['reading-inference','Hva viser handlingen til Jonas?','Han prøvde å hjelpe',['Han ville lure noen','Han var sint','Han hadde dårlig tid']]
        ]],
        ['Klassen plantet frø i små potter. Etter noen dager kom grønne spirer opp av jorda.',[
          ['reading-detail','Hva plantet klassen?','Frø',['Steiner','Bøker','Leker']],
          ['reading-inference','Hva skjedde etter noen dager?','Frøene begynte å vokse',['Pottene forsvant','Jorda ble til sand','Klassen sluttet på skolen']]
        ]],
        ['Mikkel hadde øvd på pianostykket hver dag. På konserten klarte han hele stykket uten å stoppe.',[
          ['reading-inference','Hva kan ha hjulpet Mikkel på konserten?','At han hadde øvd mye',['At han sov under konserten','At han glemte pianoet','At salen var tom']],
          ['reading-detail','Hva spilte Mikkel på?','Piano',['Trommer','Fiolin','Gitar']]
        ]],
        ['Bibliotekaren viste barna hvor faktabøkene sto. Ada fant en bok om verdensrommet og lånte den med hjem.',[
          ['reading-detail','Hva handlet boka Ada lånte om?','Verdensrommet',['Hester','Fotball','Matlaging']],
          ['reading-comprehension','Hvor fant Ada boka?','På biblioteket',['På stranden','I skolegården','På bussen']]
        ]],
        ['Toget skulle gå klokken ti, men kom først tjue minutter senere. Familien ventet på perrongen.',[
          ['reading-inference','Hva skjedde med toget?','Det var forsinket',['Det var for tidlig','Det ble til en buss','Det kjørte uten familie']],
          ['reading-detail','Hvor ventet familien?','På perrongen',['I svømmehallen','På kjøkkenet','I skogen']]
        ]],
        ['Lina leste oppskriften før hun begynte. Hun målte mel og melk nøye før hun rørte sammen røren.',[
          ['reading-main-idea','Hva gjør Lina?','Hun baker',['Hun maler','Hun trener','Hun sykler']],
          ['reading-detail','Hva målte Lina?','Mel og melk',['Sand og vann','Ris og fisk','Papir og lim']]
        ]],
        ['På fotballtreningen mistet laget ballen over gjerdet. Treneren hentet en reserveball slik at de kunne fortsette.',[
          ['reading-inference','Hvorfor hentet treneren en reserveball?','For at treningen kunne fortsette',['For å avslutte treningen','For å pynte banen','For å gi den til dommeren']],
          ['reading-detail','Hvor havnet den første ballen?','Over gjerdet',['I garderoben','I sekken','Under bilen']]
        ]],
        ['Før presentasjonen skrev Iben tre stikkord på et lite kort. Da hun sto foran klassen, kikket hun på kortet når hun glemte hva hun skulle si.',[
          ['reading-inference','Hvorfor skrev Iben stikkord?','For å huske hva hun skulle si',['For å telle elevene','For å tegne et kart','For å skrive lekser']],
          ['reading-detail','Hvor holdt Iben presentasjonen?','Foran klassen',['På butikken','På fotballbanen','I svømmehallen']]
        ]],
        ['Vinden blåste kraftig hele natten. Om morgenen lå flere små greiner på bakken i hagen.',[
          ['reading-inference','Hva har trolig fått greinene til å falle?','Den sterke vinden',['Sola','En bok','En sykkel']],
          ['reading-detail','Når lå greinene på bakken?','Om morgenen',['Før vinden startet','Midt på skoledagen','Neste uke']]
        ]],
        ['Maja leste første kapittel før hun la boka i sekken. På skolen skulle klassen snakke om det de hadde lest.',[
          ['reading-inference','Hvorfor la Maja boka i sekken?','Hun skulle bruke den på skolen',['Hun skulle kaste den','Hun skulle gi den til katten','Hun skulle bade med den']],
          ['reading-detail','Hva hadde Maja lest?','Første kapittel',['Hele boka','Bare tittelen','Siste kapittel']]
        ]]
      ].forEach(x=>addReading(...x));

    }else if(grade<=7){
      [
        ['Hvilket ord er et verb?','løper',['løper','rød','skole','rolig']],['Hvilket ord er et substantiv?','vennskap',['vennskap','vennlig','snakker','ofte']],
        ['Hvilket ord er et adjektiv?','modig',['modig','løper','vennskap','under']],['Hvilket ord er et pronomen?','hun',['hun','skole','løper','grønn']],
        ['Hvilket ord er et adverb?','raskt',['raskt','rask','løper','fart']],['Hvilket ord er en preposisjon?','under',['under','hopper','bord','rød']],
        ['Hvilket ord er et verb?','forklarer',['forklarer','forklaring','tydelig','ofte']],['Hvilket ord er et substantiv?','beslutning',['beslutning','bestemme','viktig','snart']],
        ['Hvilket ord er et adjektiv?','nysgjerrig',['nysgjerrig','spørsmål','undersøker','der']],['Hvilket ord er et adverb?','tydelig',['tydelig','tydeliggjør','tekst','klar']],
        ['Hvilket ord er et pronomen?','de',['de','der','dag','drar']],['Hvilket ord er en preposisjon?','mellom',['mellom','møter','mange','mest']]
      ].forEach(([prompt,answer,options])=>addChoice('grammar',prompt,answer,options));

      [
        ['viktig','betydningsfull',['betydningsfull','tilfeldig','usynlig','sjelden']],['pålitelig','troverdig',['troverdig','tilfeldig','vakker','kort']],
        ['rask','hurtig',['hurtig','langsiktig','tung','svak']],['forklare','utdype',['utdype','skjule','stanse','glemme']],
        ['uenig','kritisk',['kritisk','identisk','taus','fjern']],['resultat','utfall',['utfall','start','spørsmål','regel']],
        ['vanlig','typisk',['typisk','umulig','sjeldent','skjult']],['forandre','endre',['endre','beholde','måle','lese']],
        ['nøyaktig','presis',['presis','tilfeldig','uklar','rask']],['vurdere','bedømme',['bedømme','glemme','kopiere','løpe']],
        ['hensikt','formål',['formål','problem','person','sted']],['påstand','utsagn',['utsagn','bevis','spørsmål','overskrift']],
        ['påvirke','forme',['forme','stanse','måle','tegne']],['relevant','vesentlig',['vesentlig','tilfeldig','gammel','morsom']]
      ].forEach(([word,answer,options])=>addChoice('synonyms','Hva betyr omtrent det samme som «'+word+'»?',answer,options));

      [
        ['ikkje','ikke',['ikke','også','igjen','ingen']],['eg','jeg',['jeg','du','vi','de']],['kva','hva',['hva','hvem','hvor','når']],['kvifor','hvorfor',['hvorfor','hvordan','hvilken','hvor']],
        ['heim','hjem',['hjem','hus','rom','skole']],['berre','bare',['bare','begge','bedre','borte']],['mykje','mye',['mye','lite','mer','nok']],['noko','noe',['noe','ingen','alle','hver']],
        ['veke','uke',['uke','dag','måned','år']],['frå','fra',['fra','til','over','under']],['saman','sammen',['sammen','alene','senere','ofte']],['korleis','hvordan',['hvordan','hvor','hvem','hvilken']],
        ['kven','hvem',['hvem','hva','hvor','hvilken']],['skule','skole',['skole','skål','skog','stol']]
      ].forEach(([word,answer,options])=>addChoice('nynorsk','Hva er bokmålsordet «'+word+'»?',answer,options));

      [
        ['Hvor skal du?',['Hvor skal du?','Hvor skal du.','Hvor skal du!']],['Jeg tror hun kommer i morgen.',['Jeg tror hun kommer i morgen.','Jeg tror hun kommer i morgen?','Jeg tror hun kommer i morgen!']],
        ['Pass på!',['Pass på!','Pass på.','Pass på?']],['Vet du når bussen går?',['Vet du når bussen går?','Vet du når bussen går.','Vet du når bussen går!']],
        ['Etter kampen dro vi hjem.',['Etter kampen dro vi hjem.','Etter kampen dro vi hjem?','Etter kampen dro vi hjem!']],['For en fantastisk utsikt!',['For en fantastisk utsikt!','For en fantastisk utsikt.','For en fantastisk utsikt?']],
        ['Hun spurte: «Kommer du?»',['Hun spurte: «Kommer du?»','Hun spurte «Kommer du».','Hun spurte, «Kommer du»?']],['I sekken lå det tre ting: mat, vann og kart.',['I sekken lå det tre ting: mat, vann og kart.','I sekken lå det tre ting? mat, vann og kart.','I sekken lå det tre ting! mat, vann og kart.']],
        ['Først leste vi teksten, deretter svarte vi.',['Først leste vi teksten, deretter svarte vi.','Først leste vi teksten? deretter svarte vi.','Først leste vi teksten! deretter svarte vi.']],['Han ropte: «Vent!»',['Han ropte: «Vent!»','Han ropte «Vent».','Han ropte? «Vent.»']],
        ['Da klokka ringte, gikk vi inn.',['Da klokka ringte, gikk vi inn.','Da klokka ringte? gikk vi inn.','Da klokka ringte! gikk vi inn.']],['«Hvor er boka?» spurte Mina.',['«Hvor er boka?» spurte Mina.','«Hvor er boka.» spurte Mina?','«Hvor er boka!» spurte Mina.']]
      ].forEach(([answer,options])=>addChoice('punctuation','Hvilken setning har riktig tegnsetting?',answer,options));

      [
        ['Vi undersøkte kilden før vi delte saken.',['Vi','undersøkte','kilden','før','vi','delte','saken.']],
        ['Sara forklarte hvorfor hun var uenig.',['Sara','forklarte','hvorfor','hun','var','uenig.']],
        ['Et tydelig argument trenger en begrunnelse.',['Et','tydelig','argument','trenger','en','begrunnelse.']],
        ['Klassen sammenlignet to ulike tekster.',['Klassen','sammenlignet','to','ulike','tekster.']],
        ['Forfatteren bruker kontraster for å skape spenning.',['Forfatteren','bruker','kontraster','for','å','skape','spenning.']],
        ['Vi fant opplysningen i en pålitelig kilde.',['Vi','fant','opplysningen','i','en','pålitelig','kilde.']],
        ['Etter diskusjonen endret Jonas mening.',['Etter','diskusjonen','endret','Jonas','mening.']],
        ['Overskriften gjorde meg nysgjerrig på teksten.',['Overskriften','gjorde','meg','nysgjerrig','på','teksten.']],
        ['Hun brukte et eksempel for å forklare poenget.',['Hun','brukte','et','eksempel','for','å','forklare','poenget.']],
        ['Vi leste både for og imot forslaget.',['Vi','leste','både','for','og','imot','forslaget.']],
        ['Kilden oppgir hvem som har skrevet artikkelen.',['Kilden','oppgir','hvem','som','har','skrevet','artikkelen.']],
        ['Elevene begrunnet svarene med eksempler.',['Elevene','begrunnet','svarene','med','eksempler.']]
      ].forEach(x=>addSentence(...x));

      [
        ['Sara kom fem minutter for sent. Hun fortalte læreren at bussen hadde stått lenge i kø.',[
          ['reading-inference','Hva kan vi slutte av teksten?','Bussen var forsinket',['Bussen var forsinket','Sara sov hele dagen','Skolen var stengt']],
          ['reading-detail','Hvorfor kom Sara for sent?','Bussen sto i kø',['Bussen sto i kø','Hun mistet boka','Hun gikk feil']]
        ]],
        ['Plast som havner i naturen kan bli liggende lenge. Dyr kan spise den eller sette seg fast i den.',[
          ['reading-main-idea','Hva er hovedpoenget?','Plast i naturen kan skade dyr',['Plast i naturen kan skade dyr','Alle dyr liker plast','Plast forsvinner med en gang']],
          ['reading-detail','Hva kan skje med dyr?','De kan spise plast eller sette seg fast',['De lærer å rydde','De blir alltid større','De begynner å fly']]
        ]],
        ['Laget hadde nådd finalen. Derfor møttes de til en ekstra trening tirsdag kveld.',[
          ['reading-detail','Hvorfor trente laget ekstra?','De skulle spille finale',['De skulle spille finale','De hadde fri','Treneren var syk']],
          ['reading-inference','Hva ønsket laget trolig?','Å forberede seg godt',['Å avlyse finalen','Å slutte med fotball','Å miste kampen med vilje']]
        ]],
        ['Jonas ser på klokken for tredje gang. Om to minutter skal han gå på scenen foran hele skolen.',[
          ['reading-inference','Hvordan føler Jonas seg trolig?','Nervøs',['Nervøs','Sint','Sulten']],
          ['reading-detail','Hva skal Jonas gjøre?','Gå på scenen',['Ta bussen hjem','Spise middag','Spille fotball ute']]
        ]],
        ['En faktatekst blir mer etterprøvbar når den viser hvor opplysningene kommer fra.',[
          ['reading-source','Hvilken opplysning gjør teksten lettere å kontrollere?','Navn på kilden',['Navn på kilden','Mange utropstegn','Store bokstaver','Et fargerikt bilde']],
          ['reading-main-idea','Hva betyr «etterprøvbar» her?','At opplysningene kan kontrolleres',['At teksten er morsom','At teksten er kort','At teksten har rim']]
        ]],
        ['En artikkel hevder at skjermbruk alltid gjør elever dårligere på skolen, men viser ikke til forskning eller andre kilder.',[
          ['reading-source','Hva mangler artikkelen mest?','Dokumentasjon for påstanden',['Flere bilder','En kortere tittel','Større skrift']],
          ['reading-inference','Hvor sikkert bør vi ta påstanden?','Vi bør undersøke mer',['Vi bør tro den uten spørsmål','Vi bør dele den med en gang','Vi bør bare lese overskriften']]
        ]],
        ['Kommunen vil bygge en ny sykkelvei. Noen mener den vil gjøre skoleveien tryggere, mens andre er bekymret for at parkeringsplasser forsvinner.',[
          ['reading-main-idea','Hva viser teksten?','Det finnes ulike syn på sykkelveien',['Alle er enige','Sykkelveien er allerede ferdig','Ingen bruker bil']],
          ['reading-detail','Hva er noen bekymret for?','At parkeringsplasser forsvinner',['At skolen stenger','At veien blir en elv','At sykler forbys']]
        ]],
        ['Da strømmen gikk, fant familien fram lommelykter og stearinlys. Ute blåste vinden kraftig.',[
          ['reading-inference','Hva kan ha bidratt til strømbruddet?','Den kraftige vinden',['En bok på bordet','Middagen','Lommelyktene']],
          ['reading-detail','Hva fant familien fram?','Lommelykter og stearinlys',['Ski og skøyter','Bøker og blyanter','Badetøy og håndklær']]
        ]],
        ['Mina leste to nettsider om samme hendelse. Den ene brukte sterke ord og ingen kilder. Den andre lenket til rapporten den bygde på.',[
          ['reading-source','Hvilken side er lettest å kontrollere?','Siden som lenker til rapporten',['Siden uten kilder','Begge er like','Ingen av dem kan leses']],
          ['reading-inference','Hvorfor er rapportlenken nyttig?','Den lar leseren sjekke grunnlaget',['Den gjør teksten kortere','Den gir flere reklamer','Den erstatter hele teksten']]
        ]],
        ['Reklamen viser en kjent idrettsutøver som sier at drikken gir mer energi. Den viser ingen testresultater.',[
          ['reading-source','Hva bør du være oppmerksom på?','At påstanden ikke dokumenteres',['At utøveren er kjent','At flasken har farge','At teksten er kort']],
          ['reading-inference','Hva er tryggest å gjøre?','Se etter dokumentasjon før du tror på påstanden',['Kjøpe drikken med en gang','Tro alt fordi en kjent person sier det','Bare se på bildet']]
        ]],
        ['I fortellingen står det: «Døra knirket. Amalie stoppet opp og holdt pusten.»',[
          ['reading-inference','Hvilken stemning skapes?','Spenning',['Spenning','Ro','Feiring']],
          ['reading-detail','Hva gjør Amalie?','Hun stopper og holder pusten',['Hun begynner å danse','Hun sovner','Hun løper ut i sola']]
        ]],
        ['Elevrådet foreslår lengre friminutt. De begrunner det med at fysisk aktivitet kan gjøre det lettere å konsentrere seg etterpå.',[
          ['reading-main-idea','Hva er elevrådets standpunkt?','Friminuttene bør bli lengre',['Skolen bør starte senere','Alle lekser bør fjernes','Gym bør avlyses']],
          ['reading-detail','Hva er begrunnelsen?','Mer aktivitet kan hjelpe konsentrasjonen',['Elevene vil ha færre bøker','Skolen mangler stoler','Det regner ofte']]
        ]],
        ['Teksten beskriver byen som «en sovende kjempe» før morgentrafikken begynner.',[
          ['reading-rhetoric','Hvilket virkemiddel brukes?','Metafor',['Metafor','Fotnote','Faktaopplysning','Kildehenvisning']],
          ['reading-inference','Hva antyder uttrykket?','Byen er stille før den våkner til liv',['Byen er bokstavelig talt en kjempe','Byen er tom for mennesker','Trafikken stopper for alltid']]
        ]],
        ['En elev skriver: «Skolen bør ha flere trær i skolegården fordi de gir skygge på varme dager og kan gjøre området hyggeligere.»',[
          ['reading-main-idea','Hva mener eleven?','Skolen bør plante flere trær',['Skolen bør fjerne skolegården','Elevene bør være inne','Alle trær bør kuttes']],
          ['reading-detail','Hvilke grunner gis?','Skygge og et hyggeligere område',['Mer lekser og mindre plass','Flere biler og asfalt','Kortere skoledag']]
        ]],
        ['En nettartikkel viser til en undersøkelse, men lenken går bare til en reklameside som selger produktet artikkelen anbefaler.',[
          ['reading-source','Hva bør du undersøke nærmere?','Om undersøkelsen faktisk finnes og er uavhengig',['Om reklamesiden har fine bilder','Om tittelen rimer','Om produktet har kort navn']],
          ['reading-inference','Hvorfor er koblingen relevant?','Avsenderen kan ha interesse av å selge produktet',['Reklame gjør alltid alt sant','Lenker kan aldri åpnes','Produkter trenger ikke dokumentasjon']]
        ]]
      ].forEach(x=>addReading(...x));

    }else{
      [
        ['Hvilket virkemiddel gjentar samme start i flere setninger?','Anafor',['Anafor','Ironi','Kontrast','Metafor']],
        ['Hva kalles en tydelig motsetning mellom to ideer?','Kontrast',['Kontrast','Allitterasjon','Fotnote','Referat']],
        ['«Denne telefonen vil forandre livet ditt» bruker først og fremst ...','overdrivelse',['overdrivelse','kildehenvisning','rim','referat']],
        ['Hva er et retorisk spørsmål?','Et spørsmål som ofte ikke krever svar',['Et spørsmål med to riktige svar','Et matematisk spørsmål','Et spørsmål uten verb']],
        ['Hva betyr etos i argumentasjon?','Troverdighet',['Troverdighet','Følelser','Logisk bevis','Rim']],
        ['Hva betyr logos i argumentasjon?','Saklige grunner og logikk',['Saklige grunner og logikk','Følelser','Popularitet','Humor']],
        ['Hva betyr patos i argumentasjon?','Appell til følelser',['Appell til følelser','Kildeliste','Tegnsetting','Ordklasse']],
        ['«Tusen takk for at du kom så tidlig» sagt til en som er sent, kan være ...','ironi',['ironi','metafor','fakta','allitterasjon']],
        ['Når flere ord begynner med samme lyd, kalles det ...','allitterasjon',['allitterasjon','fotnote','referat','etos']],
        ['Hva gjør en gjentakelse ofte i en tekst?','Fremhever et poeng',['Skjuler alltid budskapet','Gjør teksten kildekritisk','Fjerner all rytme']]
      ].forEach(([prompt,answer,options])=>addChoice('rhetoric',prompt,answer,options));

      [
        ['Hva bør du undersøke først når du vurderer en nettkilde?','Hvem som står bak',['Hvem som står bak','Hvor lang teksten er','Om siden har bilder','Om tittelen er kort']],
        ['Hva styrker troverdigheten til en faktapåstand mest?','At den støttes av etterprøvbare kilder',['At mange deler den','At overskriften er dramatisk','At teksten er lang']],
        ['Hvorfor er publiseringsdato relevant?','For å vurdere om informasjonen er oppdatert',['For å se hvor populær teksten er','For å telle avsnitt','For å finne forfatterens alder']],
        ['Hva bør du gjøre med en påstand som bare finnes i én anonym post?','Lete etter uavhengige kilder',['Dele den straks','Regne den som bevist','Ignorere all annen informasjon']],
        ['Hva er en primærkilde?','En kilde som står nær den opprinnelige hendelsen eller materialet',['Den første siden i et søkeresultat','En tekst uten forfatter','En reklame']],
        ['Hva er et tegn på at en kilde kan ha en interessekonflikt?','At den tjener på at du tror på budskapet',['At den bruker punktum','At den har dato','At den er kort']],
        ['Hva er kildekritikk?','Å undersøke hvor pålitelig informasjon er',['Å være negativ til alle tekster','Å lese bare overskriften','Å unngå fakta']],
        ['Hvorfor sammenligne flere kilder?','For å se om opplysninger støttes fra flere hold',['For å finne den lengste teksten','For å velge den peneste nettsiden','For å unngå å lese']],
        ['Hva betyr det at en kilde er uavhengig?','At den ikke styres av samme interesse som den vurderer',['At den ikke har forfatter','At den alltid er gratis','At den er kort']],
        ['Hva bør du gjøre hvis en overskrift ikke stemmer med artikkelens innhold?','Vurdere overskriften som misvisende',['Tro overskriften uansett','Ignorere selve artikkelen','Dele bare bildet']]
      ].forEach(([prompt,answer,options])=>addChoice('source-criticism',prompt,answer,options));

      [
        ['«Havet var et speil» er et eksempel på ...','metafor',['metafor','rim','faktaopplysning','replikk']],
        ['Når naturen får menneskelige egenskaper, kalles det ...','personifikasjon',['personifikasjon','referat','argument','fotnote']],
        ['En hovedperson som forteller med «jeg», bruker ...','førstepersonsforteller',['førstepersonsforteller','allvitende kart','sakprosastemme','tredjeperson flertall']],
        ['Et tilbakeblikk i en fortelling viser ...','noe som skjedde tidligere',['noe som skjedde tidligere','bare framtiden','en kildeliste','en overskrift']],
        ['Hva er et symbol i litteratur?','Noe konkret som også kan stå for en større idé',['Et tilfeldig tegn uten mening','En grammatisk feil','Et sidetall']],
        ['Hva er en kontrast i en tekst?','To motsetninger som settes opp mot hverandre',['To identiske avsnitt','En kildehenvisning','En stavefeil']],
        ['Hva er et motiv i en fortelling?','Et konkret element eller en situasjon som går igjen',['Bare forfatterens navn','Antall sider','Skriftstørrelsen']],
        ['Hva er temaet i en tekst?','Den overordnede ideen teksten utforsker',['Bare handlingens første setning','Tittelen alene','Antall personer']],
        ['Hva er et frampek?','Et hint om noe som kan skje senere',['Et sitat fra kildelisten','Et tilbakeblikk','En rettskrivingsregel']],
        ['Hva er en allvitende forteller?','En forteller som kan kjenne flere personers tanker',['En person som bare sier «jeg»','En tilfeldig leser','En overskrift']]
      ].forEach(([prompt,answer,options])=>addChoice('literary-devices',prompt,answer,options));

      [
        ['Hva er et argument?','En begrunnelse for et standpunkt',['En overskrift','Et tilfeldig eksempel','Et egennavn','Et rim']],
        ['Hva er et motargument?','En innvending mot et standpunkt eller argument',['En gjentakelse av samme argument','En tittel','Et sitat uten sammenheng']],
        ['Hva gjør et argument sterkere?','Relevant dokumentasjon',['Flere utropstegn','Større skrift','Et lengre avsnitt uten kilder']],
        ['Hva er et standpunkt?','Det du mener i en sak',['En kildehenvisning','Et verb','En fotnote']],
        ['Hva er en begrunnelse?','En forklaring på hvorfor et standpunkt bør godtas',['En dekorasjon','Et tilfeldig tall','En overskrift']],
        ['Hva er forskjellen på påstand og dokumentasjon?','Påstanden sier noe; dokumentasjonen støtter eller tester det',['De betyr alltid det samme','Dokumentasjon er bare meninger','Påstander kan aldri vurderes']],
        ['Hva kjennetegner saklig argumentasjon?','Grunner som er relevante for saken',['Personangrep','Rykter','Flest mulig utropstegn']],
        ['Hva er et eksempel på personangrep?','Å kritisere personen i stedet for argumentet',['Å etterspørre kilde','Å vise til data','Å forklare et motargument']],
        ['Hva er en generalisering?','En bred påstand som går fra noen tilfeller til mange eller alle',['En kildehenvisning','En rettskrivingsregel','Et direkte sitat']],
        ['Hva er et eksempel på relevant dokumentasjon?','Data som faktisk gjelder spørsmålet som diskuteres',['Et tilfeldig tall','Et bilde uten sammenheng','En påstand uten kilde']]
      ].forEach(([prompt,answer,options])=>addChoice('argumentation',prompt,answer,options));

      [
        ['Hvilken setning er mest formell?','Vi ber om at søknaden behandles.',['Vi ber om at søknaden behandles.','Kan dere fikse den greia?','Dette er sykt viktig!','Bare ordn det.']],
        ['Hvilken formulering passer best i en fagtekst?','Resultatene tyder på en sammenheng.',['Resultatene tyder på en sammenheng.','Dette beviser alt, liksom.','Greia er ganske vill.','Alle vet jo dette.']],
        ['Hva bør en tydelig innledning gjøre?','Presentere tema og retning for teksten',['Gjenta konklusjonen fem ganger','Liste tilfeldige fakta','Skjule hva teksten handler om']],
        ['Hva bør hvert avsnitt helst ha?','Ett tydelig hovedpoeng',['Flest mulig tema','Ingen sammenheng','Bare sitater']],
        ['Hva gjør et bindeord som «derfor»?','Viser sammenheng mellom ideer',['Endrer skrifttype','Gjør teksten anonym','Fjerner argumentet']],
        ['Hva signaliserer «derimot»?','En kontrast eller motsetning',['En årsak','En avslutning uten motsetning','Et direkte sitat']],
        ['Hva er mest presist språk?','Ord som sier nøyaktig hva du mener',['Vage uttrykk som «ting» og «greier»','Flest mulig fremmedord','Lengst mulige setninger']],
        ['Hva er en god konklusjon?','En avslutning som samler hovedpoengene',['Et helt nytt tema','En tilfeldig historie','En liste uten sammenheng']],
        ['Hva gjør «fordi» i en argumenterende setning?','Innleder ofte en begrunnelse',['Markerer alltid et sitat','Gjør setningen til et spørsmål','Viser at teksten er ferdig']],
        ['Hva er en god overgang mellom avsnitt?','En formulering som viser sammenhengen mellom poengene',['Et tilfeldig nytt tema','Ingen forbindelse','En gjentatt overskrift']]
      ].forEach(([prompt,answer,options])=>addChoice('language',prompt,answer,options));

      [
        ['En påstand alene sier hva noen mener. Når den støttes av relevante grunner og etterprøvbar dokumentasjon, blir argumentasjonen tydeligere og mer overbevisende.',[
          ['reading-main-idea','Hva er hovedbudskapet?','Påstander blir sterkere når de begrunnes',['Alle påstander er sanne','Korte tekster er alltid best','Fakta trenger ingen kilde']],
          ['reading-inference','Hva bør en skribent gjøre med en viktig påstand?','Underbygge den med relevante grunner og dokumentasjon',['Gjenta den uten begrunnelse','Skrive den med store bokstaver','Skjule kildene']]
        ]],
        ['En dramatisk overskrift kan være fristende å dele, men innholdet bør undersøkes før man trekker en sikker konklusjon.',[
          ['reading-inference','Hva antyder teksten?','Forfatteren er kritisk til raske konklusjoner',['Forfatteren vil forby forskning','Forfatteren mener alle kilder er like','Forfatteren liker korte overskrifter']],
          ['reading-main-idea','Hva er rådet i teksten?','Undersøk innholdet før du konkluderer',['Del først og les senere','Tro alltid overskriften','Unngå alle nyheter']]
        ]],
        ['En rapport viser en tydelig økning fra ett år til det neste. Forskerne understreker samtidig at tallene alene ikke forklarer hvorfor økningen skjedde.',[
          ['reading-inference','Hva advarer forskerne mot?','Å forveksle utvikling med forklaring',['Å bruke tall','Å sammenligne år','Å lese rapporten']],
          ['reading-detail','Hva viser rapporten?','En økning fra ett år til det neste',['En nedgang over ti år','Ingen endring','At årsaken er bevist']]
        ]],
        ['Debattinnlegget åpner med historien om én elev som mistrivdes. Deretter brukes historien som støtte for en påstand om alle elever i landet.',[
          ['reading-source','Hva er svakheten i argumentasjonen?','Én historie brukes til å si noe om alle',['Teksten har en innledning','Eleven er nevnt','Det finnes et standpunkt']],
          ['reading-inference','Hva trengs for å støtte den brede påstanden bedre?','Mer representativ dokumentasjon',['Flere utropstegn','Et lengre personnavn','Et bilde av skolen']]
        ]],
        ['Nettsiden selger kosttilskuddet den omtaler som «revolusjonerende». Den viser til egne kundehistorier, men ingen uavhengige studier.',[
          ['reading-source','Hva bør leseren særlig merke seg?','At avsenderen har økonomisk interesse',['At siden har et produktbilde','At ordet er langt','At kundene har navn']],
          ['reading-inference','Hva ville styrket påstanden mest?','Uavhengig forskning',['Flere kundehistorier fra samme side','En større logo','En kortere tekst']]
        ]],
        ['I novellen beskrives huset først som lyst og åpent. Etter konflikten omtales de samme rommene som trange og mørke.',[
          ['reading-rhetoric','Hva gjør kontrasten i beskrivelsene?','Den speiler endringen i stemning',['Den oppgir en kilde','Den forklarer grammatikk','Den gir et eksakt årstall']],
          ['reading-inference','Hva har trolig skjedd med stemningen?','Den har blitt mer ubehagelig',['Den er helt uendret','Den har blitt komisk','Teksten handler nå om været']]
        ]],
        ['Artikkelen siterer en forsker direkte, lenker til studien og forklarer samtidig at studien bare omfatter 120 deltakere.',[
          ['reading-source','Hva gjør artikkelen godt?','Den viser både kilde og begrensning',['Den skjuler utvalget','Den bruker bare overskrifter','Den lover sikre svar']],
          ['reading-inference','Hvorfor er antall deltakere relevant?','Det sier noe om hvor bredt funnene kan tolkes',['Det bestemmer skriftstørrelsen','Det viser forskerens alder','Det avgjør om sitatet er grammatisk']]
        ]],
        ['Forfatteren skriver: «Vi kan ikke løse alle problemer i dag. Men vi kan begynne med det vi faktisk kan gjøre.»',[
          ['reading-rhetoric','Hvilket grep brukes?','Kontrast mellom alt og det mulige',['Fotnote','Oppramsing av kilder','Rim']],
          ['reading-main-idea','Hva er budskapet?','Start med gjennomførbare tiltak',['Vent til alt kan løses samtidig','Problemer kan ikke løses','Unngå å handle']]
        ]],
        ['Kommentarfeltet er fullt av påstander om at en video viser en bestemt hendelse. Ingen oppgir hvor eller når videoen ble tatt opp.',[
          ['reading-source','Hva mangler for å verifisere videoen?','Kontekst om tid og sted',['Flere kommentarer','Et morsomt brukernavn','Høyere lyd']],
          ['reading-inference','Hva er den sikreste reaksjonen?','Vær usikker til konteksten er bekreftet',['Anta at første kommentar er riktig','Del videoen som bevis','Ignorer behovet for kilde']]
        ]],
        ['Teksten bruker ord som «katastrofe», «sjokkerende» og «skandale» i nesten hvert avsnitt, men gir få konkrete opplysninger.',[
          ['reading-rhetoric','Hva preger språket?','Sterkt ladede ord',['Nøytralt fagspråk','Bare statistikk','Ingen vurderinger']],
          ['reading-inference','Hva bør leseren gjøre?','Skille språkbruk fra dokumenterte fakta',['La sterke ord erstatte dokumentasjon','Anta at alt er sant','Bare lese overskriften']]
        ]],
        ['To undersøkelser kommer til ulike resultater. Den ene spør 40 frivillige på ett treningssenter, den andre trekker 2000 personer tilfeldig fra hele landet.',[
          ['reading-source','Hvilken undersøkelse har bredest utvalg?','Den med 2000 tilfeldig trukne personer',['Den med 40 frivillige','Begge har identisk utvalg','Det kan ikke vurderes']],
          ['reading-inference','Hvorfor kan utvalget ha betydning?','Det påvirker hvor representativt resultatet kan være',['Det endrer spørsmålenes språk automatisk','Det bestemmer datoen','Det gjør alle resultater sanne']]
        ]],
        ['I kronikken skriver forfatteren først at motpartens bekymring er forståelig, før hun forklarer hvorfor hun likevel mener løsningen er feil.',[
          ['reading-rhetoric','Hva gjør forfatteren?','Anerkjenner et motargument før hun svarer',['Unngår motargumentet','Bruker bare personangrep','Bytter tema helt']],
          ['reading-inference','Hva kan dette bidra til?','En mer nyansert argumentasjon',['At teksten blir uten standpunkt','At alle blir enige','At kilder blir unødvendige']]
        ]],
        ['En språkmodell kan produsere en overbevisende tekst også når opplysningene er feil. Derfor bør faktapåstander kontrolleres mot pålitelige kilder.',[
          ['reading-main-idea','Hva er hovedpoenget?','Overbevisende språk er ikke det samme som sannhet',['Språkmodeller har alltid rett','Pålitelige kilder er unødvendige','Tekster bør være lengst mulig']],
          ['reading-inference','Hva bør du gjøre med konkrete faktapåstander?','Kontrollere dem mot pålitelige kilder',['Godta dem hvis språket er sikkert','Bare se på lengden','Dele dem uten kontroll']]
        ]],
        ['I et utdrag går hovedpersonen forbi den samme stengte døren tre ganger. Hver gang stopper hun litt lenger, men hun åpner den aldri.',[
          ['reading-inference','Hva kan gjentakelsen skape?','Forventning og spenning',['En kildeliste','Et matematisk bevis','En reklamepause']],
          ['reading-rhetoric','Hva er virkningen av at døren gjentas?','Den fremheves som viktig',['Den blir mindre relevant','Den blir et faktaavsnitt','Den forklarer tegnsetting']]
        ]],
        ['En graf viser at to tallserier stiger samtidig over fem år. Teksten hevder derfor at den ene serien må være årsaken til den andre.',[
          ['reading-source','Hva er problemet med konklusjonen?','Samtidig utvikling beviser ikke årsak',['Grafer kan aldri brukes','Fem år er alltid for lenge','Tall kan ikke sammenlignes']],
          ['reading-inference','Hva trengs for å si mer om årsak?','Mer undersøkelse av mulige forklaringer',['En større overskrift','Flere farger i grafen','Et kortere avsnitt']]
        ]]
      ].forEach(x=>addReading(...x));
    }

    const readingSkills=new Set(['letter-sound','word-picture','reading-comprehension','reading-inference','reading-main-idea','reading-detail','reading-source','reading-rhetoric','reading-structure']);
    const spellingSkills=new Set(['missing-letter','spelling','compound-words','double-consonant','letter-sound','change-letter','add-letter','remove-letter']);
    const languageSkills=new Set(['sentence-order','rhyme','synonyms','word-class','grammar','nynorsk','punctuation','rhetoric','source-criticism','literary-devices','argumentation','language']);
    if(module==='reading')return q.filter(x=>readingSkills.has(x.skill));
    if(module==='spelling')return q.filter(x=>spellingSkills.has(x.skill));
    if(module==='language')return q.filter(x=>languageSkills.has(x.skill));
    return q;
  }

  window.buildNorwegianPool=buildNorwegianPool;
  window.dispatchEvent(new CustomEvent('norwegian-content-ready'));
})();
