/* Original, short Norwegian country discoveries. Editorial content is separate
 * from artwork, population statistics, quiz questions and learning progress.
 * Coverage is deliberately explicit: an absent record is not a generic story.
 * Sources were reviewed 2026-10-15. Geography examples are not national stereotypes. */
(function(root){
  'use strict';
  const reviewed='2026-10-15';
  const source=(title,url)=>Object.freeze({title,url,reviewed});
  const whc=(title,id)=>source('UNESCO: '+title,'https://whc.unesco.org/en/list/'+id+'/');
  const discovery=(category,title,text,reference)=>Object.freeze({category,title,text,source:reference});
  const record=(tagline,teaser,discoveries)=>Object.freeze({tagline,teaser,reviewed,discoveries:Object.freeze(discoveries)});
  const ennedi=whc('Ennedi',1475),amazon=whc('Central Amazon',998),teWahi=whc('Te Wahipounamu',551);
  const thingvellir=source('Visit Iceland: Thingvellir','https://www.visiticeland.com/article/thingvellir/');
  const entries=Object.freeze({
    ch:record('Spisse fjell og fire språk','Sveits har fire nasjonalspråk, og flagget er kvadratisk.',[
      discovery('Natur','Et fjell som en spiss tann','Matterhorn har en spiss topp som er lett å kjenne igjen. Fjellet er 4 478 meter høyt.',source('Switzerland Tourism: Matterhorn','https://www.myswitzerland.com/de-ch/reiseziele/matterhorn-sinnbild-fuer-die-schweiz/')),
      discovery('Språk','Fire språk i ett land','Sveits har fire nasjonalspråk: tysk, fransk, italiensk og retoromansk. Folk snakker forskjellige språk i ulike deler av landet.',source('Sveitsiske myndigheter: språk','https://www.aboutswitzerland.eda.admin.ch/en/multilingualism')),
      discovery('Flagg','Se på formen til flagget!','Det sveitsiske flagget er kvadratisk. Alle fire sidene er like lange. Midt på det røde flagget er det et hvitt kors.',source('Sveitsiske myndigheter: flagget','https://www.aboutswitzerland.eda.admin.ch/en/the-swiss-flag-a-plus-for-the-country'))
    ]),
    cz:record('Steintårn og en klokke med figurer','Ordet «robot» kommer fra tsjekkisk og ble kjent gjennom et teaterstykke.',[
      discovery('Historie','En klokke med et lite skuespill','I Praha finnes en klokke med små figurer som beveger seg. Selve klokken ble laget for over 600 år siden.',source('Prague City Tourism: rådhusklokken','https://prague.eu/en/objevujte/old-town-hall-with-astronomical-clock-staromestska-radnice-s-orlojem/')),
      discovery('Natur','Naturens egne steintårn','I området Český ráj finnes høye tårn av sandstein. Vann har formet steinene gjennom svært lang tid. Noen steder ligner landskapet en labyrint.',source('UNESCO: Bohemian Paradise','https://www.unesco.org/en/iggp/bohemian-paradise-unesco-global-geopark')),
      discovery('Språk','Et ord du allerede kjenner','Ordet «robot» kommer fra tsjekkisk. Det ble kjent gjennom et teaterstykke for over 100 år siden, lenge før dagens roboter.',source('Tsjekkias ambassade: ordet robot','https://mzv.gov.cz/ottawa/en/news_and_events/robot_the_most_famous_czech_word.html'))
    ]),
    no:record('Dype fjorder og sol om natten','Nord i Norge kan solen være oppe hele natten om sommeren.',[
      discovery('Natur','Is som formet fjordene','Store isbreer gravde ut dype daler. Da isen smeltet, fylte havet mange av dalene. Slik ble de norske fjordene til.',whc('Vestnorske fjorder',1195)),
      discovery('Natur','Sol ved midnatt','Nord i Norge er solen oppe hele døgnet i deler av sommeren. Det kalles midnattssol. Jo lenger nord du er, desto lenger varer perioden.',source('Visit Norway: midnattssol','https://www.visitnorway.com/things-to-do/nature-attractions/midnight-sun/')),
      discovery('Historie','En kirke med utskårne dyr','Urnes stavkirke er bygget av tre. I utskjæringene kan du oppdage dyr som slynger seg rundt hverandre. Kirken er over 800 år gammel.',whc('Urnes stavkirke',58))
    ]),
    se:record('Pippi, et gammelt skip og land som stiger','Skipet Vasa lå under vann i 333 år før det ble hentet opp.',[
      discovery('Historie','Skipet som kom opp igjen','Vasa sank i Stockholm i 1628, på sin aller første reise. Etter 333 år under vann ble skipet hentet opp. Nå står det på museum.',source('Vasamuseet: Vasa','https://www.vasamuseet.se/no')),
      discovery('Fortellinger','Her ble Pippi til','Den svenske forfatteren Astrid Lindgren skapte Pippi Langstrømpe. Den første boken om Pippi kom i 1945.',source('Astrid Lindgren: Pippi','https://www.astridlindgren.com/gb/pippi-langstrump-900002')),
      discovery('Natur','Land som løfter seg','Ved Höga kusten stiger landet fortsatt langsomt etter istiden. Den tunge isen presset bakken ned. Nå løfter bakken seg igjen.',whc('High Coast / Kvarken',898))
    ]),
    dk:record('LEGO, runesteiner og tidevann','LEGO begynte med treleker, lenge før de kjente plastklossene.',[
      discovery('Oppfinnelser','Før klossene kom','LEGO startet med treleker i 1932. Navnet kommer fra de danske ordene «leg godt», som betyr å leke godt.',source('LEGO: selskapets begynnelse','https://www.lego.com/et-ee/history/articles/b-the-beginning-of-the-lego-group')),
      discovery('Historie','Beskjeder på stein','I Jelling står store steiner med runer fra vikingtiden. Runene er skrifttegn. De forteller blant annet om kongene Gorm og Harald.',whc('Jelling',697)),
      discovery('Natur','Et landskap som skifter','I Vadehavet dekker og avdekker tidevannet store flater av sand og mudder. Mange trekkfugler finner mat der på reisen sin.',whc('Vadehavet',1314))
    ]),
    fi:record('Innsjøsel, badstuer og nye øyer','Saimaselen lever i en innsjø i Finland, ikke ute i havet.',[
      discovery('Dyr','En sel i en innsjø','Saimaselen lever bare i innsjøområdet Saimaa i Finland. Den er truet, og mennesker arbeider for å beskytte den.',source('Metsähallitus: saimasel','https://www.metsa.fi/en/protection-and-management/species/saimaa-ringed-seal/')),
      discovery('Hverdagsliv','Tid for badstue','I Finland er badstuen en viktig tradisjon. Mange bruker den som et rolig sted for å vaske seg, slappe av og være sammen.',source('Finnish Heritage Agency: sauna','https://www.museovirasto.fi/en/articles/sauna-culture-intangible-cultural-heritage')),
      discovery('Natur','Nye øyer kommer til syne','I Kvarken stiger landet sakte opp etter istiden. Derfor dukker nye øyer opp av havet. En vik kan etter hvert bli en innsjø.',whc('Kvarken Archipelago',898))
    ]),
    is:record('Vulkanøyer og spor etter et gammelt ting','Øya Surtsey ble til da en vulkan brøt ut i havet.',[
      discovery('Natur','En øy blir født','Surtsey vokste opp av havet under vulkanutbrudd fra 1963 til 1967. Forskere følger med på hvordan planter og dyr finner veien dit.',whc('Surtsey',1267)),
      discovery('Geologi','Bakken beveger seg','Ved Thingvellir kan du se sprekker i landskapet. Her trekker to av jordens store plater seg langsomt fra hverandre.',thingvellir),
      discovery('Historie','Møter ute i landskapet','På Thingvellir samlet folk seg til Alltinget fra år 930. De møttes ute for å diskutere og ordne saker i samfunnet.',thingvellir)
    ]),
    gb:record('Steinsirkler, tårn og vulkansøyler','Giant’s Causeway i Nord-Irland består av tusenvis av steinsøyler.',[
      discovery('Natur','Steiner som byggeklosser','Ved Giant’s Causeway i Nord-Irland står tusenvis av steinsøyler tett sammen. De ble til gjennom gammel vulkansk aktivitet.',whc('Giant’s Causeway',369)),
      discovery('Historie','Store steiner i en ring','Stonehenge i England består av svære steiner som mennesker satte opp for tusenvis av år siden. Noen steiner ligger på tvers av andre.',whc('Stonehenge',373)),
      discovery('Historie','En borg midt i London','Tower of London er en gammel borg ved elven Themsen. Det hvite tårnet ble reist for Vilhelm Erobreren på 1000-tallet.',whc('Tower of London',488))
    ]),
    de:record('Fossiler, høye tårn og en skogsborg','I Messel er noen fossiler så godt bevart at forskere kan se dyrenes siste måltid.',[
      discovery('Forskning','Et måltid fra fortiden','I Messel er det funnet svært godt bevarte fossiler av dyr. Noen har til og med rester av mageinnholdet bevart. Det forteller hva dyrene spiste.',whc('Messel',720)),
      discovery('Byggverk','En kirke som tok lang tid','Byggingen av domkirken i Köln startet i 1248. Den ble ferdig i 1880, mer enn 600 år senere. Arbeidet foregikk i flere etapper.',whc('Cologne Cathedral',292)),
      discovery('Historie','Borgen over skogen','Wartburg ligger høyt over byen Eisenach, omgitt av skog. Her oversatte Martin Luther Det nye testamentet til tysk.',whc('Wartburg',897))
    ]),
    fr:record('Eiffeltårnet og bilder fra steinalderen','I Lascaux malte mennesker dyr på huleveggene i steinalderen.',[
      discovery('Byggverk','Et stort byggesett av metall','Eiffeltårnet i Paris ble bygget til verdensutstillingen i 1889. Tusenvis av metalldeler ble laget på forhånd og satt sammen.',source('Eiffeltårnets offisielle historie','https://www.toureiffel.paris/en/the-monument/history')),
      discovery('Kunst','Bilder inne i en hule','I Lascaux finnes gamle bilder av dyr på huleveggene. De ble malt av mennesker i steinalderen, lenge før det fantes bøker.',whc('Vézère og Lascaux',85)),
      discovery('Historie','Et hjem for konger','Slottet Versailles var hjem for franske konger. Rundt slottet ligger store hager som ble planlagt og formet av mennesker.',whc('Versailles',83))
    ]),
    es:record('Plystrespråk og fantasifulle bygninger','På La Gomera kan mennesker sende beskjeder ved å plystre.',[
      discovery('Språk','Kan du plystre en beskjed?','På den spanske øya La Gomera brukes Silbo Gomero. Spanske ord blir gjort om til plystrelyder, slik at man kan sende beskjeder med dem.',source('UNESCO: Silbo Gomero','https://ich.unesco.org/en/decisions/4.COM/13.71')),
      discovery('Byggverk','Gaudís egne former','Arkitekten Antoni Gaudí tegnet flere kjente bygninger i Barcelona. Blant arbeidene hans er deler av kirken Sagrada Família og parken Park Güell.',whc('Antoni Gaudí',320)),
      discovery('Historie','Palasser med hager','I Granada ligger Alhambra, et gammelt palassområde. Like ved ligger Generalife med hager som ble brukt av herskerne som bodde der.',whc('Alhambra og Generalife',314))
    ]),
    it:record('Kanaler, vulkanspor og skjeve tårn','Venezia er bygget på mange små øyer, med kanaler mellom husene.',[
      discovery('Hverdagsliv','Båter mellom husene','Venezia er en by bygget på mange små øyer. Kanaler går mellom husene, og broer binder øyene sammen.',whc('Venezia',394)),
      discovery('Historie','Byen under asken','I år 79 ble Pompeii dekket av aske fra vulkanen Vesuv. Gamle hus og gater ble bevart under asken og senere gravd frem.',whc('Pompeii',829)),
      discovery('Byggverk','Tårnet som heller','I Pisa står et klokketårn som lener seg til siden. Det er en del av et stort kirkeområde med både domkirke og dåpskapell.',whc('Piazza del Duomo, Pisa',395))
    ]),
    eg:record('Nilen, pyramider og gamle templer','Langs Nilen ligger grønne åkrer, selv om mye av området rundt er ørken.',[
      discovery('Natur','En grønn stripe i ørkenen','Nilen renner gjennom Egypt. Langs elven kan mennesker dyrke mat. Sett fra verdensrommet ligner jordene en grønn stripe gjennom det tørre landskapet.',source('NASA: Nile Bend, Egypt','https://science.nasa.gov/earth/earth-observatory/nile-bend-egypt-8770/')),
      discovery('Historie','Store graver av stein','Pyramidene i Giza ble bygget som graver for konger i oldtidens Egypt. Det finnes også mange andre pyramider i landet.',whc('Memphis og pyramidene',86)),
      discovery('Historie','En by full av gamle spor','Ved dagens Luxor lå oldtidsbyen Theben. Her finnes store templer og graver som forteller om livet i Egypt for flere tusen år siden.',whc('Theben',87))
    ]),
    td:record('Ennedi, steinbuer og innsjøer i ørkenen','I Ennedi har vind og vann formet høye steinbuer i landskapet.',[
      discovery('Natur','Buer uten en byggmester','I Ennedi står naturlige buer av sandstein. Vind og vann har slitt på berget gjennom lang tid og formet både buer og dype daler.',ennedi),
      discovery('Kunst','Bilder rett på fjellet','I Ennedi malte og risset mennesker bilder på bergvegger. Tusenvis av slike bilder er bevart og forteller om menneskene som levde der.',ennedi),
      discovery('Natur','Vann midt i Sahara','Ounianga har innsjøer omgitt av et tørt ørkenlandskap. Vann fra bakken fyller på innsjøene selv om mye vann fordamper i varmen.',whc('Ounianga',1400))
    ]),
    ke:record('Et høyt fjell og krokodiller i en innsjø','Mount Kenya var en gang en vulkan. Nå har fjellet taggete topper.',[
      discovery('Natur','Et fjell med en vulkanfortid','Mount Kenya er en gammel, utslokt vulkan. Is har vært med på å forme fjellets taggete topper og daler.',whc('Mount Kenya',800)),
      discovery('Dyr','Krokodiller ved Turkana','Turkanasjøen er et viktig leveområde for nilkrokodiller. Området er også viktig for flodhester og mange fugler.',whc('Lake Turkana',801)),
      discovery('Historie','En festning ved havet','I havnebyen Mombasa ligger Fort Jesus. Portugiserne bygget festningen på 1500-tallet for å beskytte havnen.',whc('Fort Jesus',1295))
    ]),
    za:record('Pingviner, sjeldne planter og gamle fossiler','Ved Boulders lever afrikanske pingviner på strendene.',[
      discovery('Dyr','Pingviner uten snø','Ved Boulders på Kapphalvøya lever afrikanske pingviner. Pingviner finnes altså ikke bare i is og snø!',source('SANParks: Boulders','https://www.sanparks.org/travel/webcams/still/boulders')),
      discovery('Natur','Planter du ikke finner overalt','Kappområdet har svært mange ulike planter. Mange vokser naturlig bare i denne delen av verden. Buskvegetasjonen kalles fynbos.',whc('Cape Floral Region',1007)),
      discovery('Forskning','Spor etter våre slektninger','I grotter i Sør-Afrika er det funnet fossiler etter tidlige slektninger av mennesket. Forskere bruker dem for å forstå vår lange historie.',whc('Fossil Hominid Sites',915))
    ]),
    cn:record('Pandaer og en hær laget av leire','Ved graven til Kinas første keiser står en hel hær av leirfigurer.',[
      discovery('Dyr','Pandaenes fjellskoger','I Sichuan finnes verneområder der kjempepandaer lever vilt. Skogene gir også hjem til andre dyr, blant annet rødpandaer.',whc('Sichuan Giant Panda Sanctuaries',1213)),
      discovery('Byggverk','Ikke bare én mur','Den kinesiske mur består av mange deler som ble bygget til ulike tider. Langs murene finnes vakttårn, porter og festninger.',whc('Den kinesiske mur',438)),
      discovery('Historie','Soldater som aldri marsjerer','Ved graven til den første Qin-keiseren ble tusenvis av figurer av soldater og hester gravd ned. De er laget av brent leire, ikke levende mennesker.',whc('First Qin Emperor',441))
    ]),
    jp:record('Fuji, hvite borger og bratte hustak','I japanske fjellandsbyer finnes hus med svært bratte stråtak.',[
      discovery('Natur','Fjellet i bildene','Fuji er en vulkan som mange kunstnere har laget bilder av. Fjellet har også vært et viktig hellig sted i japansk kultur.',whc('Fujisan',1418)),
      discovery('Byggverk','En hvit borg av tre','Himeji-borgen har hvite vegger og mange tak over hverandre. Selv om den ser ut som stein utenpå, er mye av byggverket laget av tre.',whc('Himeji-jo',661)),
      discovery('Hverdagsliv','Hus tilpasset fjellivet','I Shirakawa-go og Gokayama står gamle hus med bratte stråtak. Husene er tilpasset livet i fjellene, der vintrene kan gi mye snø.',whc('Shirakawa-go og Gokayama',734))
    ]),
    in:record('Marmor, neshorn og trapper ned til vann','I India finnes store brønner der trapper leder langt ned til vannet.',[
      discovery('Byggverk','Et minne i hvit marmor','Taj Mahal i byen Agra er bygget av hvit marmor. Keiser Shah Jahan fikk det reist til minne om sin kone.',whc('Taj Mahal',252)),
      discovery('Hverdagsliv','Trapper ned til brønnen','Rani-ki-Vav er en gammel trappebrønn. I stedet for å stå ved kanten kan man følge trapper ned gjennom flere nivåer mot vannet.',whc('Rani-ki-Vav',922)),
      discovery('Dyr','Neshorn med ett horn','I Kaziranga nasjonalpark lever indiske neshorn. De har ett horn på nesen. Parken gir også hjem til blant annet tigre og elefanter.',whc('Kaziranga',337))
    ]),
    br:record('Store fossefall og delfiner i elvene','I Amazonas finnes delfiner som lever i elver, ikke i havet.',[
      discovery('Natur','Mange fossefall sammen','Iguaçu består av mange fossefall langs grensen mellom Brasil og Argentina. Vannet stuper ned i et stort, buet fosseområde.',whc('Iguaçu',355)),
      discovery('Dyr','Delfiner i ferskvann','I Amazonas lever elvedelfiner. De svømmer i ferskvann og er blant dyrene som gjør elvesystemet spesielt.',amazon),
      discovery('Natur','Skog som blir oversvømt','Deler av skogen i Amazonas blir oversvømt når vannet stiger. Planter og dyr der er tilpasset at vannstanden endrer seg gjennom året.',amazon)
    ]),
    us:record('Dype kløfter og varme vannsprut','Coloradoelven har vært med på å grave ut den enorme Grand Canyon.',[
      discovery('Natur','En elv som graver','Coloradoelven har gjennom svært lang tid gravd ut Grand Canyon. I fjellveggene ligger berglagene synlige, nesten som sidene i en gammel bok.',whc('Grand Canyon',75)),
      discovery('Historie','En gave fra et annet land','Frihetsgudinnen står ved New York. Statuen var en gave fra Frankrike til USA og ble avduket i 1886.',whc('Statue of Liberty',307)),
      discovery('Natur','Varmt vann fra bakken','I Yellowstone finnes geysirer som spruter varmt vann opp i luften. Varmen kommer fra jordens indre.',whc('Yellowstone',28))
    ]),
    ca:record('Dinosaurfunn og spor etter vikinger','På Newfoundland finnes spor etter nordboere som kom dit for rundt tusen år siden.',[
      discovery('Forskning','Dinosaurer i bakken','I Dinosaur Provincial Park er det funnet mange dinosaurfossiler. De forteller om dyr som levde der for over 70 millioner år siden.',whc('Dinosaur Provincial Park',71)),
      discovery('Historie','Vikinger på den andre siden av havet','Ved L’Anse aux Meadows på Newfoundland finnes rester av en norrøn bosetning. Nordboere kom dit for rundt tusen år siden.',whc('L’Anse aux Meadows',4)),
      discovery('Dyr','Store flokker av bison','I Wood Buffalo nasjonalpark lever skogsbison. Det store dyret har kraftig kropp, horn og en tydelig pukkel over skuldrene.',whc('Wood Buffalo',256))
    ]),
    au:record('Korallrev og et operahus ved havnen','Utenfor Australia ligger Det store barriererevet, som gir hjem til mange sjødyr.',[
      discovery('Natur','Et levende rev','Det store barriererevet består av mange korallrev. Her lever et mangfold av fisker, koraller og andre dyr i havet.',whc('Great Barrier Reef',154)),
      discovery('Byggverk','Tak som ligner seil','Operahuset i Sydney har buede tak som kan minne om seil. Den danske arkitekten Jørn Utzon tegnet huset, som åpnet i 1973.',whc('Sydney Opera House',166)),
      discovery('Kultur','En klippe med stor betydning','Uluru er en stor sandsteinsklippe i det indre av Australia. Den har stor kulturell og åndelig betydning for anangu, urfolket i området.',whc('Uluru-Kata Tjuta',447))
    ]),
    nz:record('Fjellpapegøyer, vulkaner og fjorder','Kea er en papegøye som lever i fjellene på New Zealand.',[
      discovery('Dyr','En papegøye i fjellet','Kea lever i fjellområder på Sørøya. En papegøye trenger altså ikke å bo i en varm, tropisk skog.',teWahi),
      discovery('Kultur','Fjell som betyr noe spesielt','Vulkanfjellene i Tongariro er viktige i māorienes kultur og tro. Området er vernet både for naturen og den kulturelle betydningen.',whc('Tongariro',421)),
      discovery('Natur','Fjorder langt fra Norge','Sørvest på New Zealand finnes dype fjorder og høye fossefall. Også her har store isbreer formet landskapet.',teWahi)
    ])
  });
  function get(value){
    const id=String(typeof value==='object'&&value?(value.id||value.a2||''):value||'').toLowerCase();
    return Object.prototype.hasOwnProperty.call(entries,id)?entries[id]:null;
  }
  function coverage(ids){
    const all=[...new Set(ids.map(value=>String(value).toLowerCase()))].sort();
    const covered=all.filter(id=>get(id)),missing=all.filter(id=>!get(id));
    return {total:all.length,covered:covered.length,missing,complete:missing.length===0};
  }
  const api=Object.freeze({version:'20261015.1',reviewed,entries,get,coverage});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LARIA_COUNTRY_DISCOVERIES=api;
})(typeof window==='undefined'?null:window);
