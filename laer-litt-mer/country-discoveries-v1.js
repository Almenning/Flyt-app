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
    ]),
    al:record('Gamle teatre og stemmer som møtes','I Albania kan flere sangere lage ulike melodier og en lang, sammenhengende tone samtidig.',[
      discovery('Historie','Publikum satt på steintrinn','I oldtidsbyen Butrint finnes et gammelt gresk teater. Tilskuerne satt på steintrinn rundt scenen. Ruinene viser hvordan mennesker samlet seg til forestillinger.',whc('Butrint',570)),
      discovery('Kunst','Et bilde du kunne gå på','I Butrint er et gammelt dåpsrom dekorert med mosaikk på gulvet. Mange små biter er satt sammen til mønstre og bilder.',whc('Butrint',570)),
      discovery('Musikk','Ulike stemmer, én sang','I albansk flerstemt sang synger noen melodien, mens andre holder en lang tone under. Stemmer med ulike oppgaver blir til musikk sammen.',source('UNESCO: albansk flerstemt sang','https://ich.unesco.org/en/RL/albanian-folk-iso-polyphony-00155'))
    ]),
    ad:record('Isformede daler og et rundt kirketårn','I Andorra finnes en gammel kirke med et rundt tårn, i stedet for et firkantet.',[
      discovery('Natur','En dal skåret ut av is','Madriu-Perafita-Claror er en fjelldal i Pyreneene. Store isbreer har vært med på å forme dalen og de bratte sidene.',whc('Madriu-Perafita-Claror',1160)),
      discovery('Hverdagsliv','Sommerliv høyt i fjellet','I Madriu-dalen finnes gamle steinhytter og stier. De forteller om mennesker som tok husdyrene sine til beite i fjellene om sommeren.',whc('Madriu-Perafita-Claror',1160)),
      discovery('Byggverk','Et tårn uten hjørner','Kirken Santa Coloma har et rundt klokketårn. Tårnet har flere etasjer med åpninger, nesten som vinduer hele veien rundt.',source('Visit Andorra: Santa Coloma','https://visitandorra.com/nl/natuur-en-sport/church-of-santa-coloma/'))
    ]),
    at:record('Salt i fjellet og tog over dalene','Ved Semmering kjører jernbanen gjennom tunneler og over høye broer i fjellene.',[
      discovery('Historie','En skatt som smaker salt','I området rundt Hallstatt har mennesker hentet salt ut av fjellet i tusenvis av år. Saltet gjorde stedet viktig lenge før moderne butikker fantes.',whc('Hallstatt-Dachstein',806)),
      discovery('Oppfinnelser','Toget fant veien gjennom fjellet','Semmeringbanen ble bygget på 1800-tallet. Broer med høye buer og tunneler gjorde det mulig å føre jernbanen gjennom det bratte landskapet.',whc('Semmering Railway',785)),
      discovery('Musikk','En by med Mozart-spor','Komponisten Wolfgang Amadeus Mozart ble født i Salzburg. En komponist lager musikk. Mozart satte sterke spor i byens musikkhistorie.',whc('Salzburg',784))
    ]),
    by:record('Skogsbison og en borg fra flere tider','I Białowieża-skogen lever europeisk bison. Skogen strekker seg over både Belarus og Polen.',[
      discovery('Dyr','En tung skogsvandrer','Europeisk bison lever i Białowieża-skogen. Det er et stort, kraftig dyr med horn. Skogen er et viktig leveområde for arten.',whc('Białowieża Forest',33)),
      discovery('Natur','Liv i døde trær','I den gamle Białowieża-skogen får mange døde trær bli liggende. Død ved gir plass til blant annet sopp og smådyr. Et tre kan være nyttig også etter at det dør.',whc('Białowieża Forest',33)),
      discovery('Byggverk','En borg med flere lag av historie','Mir-borgen ble bygget om gjennom flere hundre år. Derfor har den deler fra forskjellige byggestiler. Et gammelt bygg kan fortelle om mer enn én tid.',whc('Mir Castle',625))
    ]),
    be:record('En kjempekrystall og tegneserier på veggene','I Brussel er tegneseriefigurer malt på store husvegger, ikke bare trykt i bøker.',[
      discovery('Forskning','En bitte liten form blir kjempestor','Atomium i Brussel består av ni store kuler som er bundet sammen. Bygget viser en kraftig forstørret modell av hvordan atomer kan være ordnet i jern.',source('Brussel kommune: Atomium','https://www.brussels.be/atomium')),
      discovery('Kunst','Tegneserier uten bok','I Brussel finnes store veggmalerier med tegneseriefigurer. Her kan en hel husvegg bli som en side i en tegneserie.',source('Visit Brussels: tegneseriebyen','https://www.visit.brussels/en/visitors/what-to-do/brussels-the-comic-strip-capital')),
      discovery('Hverdagsliv','Vannveier gjennom Brugge','Gjennom Brugge går kanaler mellom gamle bygninger. Vannveiene var viktige for handelen. I dag kan byen også ses fra små båter på kanalene.',source('Visit Bruges: kanalene','https://www.visitbruges.be/en/things-to-do/sightseeing/bruges-boat'))
    ]),
    ba:record('En bro i en bue og liv under bakken','I Vjetrenica-grotten finnes mange dyr som er tilpasset et liv under bakken.',[
      discovery('Byggverk','En steinbue over elven','Den gamle broen i Mostar strekker seg i en bue over elven Neretva. Etter at broen ble ødelagt, ble den bygget opp igjen.',whc('Mostar',946)),
      discovery('Dyr','Et eget dyreliv i mørket','Vjetrenica er en grotte med et rikt dyreliv under bakken. Mange av artene er spesielt tilpasset dette miljøet, langt fra sollyset.',whc('Vjetrenica Cave',1673)),
      discovery('Kunst','Mønstre som har vart i hundrevis av år','Stećci er store gravsteiner fra middelalderen. Noen er dekorert med bilder og mønstre. Slike steiner finnes også i flere av nabolandene.',whc('Stećci',1504))
    ]),
    bg:record('En rytter i fjellet og pelikaner ved vannet','Madara-rytteren er skåret inn i en bratt fjellvegg, høyt over bakken.',[
      discovery('Kunst','En hest som aldri løper videre','Ved Madara er en rytter og en hest skåret inn i berget. Bildet sitter høyt på en bratt fjellvegg og har vært der i over tusen år.',whc('Madara Rider',43)),
      discovery('Dyr','Pelikanenes innsjø','Ved innsjøen Srebarna hekker krøllpelikaner. De store fuglene er blant artene som gjør våtmarken til et viktig fugleområde.',whc('Srebarna',219)),
      discovery('Historie','Et kloster som ble reist på nytt','Rila-klosteret har en lang historie. En stor brann ødela mye på 1800-tallet, men bygningene ble reist på nytt. Derfor er ikke alle delene like gamle.',whc('Rila Monastery',216))
    ]),
    hr:record('Vann som bygger demninger og blonder av blader','På øya Hvar lages fine blonder av tråder fra agaveblader.',[
      discovery('Natur','Vannets egne demninger','Ved Plitvice legger vannet igjen kalk som bygger naturlige demninger. Slik dannes innsjøer og fossefall. Landskapet fortsetter å forandre seg.',whc('Plitvice Lakes',98)),
      discovery('Håndverk','Fra blad til blonde','På Hvar lager nonner blonder av tynne fibre fra agaveblader. Fibrene blir til fine tråder som formes til mønstre for hånd.',source('Stari Grad turistkontor: agaveblonder','https://www.visit-stari-grad.com/en/what-to-see/unesco-heritage/agave-lace/')),
      discovery('Historie','En handelsby ved Adriaterhavet','Dubrovnik var en viktig havneby der mennesker handlet varer. Gamle kirker, palasser og gater forteller om byens lange historie ved havet.',whc('Dubrovnik',95))
    ]),
    cy:record('Gulv med bilder og kirker med overraskelser','I Troodos-fjellene kan en enkel kirkebygning skjule vegger fulle av malerier.',[
      discovery('Kunst','Små biter lager store bilder','I Pafos finnes gamle mosaikker på gulvene. Små biter i ulike farger er satt tett sammen til bilder. Bildene har overlevd i mange hundre år.',whc('Paphos',79)),
      discovery('Byggverk','En fargerik innside','Noen av kirkene i Troodos-fjellene ser enkle ut utenfra. På innsiden er veggene dekket av malerier. Utsiden forteller ikke alltid hele historien!',whc('Painted Churches in Troodos',351)),
      discovery('Håndverk','Mønstre med nål og tråd','I Lefkara finnes en gammel tradisjon for å lage blonder og broderier. Geometriske mønstre, som former og linjer, sys for hånd i stoffet.',source('UNESCO: Lefkara-blonder','https://ich.unesco.org/es/RL/lefkara-laces-or-lefkaritika-00255'))
    ]),
    ee:record('Trestier over myra og tusenvis av sangstemmer','På sangfester i Estland samles svært mange mennesker for å synge sammen.',[
      discovery('Natur','En sti over den våte bakken','Ved Viru-myra går en tresti gjennom det våte landskapet. Fra stien kan man oppdage myra uten å måtte gå rett i den bløte bakken.',source('Visit Estonia: Viru nature trail','https://visitestonia.com/en/viru-nature-trail')),
      discovery('Musikk','Et kor større enn skolegården','Estland har store sangfester der tusenvis av sangere møtes. Kor øver hver for seg før de samles. Også Latvia og Litauen har denne tradisjonen.',source('UNESCO: baltiske sang- og dansefester','https://ich.unesco.org/en/RL/the-baltic-song-and-dance-celebrations-00087')),
      discovery('Historie','Kjøpmennenes gamle by','Gamlebyen i Tallinn har hus fra middelalderen. Byen var et viktig handelssted, og mange av bygningene forteller om kjøpmennene som bodde og arbeidet der.',whc('Tallinn',822))
    ]),
    gr:record('Gamle idrettsleker og klostre på steinsøyler','Ved Meteora står klostre på toppen av høye klipper, nesten som hus oppe på steinsøyler.',[
      discovery('Idrett','Før dagens olympiske leker','I Olympia ble det arrangert idrettsleker i oldtidens Hellas. Der finnes rester av anlegg som ble brukt av idrettsutøverne for svært lenge siden.',whc('Olympia',517)),
      discovery('Byggverk','Hus høyt over bakken','Ved Meteora er klostre bygget på toppen av høye klippeformasjoner. Landskapet viser hvordan mennesker fant uvanlige steder å bygge på.',whc('Meteora',455)),
      discovery('Oppfinnelser','Tannhjul som fulgte himmelen','Antikythera-mekanismen er en gammel gresk maskin med tannhjul. Den ble brukt til å følge himmelens bevegelser og beregne astronomiske hendelser.',source('Hellas nasjonale arkeologiske museum: Antikythera','https://antikythera-mechanism.namuseum.gr/en/what-is-the-mechanism-and-what-does-it-consist-of/'))
    ]),
    hu:record('En fargerik kube og varmt vann fra bakken','Rubiks kube ble laget av den ungarske oppfinneren Ernő Rubik.',[
      discovery('Oppfinnelser','Kan du få fargene til å passe?','Ernő Rubik laget Rubiks kube i 1974. Delene kan dreies uten at kuben faller fra hverandre. Målet i puslespillet er å samle én farge på hver side.',source('Rubiks: kubens historie','https://rubiks.com/history')),
      discovery('Natur','En vid slette med beitedyr','Hortobágy er et stort slettelandskap. Her har mennesker holdt husdyr på beite gjennom lang tid. Dyr og gjetere er en del av områdets historie.',whc('Hortobágy',474)),
      discovery('Hverdagsliv','Bad over varme kilder','Rudas-badet i Budapest er bygget over varme kilder. Vannet varmes opp under bakken. Mennesker har brukt slike kilder til bading i flere hundre år.',source('Budapest turistkontor: Rudas','https://www.budapestinfo.hu/en/rudas-medicinal-bath-and-swimming-pool-en'))
    ]),
    ie:record('Vintersol i et gammelt rom og en rask balllek','Ved Newgrange kan vintersolen lyse gjennom en åpning og inn i et gammelt gravkammer.',[
      discovery('Historie','Solen finner en hemmelig åpning','Ved vintersolverv kan sollyset nå inn i gravkammeret i Newgrange. Lyset kommer gjennom en åpning over inngangen. Bygget er flere tusen år gammelt.',source('World Heritage Ireland: Newgrange','https://www.worldheritageireland.ie/world-heritage-properties/bru-na-boinne/historical-background/')),
      discovery('Idrett','En liten ball og en trekølle','Hurling er en irsk lagidrett. Spillerne bruker trekøller og en liten ball. De prøver å slå ballen mellom motstanderens målstolper.',source('UNESCO: hurling','https://ich.unesco.org/fr/RL/le-hurling-01263')),
      discovery('Dyr','Fugleliv på en bratt øy','Skellig Michael er en bratt øy ute i havet. Mange sjøfugler hekker der. Klippene er både et gammelt kultursted og et viktig hjem for fugler.',whc('Skellig Michael',757))
    ]),
    lv:record('Hoppende fisk og et skap fullt av sanger','I Kuldīga hopper fisk opp det lave fossefallet i elven Venta på vandringen sin.',[
      discovery('Dyr','Fisk på vei oppover','Ved Venta-fossen i Kuldīga kan fisk hoppe oppover gjennom det strømmende vannet. Det er en del av vandringen deres, ikke fisk som egentlig kan fly.',source('Latvia Travel: Venta Waterfall','https://www.latvia.travel/en/sight/venta-waterfall')),
      discovery('Kultur','Et skap med hundretusener av lapper','Dainu skapis er et skap der gamle latviske folkesanger ble samlet på små, håndskrevne lapper. Samlingen hjelper oss å huske sanger fra tidligere tider.',source('UNESCO: Cabinet of Folksongs','https://www.unesco.org/en/memory-world/dainu-skapis-cabinet-folksongs')),
      discovery('Byggverk','Rigas pyntede hus','Riga har mange bygninger i stilen som kalles jugendstil. Husene er kjent for sin rike utsmykning. En vanlig bygate kan derfor romme mye å se på.',whc('Riga',852))
    ]),
    li:record('Et frimerke av tråd og en bro med tak','Liechtenstein har gitt ut et brodert frimerke. Et frimerke trenger altså ikke bare å være trykt på papir.',[
      discovery('Håndverk','Post med sting','I 2019 ga Liechtenstein ut et brodert frimerke. Mønsteret var laget med tråd. Landets postmuseum forteller om slike uvanlige frimerker.',source('Liechtensteins nasjonalmuseum: postmuseet','https://www.landesmuseum.li/en/our-museums/postalmuseum')),
      discovery('Byggverk','En trebro med eget tak','Den gamle trebroen over Rhinen forbinder Vaduz med Sevelen i Sveits. Broen har tak, nesten som et langt hus over elven.',source('Liechtenstein Tourism: den gamle Rhinbroen','https://en.tourismus.li/map/poi/alte-rheinbrucke-e5935511-7115-400a-942f-e7a4911f3b58.html')),
      discovery('Historie','Borgen over Vaduz','Vaduz slott ligger oppe i en skråning over byen. Den gamle borgen er et kjent landemerke som er lett å få øye på nedenfra.',source('Liechtenstein Tourism: Vaduz slott','https://en.tourismus.li/map/poi/schloss-vaduz-8fb7e6cf-99b5-4ffb-b600-9e4c66398e1f.html'))
    ]),
    lt:record('Flyttende sand og utskårne trekors','På Den kuriske landtungen har mennesker plantet skog for å holde sanden på plass.',[
      discovery('Natur','Hvordan stopper man sand?','På Den kuriske landtungen kan vinden flytte sanddynene. Mennesker har plantet skog og andre planter for å binde sanden og beskytte bebyggelsen.',whc('Curonian Spit',994)),
      discovery('Håndverk','Kors med mange detaljer','I Litauen finnes en tradisjon for å skjære store kors av eik. De kan være rikt dekorert, blant annet med små tak og utskårne mønstre.',source('UNESCO: litauisk korshåndverk','https://ich.unesco.org/en/RL/cross-crafting-and-its-symbolism-00013')),
      discovery('Historie','En by med mange byggestiler','I Vilnius står bygninger fra flere hundreår side om side. Her finnes blant annet gotiske, barokke og klassiske bygg. Gamlebyen viser hvordan byen har vokst gjennom tiden.',whc('Vilnius',541))
    ]),
    lu:record('En steinsopp og flere språk i hverdagen','I Luxemburg finnes en sandsteinsklippe som kalles Champignon, fordi den ligner en sopp.',[
      discovery('Natur','En sopp som er laget av stein','Klippen Champignon har en bred topp og en smalere del under. Den mykere steinen nederst er blitt slitt raskere bort. Derfor ligner klippen en sopp.',source('Visit Luxembourg: Champignon','https://www.visitluxembourg.com/place/rock-formation-champignon')),
      discovery('Språk','Flere språk rundt samme bord','Luxemburgsk, fransk og tysk er viktige språk i Luxemburg. I hverdagen kan mennesker møte flere språk, for eksempel på jobb, i skolen og i butikkene.',source('Luxemburgs myndigheter: språk','https://luxembourg.public.lu/en/society-and-culture/languages/languages-spoken-luxembourg.html')),
      discovery('Historie','Byen som var en festning','Gamle deler av byen Luxemburg ligger ved bratte skrenter. Her bygget mennesker sterke festningsverk. Rester av dem er bevart sammen med den gamle byen.',whc('Luxembourg City',699))
    ]),
    mt:record('Templer av store steiner og rom under bakken','På Malta finnes et gammelt byggverk der rommene ble hugget ut under bakken.',[
      discovery('Historie','Byggverk eldre enn mange land','På Malta og naboøya Gozo står forhistoriske templer av store steiner. De ble bygget for flere tusen år siden. Noen av steinblokkene er svært store.',whc('Megalithic Temples of Malta',132)),
      discovery('Byggverk','Rom hugget ut av fjellet','Ħal Saflieni er et gammelt underjordisk gravsted. Rom og ganger ble hugget rett ut av kalksteinen. Takene noen steder etterligner byggverk over bakken.',whc('Ħal Saflieni Hypogeum',130)),
      discovery('Byliv','Gater som et rutenett','Valletta ble planlagt med gater i et rutenett. Mange gater krysser hverandre som linjene på rutepapir. Byen ligger på en halvøy.',whc('Valletta',131))
    ]),
    md:record('Vårpynt og et punkt som hjalp oss å måle jorden','I Moldova gis små røde og hvite Mărțișor-pynteting som en hilsen til våren.',[
      discovery('Tradisjoner','Rød og hvit vårhilsen','Den første mars gir mange mennesker i Moldova små pynteting med røde og hvite tråder. De kalles Mărțișor og markerer at våren er på vei.',source('Moldovas turistmyndighet: Mărțișor','https://turism.gov.md/en/events/martisor/')),
      discovery('Byggverk','Et kloster inne i en hule','I Orheiul Vechi finnes et kloster i en hule. Området har også mange andre spor etter mennesker som har levd der gjennom svært lang tid.',source('Orheiul Vechi kultur- og naturreservat','https://orheiulvechi.com/en/tourism/')),
      discovery('Forskning','Et lite merke, en stor måling','I Moldova finnes et målepunkt i Struves meridianbue. På 1800-tallet brukte landmålere slike punkter gjennom flere land for å undersøke jordens størrelse og form.',whc('Struve Geodetic Arc',1187))
    ]),
    mc:record('Hjelp til havskilpadder og en japansk hage','I Monaco får skadde havskilpadder hjelp ved det oseanografiske museets behandlingssenter.',[
      discovery('Dyr','Et behandlingssted for skilpadder','Ved havmuseet i Monaco finnes et senter som tar imot skadde havskilpadder. Fagfolk hjelper dem, med mål om at de skal kunne vende tilbake til havet.',source('Monacos oseanografiske museum: havskilpadder','https://musee.oceano.org/en/the-sea-turtle-odyssey/')),
      discovery('Natur','Koraller er levende','I akvariet i Monaco blir levende koraller tatt vare på og dyrket. Koraller er ikke bare fargerike steiner. De er dyr som kan danne store rev.',source('Monacos oseanografiske museum: koraller','https://musee.oceano.org/en/aquariums/aquariums-corail/')),
      discovery('Hager','En liten bit av japansk hagekunst','Monaco har en japansk hage med dam, broer og et tehus. Hagen ble utformet av den japanske landskapsarkitekten Yasuo Beppu.',source('Regionalt turistkontor: Monacos japanske hage','https://provence-alpes-cotedazur.com/en/things-to-do/culture-and-heritage/places/jardin-japonais-monaco-en-3340019/'))
    ]),
    me:record('Dype elvekløfter og innsjøer etter isen','I Durmitor-fjellene ligger innsjøer i et landskap som ble formet av isbreer.',[
      discovery('Natur','Isens spor i fjellet','Durmitor har høye fjell og innsjøer som isbreer har vært med på å forme. Selv etter at isen forsvinner, kan landskapet vise hvor den har vært.',whc('Durmitor',100)),
      discovery('Geologi','Elven langt der nede','Elven Tara renner gjennom en dyp kløft med bratte sider. Vannet har vært med på å skjære seg ned i berget gjennom svært lang tid.',whc('Durmitor',100)),
      discovery('Historie','En gammel by ved bukten','Kotor er en gammel havneby ved en bukt i Adriaterhavet. Byen har kirker og andre byggverk som forteller om livet ved havet i tidligere tider.',whc('Kotor',125))
    ]),
    nl:record('Vindmøller som pumper og planeter i taket','I Franeker bygget Eise Eisinga en modell av solsystemet i taket hjemme i stuen sin.',[
      discovery('Oppfinnelser','Vind som flytter vann','Ved Kinderdijk ble vindmøller brukt til å pumpe vann ut av lave landområder. Vinden kunne altså hjelpe mennesker med å holde bakken tørr.',whc('Kinderdijk-Elshout',818)),
      discovery('Landskap','Åkrer der det var en innsjø','Beemster var en innsjø før vannet ble pumpet ut på 1600-tallet. Mennesker gjorde området om til jordbruksland med rette veier og kanaler.',whc('Beemster',899)),
      discovery('Forskning','Solsystemet i stuetaket','Eise Eisinga bygget et planetarium i taket i stuen sin i Franeker. Små modeller viser hvordan planetene beveger seg rundt solen. Arbeidet startet i 1774.',source('Eise Eisinga Planetarium','https://www.eisinga-planetarium.nl/en/the-planetarium/'))
    ]),
    mk:record('Sjøliv i Ohrid og dans med raske fottrinn','I Ohridsjøen finnes dyr og planter som ikke lever naturlig noe annet sted.',[
      discovery('Dyr','Et helt spesielt liv under vann','Ohridsjøen har levd som innsjø gjennom svært lang tid. Her finnes mange arter som bare hører hjemme i denne sjøen, blant annet særegne fisker og smådyr.',whc('Ohrid Region',99)),
      discovery('Kunst','Gamle bilder i Ohrid','Byen Ohrid har gamle kirkemalerier og mosaikker. Bildene forteller om håndverk og kunst fra ulike tider. Mange er laget lenge før fotografiet fantes.',whc('Ohrid Region',99)),
      discovery('Dans','Fottrinn som følger hverandre','Kopachkata er en dans fra landsbyen Dramche. Danserne står sammen i en halvsirkel og holder i hverandres belter. Føttene beveger seg raskt og rytmisk.',source('UNESCO: Kopachkata','https://ich.unesco.org/en/decisions/9.COM/10.43'))
    ]),
    pl:record('Rom av salt og en by som ble bygget opp igjen','I saltgruvene ved Wieliczka finnes rom og utsmykning som er skåret ut i salt.',[
      discovery('Håndverk','En sal av salt','I Wieliczka finnes underjordiske rom, kapeller og figurer laget av salt. Gruvearbeidere formet mer enn bare tunneler i fjellet.',whc('Wieliczka and Bochnia Salt Mines',32)),
      discovery('Forskning','En stjerneforskers fødeby','Astronomen Nikolai Kopernikus ble født i Toruń. En astronom undersøker verdensrommet. I byen står mange bygninger fra middelalderen fortsatt.',whc('Toruń',835)),
      discovery('Historie','Gamlebyen som fikk en ny start','Store deler av Warszawas gamleby ble ødelagt under andre verdenskrig. Etterpå bygget mennesker hus og gater opp igjen, slik at den gamle byen kunne få nytt liv.',whc('Warsaw',30))
    ]),
    pt:record('Et fantasifullt slott og en gammel skogtype','På Madeira finnes laurbærskog av en type som dekket mye større områder for svært lenge siden.',[
      discovery('Byggverk','Et slott med blandede former','Pena-palasset i Sintra blander flere forskjellige byggestiler. Det har tårn og former som kan få det til å ligne et eventyrslott.',whc('Sintra',723)),
      discovery('Natur','En skog fra en annen tid','Laurbærskogen på Madeira er en rest av en skogtype som var mer utbredt for millioner av år siden. Det betyr ikke at hvert enkelt tre er millioner av år gammelt!',whc('Laurisilva of Madeira',934)),
      discovery('Historie','Tårnet ved elven','Belém-tårnet står ved elven Tejo i Lisboa. Det ble bygget for å være med på å beskytte havnen. Skip seilte forbi på vei mellom elven og havet.',whc('Belém',263))
    ]),
    ro:record('Fugleliv i elvedeltaet og høye tretårn','Der Donau møter Svartehavet, finnes innsjøer, våtmarker og et rikt fugleliv.',[
      discovery('Dyr','Elvens store fugleområde','Donau deler seg i flere løp før den når Svartehavet. I deltaet finnes innsjøer og våtmarker som gir mat og leveområder til mange fuglearter.',whc('Danube Delta',588)),
      discovery('Byggverk','Tårn som strekker seg opp fra trehus','I Maramureș finnes gamle trekirker med høye, smale klokketårn. Byggene viser hva dyktige håndverkere kunne lage av tre.',whc('Wooden Churches of Maramureș',904)),
      discovery('Historie','Spor etter et gammelt rike','I Orăștie-fjellene finnes rester av dakiske festninger. De er rundt to tusen år gamle og forteller om et rike som fantes før romerne tok området.',whc('Dacian Fortresses',906))
    ]),
    ru:record('En dyp innsjø og vulkaner ved isbreene','På Kamtsjatka finnes både aktive vulkaner og isbreer i samme landskap.',[
      discovery('Natur','Verdens dypeste innsjø','Bajkalsjøen er verdens dypeste innsjø. Den inneholder svært mye ferskvann og er også en av jordens eldste innsjøer.',whc('Lake Baikal',754)),
      discovery('Geologi','Varmt fjell møter kald is','På halvøya Kamtsjatka finnes mange aktive vulkaner. Her finnes også isbreer. Både varme fra jordens indre og is er med på å forme landskapet.',whc('Volcanoes of Kamchatka',765)),
      discovery('Byggverk','Trekunst på en øy','På øya Kizji i Onegasjøen står gamle trekirker og et klokketårn. Byggene viser hvordan snekkere kunne lage store og kompliserte former av tre.',whc('Kizhi Pogost',544))
    ]),
    sm:record('Tre tårn og et lite land inne i Italia','San Marino er et eget land, selv om det er omgitt av Italia på alle kanter.',[
      discovery('Geografi','Et land inni et annet','San Marino er omgitt av Italia. Når du følger landegrensen hele veien rundt, er Italia alltid på den andre siden. Likevel er San Marino et selvstendig land.',source('Visit San Marino: territoriet','https://www.visitsanmarino.com/pub1/VisitSM/en/contenuto/About-San-Marino/POPOLAZIONE-E-TERRITORIO.html')),
      discovery('Byggverk','Tre tårn på fjellet','Guaita, Cesta og Montale er tre gamle tårn på Monte Titano. Tårnene har vært viktige for å passe på området og er kjente symboler for landet.',source('Visit San Marino: Montale og de tre tårnene','https://www.visitsanmarino.com/pub1/VisitSM/en/luogo/Arte-e-cultura/Terza-Torre-Montale.html')),
      discovery('Historie','En liten republikk med lang historie','San Marino har vært en selvstyrt republikk siden middelalderen. Gamle bygninger i byen og på Monte Titano forteller om denne lange historien.',whc('San Marino and Mount Titano',1245))
    ]),
    rs:record('En elv mellom klippene og dans hånd i hånd','Den serbiske dansen kolo samler mennesker i en kjede eller ring.',[
      discovery('Natur','Donau mellom høye fjellsider','I Đerdap renner Donau gjennom store kløfter. Bratte fjellsider står rundt elven. Vannet og berget har sammen formet det markerte landskapet.',source('UNESCO: Djerdap Geopark','https://www.unesco.org/en/iggp/djerdap-unesco-global-geopark')),
      discovery('Dans','En ring som beveger seg sammen','Når mennesker danser kolo, holder de gjerne hverandre i hendene og danner en kjede eller ring. De følger de samme rytmiske bevegelsene sammen.',source('UNESCO: kolo','https://ich.unesco.org/en/RL/kolo-traditional-folk-dance-01270')),
      discovery('Historie','Mennesker ved elven for lenge siden','Ved Lepenski Vir finnes spor etter mennesker som bodde ved Donau for rundt åtte tusen år siden. Funnene hjelper oss å forstå livet deres.',source('UNESCO: Djerdap og Lepenski Vir','https://www.unesco.org/en/iggp/djerdap-unesco-global-geopark'))
    ]),
    sk:record('Is i grotter og steiner som ligner blomster','I Ochtinská-grotten vokser mineralet aragonitt i former som kan ligne små blomster.',[
      discovery('Natur','Is under bakken','Dobšinská er en isgrotte. Inne i grotten finnes store ismasser. En grotte kan altså romme mer enn bare bar stein.',whc('Caves of Aggtelek Karst and Slovak Karst',725)),
      discovery('Geologi','Blomster som ikke er planter','I Ochtinská-grotten finnes aragonitt i nåler og andre fine former. Aragonitt er et mineral. Selv om formene kan ligne blomster, vokser det ingen blomster der av steinen.',source('Slovak Caves Administration: Ochtinská','https://www.ssj.sk/en/jaskyna/12-ochtinska-aragonite-cave')),
      discovery('Hverdagsliv','En landsby av tømmer','Vlkolínec er en gammel landsby med tradisjonelle trehus. Husene viser hvordan mennesker bygget og bodde i fjellområdene tidligere.',whc('Vlkolínec',622))
    ]),
    si:record('Fossefall under bakken og pyntede bikuber','I Slovenia finnes en tradisjon for å male små bilder på frontene av bikuber.',[
      discovery('Natur','En elv i mørket','Škocjan-grottene har store rom og vann som renner under bakken. Der finnes også underjordiske fossefall. Noen landskap skjuler seg helt under føttene våre.',whc('Škocjan Caves',390)),
      discovery('Håndverk','Bier med bilder på huset','Slovenske birøktere har en tradisjon for å pynte bikubefronter med malte bilder. En bikube kan derfor være både hjem for bier og et lite kunstverk.',source('UNESCO: birøkt i Slovenia','https://ich.unesco.org/en/RL/beekeeping-in-slovenia-a-way-of-life-01857')),
      discovery('Dyr','Mørke føll som blir lyse','Lipizzanerhester forbindes med Lipica i Slovenia. Mange er lysegrå som voksne, men føllene blir født med mørk pels. Fargen forandrer seg når de vokser.',source('Lipica stutteri: lipizzanerhesten','https://www.lipica.org/en/lipizzan-horses/'))
    ]),
    ua:record('Egg med voksmønstre og fargerike blomstermalerier','I ukrainsk eggkunst brukes voks for å lage mønstre før eggene farges.',[
      discovery('Håndverk','Et egg med hemmelige streker','Pysanka er ukrainsk eggkunst. Mønstre tegnes med voks før egget farges. Voksen beskytter deler av skallet, slik at mønsteret trer frem.',source('UNESCO: pysanka','https://ich.unesco.org/en/RL/pysanka-ukrainian-tradition-and-art-of-decorating-eggs-02134')),
      discovery('Kunst','Blomster som aldri visner','Petrykivka er en ukrainsk maletradisjon med fargerike former fra naturen. Blomster og andre motiver kan dekorere både vegger og gjenstander.',source('UNESCO: Petrykivka','https://ich.unesco.org/en/RL/petrykivka-decorative-painting-as-a-phenomenon-of-the-ukrainian-ornamental-folk-art-00893')),
      discovery('Historie','Bilder fra middelalderen i Kyiv','Sofiakatedralen i Kyiv har mosaikker og veggmalerier fra 1000-tallet. Små fargede biter og malte bilder forteller om kunst fra nesten tusen år tilbake.',whc('Kyiv: Saint-Sophia Cathedral',527))
    ]),
    va:record('Et helt land i Roma og malerier i taket','Vatikanstaten er et eget lite land som ligger inne i byen Roma.',[
      discovery('Geografi','Et land inne i en by','Midt i Roma ligger Vatikanstaten. Selv om du fortsatt er omgitt av den italienske byen, er dette området et eget land.',whc('Vatican City',286)),
      discovery('Byggverk','En plass omfavnet av søyler','Rundt Petersplassen står lange rekker av søyler. De danner store buer rundt plassen. Sett ovenfra kan de minne om armer som åpner seg.',whc('Vatican City',286)),
      discovery('Kunst','Se opp i taket!','Michelangelo malte taket i Det sixtinske kapell fra 1508 til 1512. De store bildene er malt høyt over gulvet, ikke på lerreter som henger på veggen.',source('Vatikanmuseene: Det sixtinske kapell','https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/cappella-sistina/storia-cappella-sistina.html'))
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
  const api=Object.freeze({version:'20261015.2',reviewed,entries,get,coverage});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.LARIA_COUNTRY_DISCOVERIES=api;
})(typeof window==='undefined'?null:window);
