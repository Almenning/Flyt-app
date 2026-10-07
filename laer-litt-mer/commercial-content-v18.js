(function(){
  'use strict';

  const CURRICULUM={norwegian:'NOR01-08',math:'MAT01-06',english:'ENG01-06'};

  function choice(subject,skill,prompt,answer,options,extra={}){
    const answerText=String(answer);
    const opts=[answerText,...(options||[]).map(String)].filter((v,i,a)=>a.indexOf(v)===i);
    return Object.assign({subject,skill,type:'learning-choice',prompt,answer:answerText,options:opts,curriculum:CURRICULUM[subject]},extra);
  }
  function number(skill,prompt,answer,extra={}){
    return Object.assign({subject:'math',skill,type:'number-input',prompt,answer:String(answer),curriculum:CURRICULUM.math},extra);
  }
  function sentence(skill,prompt,answer,words,extra={}){
    return Object.assign({subject:'english',skill,type:'sentence-order',prompt,answer,words:words.slice(),curriculum:CURRICULUM.english},extra);
  }
  function bucketed(module,buckets){
    if(module&&buckets[module])return buckets[module].slice();
    return Object.values(buckets).flat();
  }

  function norwegian(grade,module){
    const buckets={reading:[],spelling:[],language:[]};
    const addReading=(skill,passage,prompt,answer,options)=>buckets.reading.push(choice('norwegian',skill,prompt,answer,options,{passage}));

    if(grade<=2){
      [
        ['Lina tar på seg støvler. Det ligger store vanndammer utenfor.','Hvorfor tar Lina trolig på seg støvler?','Det er vått ute',['Hun skal legge seg','Hun skal bade inne']],
        ['Omar legger en bok og en matpakke i sekken. Så går han mot skolen.','Hvor tror du Omar skal?','På skolen',['På kino','Til stranden']],
        ['Sofie blåser på kakaoen før hun drikker.','Hva kan vi forstå om kakaoen?','Den er varm',['Den er frossen','Den er tom']],
        ['Noah ser på klokka og løper mot busstoppet.','Hvorfor løper Noah trolig?','Han vil rekke bussen',['Han vil hente en ball','Han skal sove']],
        ['Mina åpner paraplyen idet mørke skyer kommer nærmere.','Hva tror Mina kan skje?','Det kan begynne å regne',['Det blir helt vindstille','Sola går opp inne']],
        ['Leo hvisker fordi babyen sover.','Hvorfor hvisker Leo?','Han vil ikke vekke babyen',['Han har mistet stemmen','Han er ute i storm']]
      ].forEach(([p,q,a,o])=>addReading('reading-inference',p,q,a,o));
    }else if(grade<=4){
      [
        ['Amir trener på samme pianostykke hver dag. Etter en uke spiller han det uten stopp.','Hva har Amir øvd på?','Et pianostykke',['En fotballkamp','En oppskrift']],
        ['Biblioteket stenger klokken seks. Nora kommer fem på seks og låner en bok.','Hva rekker Nora før biblioteket stenger?','Å låne en bok',['Å se en film','Å spise middag']],
        ['Klassen planter frø i små potter. De vanner dem og setter dem i vinduet.','Hva gjør klassen etter at frøene er plantet?','De vanner dem',['De fryser dem','De kaster dem']],
        ['Mikkel finner et kart før familien går tur i skogen.','Hva tar Mikkel med for å finne veien?','Et kart',['En tallerken','En pute']]
      ].forEach(([p,q,a,o])=>addReading('reading-comprehension',p,q,a,o));
      [
        ['En liten bekk kan virke ubetydelig, men mange bekker blir til større elver. Vann fra små steder kan derfor påvirke områder langt unna.','Hva er hovedpoenget?','Små bekker kan bli del av store vannsystemer',['Alle bekker er like dype','Elver finnes bare i fjellet']],
        ['Å øve litt hver dag kan være lettere enn å øve lenge én gang. Hyppig trening gjør det enklere å huske det man lærer.','Hva er hovedpoenget?','Jevn øving kan hjelpe læring',['Man bør aldri ta pauser','Lange økter er alltid best']],
        ['Trær gir skygge, binder jord og gir dyr steder å bo. Derfor kan ett tre ha flere viktige oppgaver i naturen.','Hva er hovedpoenget?','Trær har flere funksjoner i naturen',['Alle dyr bor i trær','Skygge er trærnes eneste oppgave']],
        ['Når vi leser en oppskrift først, vet vi hvilke ingredienser og trinn som kommer. Det kan gjøre matlagingen enklere.','Hva er hovedpoenget?','Forberedelse kan gjøre en oppgave enklere',['Oppskrifter gjør maten kald','Ingredienser er alltid like']]
      ].forEach(([p,q,a,o])=>addReading('reading-main-idea',p,q,a,o));
    }else if(grade<=7){
      [
        ['Reklamen viser først en rotete pult og deretter samme pult helt ryddig etter at produktet er brukt.','Hvilket virkemiddel brukes tydeligst?','Kontrast før og etter',['Fotnote','Rim uten betydning']],
        ['Forfatteren gjentar setningen «Vi kan gjøre noe» tre ganger i talen.','Hva gjør gjentakelsen?','Den fremhever budskapet',['Den skjuler temaet','Den gjør teksten til en tabell']],
        ['Artikkelen åpner med et spørsmål: «Hva ville du gjort uten rent vann?»','Hva kan spørsmålet gjøre?','Få leseren til å tenke seg inn i temaet',['Bevise alle fakta alene','Erstatte alle kilder']],
        ['Novellen beskriver vinden som om den «banker sint på vinduet».','Hvilket virkemiddel er dette?','Besjeling',['Kildehenvisning','Oppramsing av årstall']],
        ['Talen bruker ordene «sammen», «vi» og «fellesskap» mange ganger.','Hva kan ordvalget bidra til?','Skape følelse av fellesskap',['Gjøre teksten matematisk','Fjerne standpunktet']],
        ['Teksten starter rolig, men setningene blir kortere når konflikten nærmer seg.','Hva kan de kortere setningene gjøre?','Øke tempo og spenning',['Forklare en kilde automatisk','Gjøre teksten til et dikt']]
      ].forEach(([p,q,a,o])=>addReading('reading-rhetoric',p,q,a,o));
    }else{
      [
        ['Et innlegg argumenterer for senere skolestart. Det viser til søvnforskning, men understreker også at transport og fritidsaktiviteter må vurderes.','Hva er hovedideen?','Senere skolestart kan ha fordeler, men flere hensyn må vurderes',['Transport er uviktig','Søvnforskning avgjør alle spørsmål alene']],
        ['En rapport finner lavere energibruk etter at bygget ble isolert. Rapporten sier samtidig at vinteren var mildere enn året før.','Hva er hovedideen?','Resultatet er lovende, men andre forhold kan også ha påvirket det',['Isolasjon virker aldri','Vær kan ikke påvirke energibruk']],
        ['To kilder beskriver samme hendelse ulikt. Den ene var til stede, mens den andre bygger på en anonym kommentar flere dager senere.','Hva er hovedideen?','Kilder bør vurderes etter hvor direkte og etterprøvbare de er',['Anonyme kommentarer er alltid best','Alle kilder er like sterke']],
        ['Teksten hevder at ungdom bruker mer tid på skjerm, men skiller mellom skolearbeid, kommunikasjon og underholdning.','Hva er hovedideen?','Skjermtid bør forstås ut fra hva tiden brukes til',['All skjermtid er identisk','Skolearbeid er ikke skjermtid']]
      ].forEach(([p,q,a,o])=>addReading('reading-main-idea',p,q,a,o));
    }
    return bucketed(module,buckets);
  }

  function math(grade,module){
    const buckets={numbers:[],fractions:[],geometry:[],algebra:[]};
    if(grade<5)return [];

    const add=(bucket,skill,prompt,answer)=>buckets[bucket].push(number(skill,prompt,answer));
    const six=[0,1,2,3,4,5];

    if(grade===5){
      six.forEach(i=>{
        const a=24+i*7,b=3+(i%4),prod=a*b;
        add('numbers','multiplication',a+' × '+b+' = ?',prod);
        add('numbers','division',(prod)+' ÷ '+b+' = ?',a);
        add('numbers','large-numbers',(3200+i*450)+' + '+(700+i*125)+' = ?',(3200+i*450)+(700+i*125));
        const d1=(15+i*3)/10,d2=(8+i)/10;
        add('numbers','decimals',String(d1).replace('.',',')+' + '+String(d2).replace('.',',')+' = ?',String((d1+d2).toFixed(1)).replace('.',','));

        const totals=[40,60,80,100,120,140],dens=[2,3,4,5,6,7],nums=[1,2,3,2,5,3];
        add('fractions','fractions','Hva er '+nums[i]+'/'+dens[i]+' av '+totals[i]+'?',totals[i]*nums[i]/dens[i]);
        const pct=[10,20,25,40,50,75][i],base=[250,300,400,500,160,200][i];
        add('fractions','percent','Hva er '+pct+' % av '+base+'?',base*pct/100);
        const fd1=(i+2)/10,fd2=(i+1)/10;
        add('fractions','decimals',String(fd1).replace('.',',')+' + '+String(fd2).replace('.',',')+' = ?',String((fd1+fd2).toFixed(1)).replace('.',','));

        const w=5+i,h=3+(i%3);
        add('geometry','area','Et rektangel er '+w+' cm × '+h+' cm. Hva er arealet?',w*h);
        add('geometry','perimeter','Et rektangel er '+w+' cm × '+h+' cm. Hva er omkretsen?',2*(w+h));
        const a1=35+i*5,a2=65-i*2;
        add('geometry','angles','En trekant har vinklene '+a1+'° og '+a2+'°. Hvor stor er den siste vinkelen?',180-a1-a2);
        const meters=2+i;
        add('geometry','units',meters+' meter er hvor mange centimeter?',meters*100);
      });
    }else if(grade===6){
      six.forEach(i=>{
        const d1=(32+i*7)/10,d2=(11+i*2)/10;
        add('numbers','decimals',String(d1).replace('.',',')+' − '+String(d2).replace('.',',')+' = ?',String((d1-d2).toFixed(1)).replace('.',','));
        const divisor=4+i,result=18+i*3;
        add('numbers','division',(divisor*result)+' ÷ '+divisor+' = ?',result);
        const m1=36+i*6,m2=7+(i%4);
        add('numbers','multiplication',m1+' × '+m2+' = ?',m1*m2);
        const x=5+i,y=3+(i%3),z=2+i;
        add('numbers','order',x+' + '+y+' × '+z+' = ?',x+y*z);

        const total=24+i*6,den=[2,3,4,3,5,6][i],num=[1,2,3,1,2,5][i];
        const adjusted=total-(total%den);
        add('fractions','fractions','Hva er '+num+'/'+den+' av '+adjusted+'?',adjusted*num/den);
        const pct=[10,15,20,25,30,40][i],base=[360,400,250,320,500,450][i];
        add('fractions','percent','Hva er '+pct+' % av '+base+'?',base*pct/100);
        const left=2+i,right=3+i,totalRight=(left*6/left)*right;
        add('fractions','ratio','Forholdet er '+left+':'+right+'. Hvis første del er '+(left*6)+', hvor stor er den andre?',right*6);

        const w=6+i,h=4+(i%3);
        add('geometry','area','Et parallellogram har grunnlinje '+w+' cm og høyde '+h+' cm. Arealet?',w*h);
        add('geometry','perimeter','Et rektangel er '+w+' cm langt og '+h+' cm bredt. Omkretsen?',2*(w+h));
        add('geometry','units',String((1.2+i*.3).toFixed(1)).replace('.',',')+' km er hvor mange meter?',Math.round((1.2+i*.3)*1000));
        const a1=42+i*4,a2=58+i*2;
        add('geometry','angles','To vinkler i en trekant er '+a1+'° og '+a2+'°. Den siste?',180-a1-a2);
        const side=2+i;
        add('geometry','volume','En kube har side '+side+' cm. Volumet?',side*side*side);
      });
    }else if(grade===7){
      six.forEach(i=>{
        const neg=-(4+i),pos=9+i*2;
        add('numbers','negative',neg+' + '+pos+' = ?',neg+pos);
        const vals=[4+i,6+i,8+i];
        add('numbers','statistics','Hva er gjennomsnittet av '+vals.join(', ')+'?',vals.reduce((a,b)=>a+b,0)/3);
        const base=2+(i%3),exp=2+(i%2);
        add('numbers','powers',base+(exp===2?'²':'³')+' = ?',Math.pow(base,exp));

        const pct=[10,15,20,25,30,40][i],price=[300,400,500,600,700,800][i];
        add('fractions','percent','Hva er '+pct+' % av '+price+'?',price*pct/100);
        const den=[2,3,4,5,6,8][i],num=[1,2,3,2,5,3][i],total=den*(8+i);
        add('fractions','fractions','Hva er '+num+'/'+den+' av '+total+'?',num*(8+i));
        const r1=2+i,r2=3+i;
        add('fractions','ratio','Forholdet er '+r1+':'+r2+'. Første del er '+(r1*5)+'. Andre del?',r2*5);
        const dec=(125+i*75)/1000;
        add('fractions','decimals',String(dec).replace('.',',')+' × 100 = ?',String(dec*100).replace('.',','));

        const a1=48+i*3,a2=62+i*2;
        add('geometry','angles','En trekant har vinklene '+a1+'° og '+a2+'°. Den siste?',180-a1-a2);
        const b=7+i,h=4+(i%3);
        add('geometry','area','Et parallellogram har grunnlinje '+b+' og høyde '+h+'. Arealet?',b*h);
        const radius=3+i;
        add('geometry','circle','En sirkel har radius '+radius+' cm. Hva er diameteren?',radius*2);
        const scale=[50,100,200,250,500,1000][i],cm=2+i;
        add('geometry','scale','Målestokk 1:'+scale+'. '+cm+' cm på kartet er hvor mange cm i virkeligheten?',scale*cm);
        const l=3+i,w=2+(i%3),hh=4+(i%2);
        add('geometry','volume','Et prisme har grunnflate '+(l*w)+' cm² og høyde '+hh+' cm. Volumet?',l*w*hh);

        const sol=6+i;
        add('algebra','algebra','x + '+(5+i)+' = '+(sol+5+i)+'. Hva er x?',sol);
        const start=2+i,step=2+(i%3);
        add('algebra','pattern','Følgen er '+[start,start+step,start+2*step,start+3*step].join(', ')+', ... Neste tall?',start+4*step);
        const xv=2+i,coef=2+(i%3),constant=3+i;
        add('algebra','expression','Hvis x = '+xv+', hva er '+coef+'x + '+constant+'?',coef*xv+constant);
      });
    }else{
      const level=Math.min(grade,10);
      six.forEach(i=>{
        const neg=-(6+i+level-8),pos=11+i*2;
        add('numbers','negative',neg+' + '+pos+' = ?',neg+pos);
        const base=2+(i%4),exp=2+(i%2);
        add('numbers','powers',base+(exp===2?'²':'³')+' = ?',Math.pow(base,exp));
        const roots=[64,81,100,121,144,169][i];
        add('numbers','roots','√'+roots+' = ?',Math.sqrt(roots));
        const vals=[5+i,8+i*2,11+i*3];
        add('numbers','statistics','Hva er gjennomsnittet av '+vals.join(', ')+'?',vals.reduce((a,b)=>a+b,0)/3);

        const before=200+i*50,change=[10,20,25,30,40,50][i];
        add('fractions','percent-change',before+' øker med '+change+' %. Ny verdi?',before*(1+change/100));
        const den=[2,3,4,5,8,10][i],num=[1,2,3,4,5,7][i],whole=den*(10+i);
        add('fractions','fractions','Hva er '+num+'/'+den+' av '+whole+'?',num*(10+i));
        const dec=[0.125,0.2,0.375,0.45,0.625,0.75][i];
        add('fractions','decimals',String(dec).replace('.',',')+' som prosent er?',dec*100);

        const triples=[[3,4,5],[5,12,13],[6,8,10],[8,15,17],[7,24,25],[9,12,15]][i];
        add('geometry','pythagoras','Katetene er '+triples[0]+' og '+triples[1]+'. Hypotenusen?',triples[2]);
        const radius=4+i;
        add('geometry','circle','En sirkel har diameter '+(radius*2)+' cm. Radius?',radius);
        const w=8+i,h=5+(i%4);
        add('geometry','area','Et rektangel er '+w+' × '+h+'. Arealet?',w*h);
        const scale=[25,50,100,200,500,1000][i],cm=3+i;
        add('geometry','scale','Målestokk 1:'+scale+'. '+cm+' cm på tegningen er hvor mange cm i virkeligheten?',scale*cm);

        const sol=5+i+level-8,a=2+(i%3),b=3+i;
        add('algebra','algebra',a+'x + '+b+' = '+(a*sol+b)+'. Hva er x?',sol);
        const xv=2+i,m=2+(level-8),c=1+i;
        add('algebra','linear','y = '+m+'x + '+c+'. Når x = '+xv+', hva er y?',m*xv+c);
        const fx=3+(i%3),offset=2+i;
        add('algebra','functions','f(x) = '+fx+'x − '+offset+'. Hva er f('+(2+i)+')?',fx*(2+i)-offset);
      });
    }
    return bucketed(module,buckets);
  }

  function english(grade,module){
    const buckets={words:[],sentences:[],reading:[],grammar:[]};
    const add=(bucket,skill,prompt,answer,options,extra={})=>buckets[bucket].push(choice('english',skill,prompt,answer,options,extra));
    const read=(prompt,answer,options,passage)=>add('reading','reading',prompt,answer,options,{passage});

    if(grade<=2){
      [
        ['What is “fire” in English?','fire',['water','chair']],
        ['What is “seven” in Norwegian?','sju',['tre','ti']],
        ['What number comes after eight?','nine',['six','ten']],
        ['What is “two” in Norwegian?','to',['tolv','tre']],
        ['Which word means 5?','five',['four','nine']],
        ['Which word means 10?','ten',['two','six']]
      ].forEach(x=>add('words','numbers',...x));
      [
        ['What do you say when someone helps you?','Thank you!',['Good night!','Blue.']],
        ['What can you say when you leave?','Goodbye!',['Good morning!','Seven.']],
        ['What do you say before bed?','Good night!',['Good afternoon!','Apple.']],
        ['Someone says “Hello!”. What can you say?','Hello!',['Yesterday.','Green.']],
        ['What can you say when you want something politely?','Please.',['Dog.','Monday.']],
        ['What can you say after making a small mistake?','Sorry.',['Yellow.','School.']]
      ].forEach(x=>add('sentences','phrases',...x));
      [
        ['Choose the correct spelling.','dog',['dag','doog']],
        ['Choose the correct spelling.','house',['hous','housse']],
        ['Choose the correct spelling.','apple',['aple','appel']],
        ['Choose the correct spelling.','book',['bok','boook']],
        ['Choose the correct spelling.','green',['gren','grean']],
        ['Choose the correct spelling.','school',['skool','schol']]
      ].forEach(x=>add('words','spelling',...x));
      [
        ['Where does Mia sit?','On the bus',['At home','In a boat'],'Mia gets on the bus and sits by the window.'],
        ['What does Tom drink?','Water',['Milk','Juice'],'Tom is thirsty. He fills a glass with water.'],
        ['Why does Eva wear a coat?','It is cold',['It is hot','She is swimming'],'Snow is falling outside. Eva puts on a warm coat.'],
        ['What animal does Ben see?','A bird',['A fish','A horse'],'Ben looks up. A small bird is sitting in the tree.'],
        ['Where is the ball?','Under the table',['On the roof','In the car'],'The red ball rolls under the table.'],
        ['What happens first?','Lily opens the book',['Lily goes to sleep','Lily closes the school'],'Lily opens her book and starts to read before bedtime.']
      ].forEach(([q,a,o,p])=>read(q,a,o,p));
    }else if(grade<=4){
      [
        ['Choose the verb.','jump',['green','window','happy']],
        ['Choose the verb.','write',['yellow','teacher','quiet']],
        ['Choose the verb.','listen',['small','chair','purple']],
        ['Choose the verb.','carry',['kind','school','slow']],
        ['Choose the verb.','build',['blue','friend','soft']],
        ['Choose the verb.','choose',['bright','garden','early']]
      ].forEach(x=>add('grammar','verbs',...x));
      [
        ['Yesterday we ___ football.','played',['play','plays','playing']],
        ['Yesterday she ___ a cake.','baked',['bake','bakes','baking']],
        ['Last night I ___ my homework.','finished',['finish','finishes','finishing']],
        ['On Monday they ___ to school.','walked',['walk','walks','walking']],
        ['He ___ the door five minutes ago.','opened',['open','opens','opening']],
        ['We ___ a film yesterday.','watched',['watch','watches','watching']]
      ].forEach(x=>add('grammar','past-tense',...x));
      [
        ['Mia = ...','she',['he','they','we']],
        ['Noah = ...','he',['she','they','we']],
        ['Mia and Noah = ...','they',['he','she','it']],
        ['My friend and I = ...','we',['they','he','it']],
        ['The book = ...','it',['they','we','she']],
        ['The dogs = ...','they',['it','he','she']]
      ].forEach(x=>add('grammar','pronouns',...x));
      [
        ['Choose the correct sentence.','She is reading.',['She are reading.','She reading is.']],
        ['Choose the correct sentence.','They have two bikes.',['They has two bikes.','They two bikes has.']],
        ['Choose the correct form: He ___ football.','plays',['play','playing','played now']],
        ['Choose the correct form: We ___ ready.','are',['is','am','bees']],
        ['Choose the correct sentence.','I do not know.',['I does not know.','I not do know.']],
        ['Choose the correct sentence.','There is a cat outside.',['There are a cat outside.','There a cat is outside.']]
      ].forEach(x=>add('grammar','grammar',...x));
      [
        ['What can you say when you need help?','Can you help me, please?',['I am a table.','Yesterday blue.']],
        ['Someone says “Thank you”. What can you reply?','You are welcome.',['Good night yesterday.','Seven apples are.']],
        ['What can you say before entering a room?','May I come in?',['I came tomorrow.','Blue is fast.']],
        ['How can you ask for water politely?','Can I have some water, please?',['Water give.','I water yesterday.']],
        ['What can you say when you do not understand?','Could you say that again?',['I understand yesterday.','Green table.']],
        ['What can you say when meeting a new classmate?','Nice to meet you.',['I am Monday.','Good night at noon.']]
      ].forEach(x=>add('sentences','phrases',...x));
      [
        ['Choose the correct sentence.','My brother likes football.',['My brother like football.','Likes my brother football.']],
        ['Choose the correct sentence.','We are going home now.',['We going are home now.','We is going home now.']]
      ].forEach(x=>add('sentences','sentence',...x));
    }else if(grade<=7){
      [
        ['Last year we ___ to Scotland.','travelled',['travel','travelling','travels']],
        ['She ___ the answer before anyone else.','found',['find','finding','finds']],
        ['They ___ dinner before the film started.','finished',['finish','finishing','finishes']],
        ['I ___ my keys yesterday.','lost',['lose','losing','loses']],
        ['He ___ a letter last week.','wrote',['write','written now','writes']],
        ['We ___ the match on Saturday.','won',['win','winning','wins']]
      ].forEach(x=>add('grammar','past-tense',...x));
      [
        ['Choose the modal verb.','might',['bright','fight','night']],
        ['Choose the verb.','consider',['careful','idea','because']],
        ['Choose the verb.','explain',['clear','reason','slowly']],
        ['Choose the verb.','compare',['similar','difference','quiet']],
        ['Choose the verb.','decide',['decision','careful','yellow']],
        ['Choose the verb.','suggest',['helpful','idea','perhaps']]
      ].forEach(x=>add('grammar','verbs',...x));
      [
        ['Sara and I = ...','we',['they','she','it']],
        ['The students = ...','they',['we','it','he']],
        ['My phone = ...','it',['they','she','we']],
        ['Tom and his sister = ...','they',['he','she','it']],
        ['You and I = ...','we',['they','it','he']],
        ['The teacher = ...','he or she',['they only','it always','we']]
      ].forEach(x=>add('grammar','pronouns',...x));
      [
        ['Choose the correct sentence.','If it rains, we will stay inside.',['If it rain, we stays inside.','If it rains, we stayed tomorrow.']],
        ['Choose the correct sentence.','She has already finished.',['She have already finish.','She already finishing.']],
        ['Choose the correct comparative.','This route is safer.',['This route is more safe-er.','This route safest than.']],
        ['Choose the correct form.','You should bring a jacket.',['You should brings a jacket.','You should brought a jacket.']],
        ['Choose the correct sentence.','There were many people there.',['There was many people there.','There many people were.']],
        ['Choose the correct form.','I have never seen it.',['I has never saw it.','I never seeing it.']]
      ].forEach(x=>add('grammar','grammar',...x));
      [
        ['What is a polite way to disagree?','I see your point, but I think differently.',['You are wrong, end of story.','Blue yesterday.']],
        ['How can you ask for clarification?','Could you explain what you mean?',['Explain thing now.','I mean yesterday.']],
        ['What can you say to make a suggestion?','How about trying another way?',['Another way was blue.','I suggestion.']],
        ['What is a polite way to interrupt?','Excuse me, may I add something?',['Stop talking.','Yesterday please.']],
        ['How can you ask for an opinion?','What do you think about this?',['Think this now?','Where is yesterday?']],
        ['What can you say when you partly agree?','I agree with part of that.',['Everything is wrong.','I am a sentence.']]
      ].forEach(x=>add('sentences','phrases',...x));
    }else{
      const byGrade={
        8:{
          vocabulary:[
            ['What is closest to “accurate”?','precise',['random','silent']],
            ['What is closest to “contrast”?','difference',['agreement only','location']],
            ['What is closest to “maintain”?','keep',['destroy','guess']],
            ['What is closest to “assume”?','suppose',['measure exactly','forget']],
            ['What is closest to “indicate”?','show',['hide permanently','remove']]
          ],
          grammar:[
            ['Choose the correct sentence.','If she studies, she will improve.',['If she study, she improve.','If she studied, she will improved.']],
            ['Choose the correct passive form.','The results were published yesterday.',['The results published yesterday.','The results was publish yesterday.']],
            ['Choose the correct connector.','Although it was late, we continued.',['Although it was late, but we continued.','Although late because continued.']],
            ['Choose the correct relative clause.','The book that I borrowed was useful.',['The book who I borrowed was useful.','The book I borrowed who useful.']],
            ['Choose the correct form.','She has been waiting for an hour.',['She have waiting for an hour.','She is wait for an hour.']]
          ],
          sentence:[
            ['Choose the clearest sentence.','The experiment produced a different result.',['The experiment thing result different.','Different produced experiment result the.']],
            ['Choose the most formal request.','Could you provide more information?',['Give me more stuff.','Info now, please.']],
            ['Choose the best connector.','However, the second study reached another conclusion.',['Because however second study.','Another conclusion and however because.']],
            ['Choose the clearest claim.','The data suggests a gradual increase.',['Data thing goes up maybe.','Increase gradual the data.']],
            ['Choose the best sentence.','One possible explanation is that the sample was small.',['Sample small explanation one maybe.','Because sample, explanation small.']]
          ],
          reading:[
            ['What is the main idea?','Planning can reduce wasted time',['Plans always work perfectly','Speed is the only goal'],'A plan cannot predict everything, but it can help people organise tasks and notice problems earlier.'],
            ['What can we infer?','The writer is cautious about the result',['The writer thinks the result proves everything','The writer rejects all evidence'],'The first test looks promising, although the team says more trials are needed.'],
            ['Which detail is evidence?','The measured temperature fell by four degrees',['The room felt nicer','Everyone liked the colour'],'After insulation was added, sensors recorded a four-degree smaller temperature drop overnight.'],
            ['What is the tone?','Balanced',['Furious','Comical'],'The tool saves time for some tasks, but it also creates new errors that users must check.'],
            ['Why mention the small sample?','To show a limitation',['To prove the result is false','To advertise the study'],'The survey found a difference, but only 35 people took part.']
          ]
        },
        9:{
          vocabulary:[
            ['What is closest to “evaluate”?','assess',['ignore','decorate']],
            ['What is closest to “relevant”?','connected to the issue',['very old','always popular']],
            ['What is closest to “bias”?','systematic preference',['perfect balance','random spelling']],
            ['What is closest to “interpret”?','explain the meaning of',['copy exactly','delete']],
            ['What is closest to “credible”?','believable and trustworthy',['colourful','brief']]
          ],
          grammar:[
            ['Choose the correct conditional.','If they had left earlier, they would have arrived on time.',['If they left earlier, they would arrived.','If they had leave, they will arrive.']],
            ['Choose the correct passive form.','The decision was criticised by several groups.',['The decision criticised by groups.','The decision was criticise.']],
            ['Choose the correct reported speech.','She said that she was tired.',['She said that she is tired yesterday.','She said she tired was.']],
            ['Choose the correct relative clause.','The report, which was published in May, was updated.',['The report, who was published, updated.','The report which published was May.']],
            ['Choose the correct form.','They had already left when we arrived.',['They have already left when we arrived yesterday.','They already leaving when we arrived.']]
          ],
          sentence:[
            ['Choose the most precise sentence.','The evidence supports the claim, but does not prove causation.',['The evidence proves everything.','The evidence is a thing about the claim.']],
            ['Choose the best academic connector.','In contrast, the second group showed no change.',['And stuff, second group.','Because contrast no change.']],
            ['Choose the most neutral wording.','The proposal has both benefits and costs.',['The proposal is obviously amazing.','The proposal is a total disaster.']],
            ['Choose the clearest sentence.','The conclusion depends on how the data is interpreted.',['Conclusion data interpretation thing.','Depends the conclusion data how.']],
            ['Choose the strongest qualified claim.','The results suggest a possible relationship.',['The results prove the cause forever.','The results mean nothing.']]
          ],
          reading:[
            ['Why is the source uncertain?','The claim has no named evidence',['The headline is short','The page uses a photo'],'The post says “experts agree” but gives no names, links or studies.'],
            ['What is the main idea?','Correlation alone does not prove cause',['Two trends can never be compared','Graphs are unreliable'],'Two trends rose during the same years, but the report warns that other factors may explain both.'],
            ['What can we infer about the author?','The author values verification',['The author dislikes all media','The author believes every rumour'],'Before accepting the claim, the writer checks the original report and compares it with another source.'],
            ['Which detail strengthens credibility?','The method and limitations are described',['The title is dramatic','The logo is large'],'The article links to the data, explains how participants were selected and notes two limitations.'],
            ['What is the tone?','Cautiously critical',['Celebratory','Playful'],'The proposal could help, but the evidence is still limited and the costs have not been fully estimated.']
          ]
        },
        10:{
          vocabulary:[
            ['What is closest to “substantiate”?','support with evidence',['repeat loudly','shorten']],
            ['What is closest to “ambiguous”?','open to more than one meaning',['completely certain','numerical']],
            ['What is closest to “implication”?','possible consequence or meaning',['headline only','spelling rule']],
            ['What is closest to “validity”?','whether something is sound or well-founded',['popularity','length']],
            ['What is closest to “nuanced”?','showing important distinctions',['extremely simple','angry']]
          ],
          grammar:[
            ['Choose the correct form.','Had I known, I would have acted differently.',['Had I knew, I would acted.','If I had known, I will act yesterday.']],
            ['Choose the correct passive construction.','The findings have been questioned by other researchers.',['The findings have question by researchers.','The findings been questioning.']],
            ['Choose the correct sentence.','Not only did the policy change costs, it also changed behaviour.',['Not only the policy did changed costs.','Not only did policy changed.']],
            ['Choose the correct form.','The report recommends that the rule be revised.',['The report recommends that the rule is revise.','The report recommend rule revised be.']],
            ['Choose the correct connector.','Nevertheless, the limitation does not invalidate the entire study.',['Nevertheless because invalidates.','Limitation nevertheless entire study because.']]
          ],
          sentence:[
            ['Choose the most precise claim.','The evidence is consistent with the hypothesis, but alternative explanations remain.',['The evidence proves the hypothesis beyond doubt.','The hypothesis is basically right.']],
            ['Choose the most concise formal sentence.','The policy reduced costs without changing outcomes.',['The policy, which was a policy, made costs lower while outcomes stayed outcomes.','Costs policy lower outcomes same thing.']],
            ['Choose the best qualification.','The conclusion applies to this sample and may not generalise to all students.',['The conclusion applies to everyone everywhere.','Samples never matter.']],
            ['Choose the clearest contrast.','The first source reports a decline, whereas the second reports no change.',['First decline and second whatever.','Whereas because decline no change first.']],
            ['Choose the strongest evidence-focused sentence.','A claim should be proportional to the quality of the evidence supporting it.',['Strong wording makes evidence stronger.','Evidence is optional when a claim sounds convincing.']]
          ],
          reading:[
            ['What is the main idea?','Strong conclusions require strong evidence',['Long reports are always reliable','Uncertainty makes research useless'],'A result can be interesting without being decisive. The confidence of a conclusion should match the quality and amount of evidence.'],
            ['What is the key limitation?','The groups were not randomly assigned',['The study has numbers','The article has a title'],'Students chose whether to join the programme, so differences between the groups may have existed before it began.'],
            ['What can we infer?','The writer distinguishes possibility from proof',['The writer rejects the hypothesis','The writer accepts the claim as certain'],'The pattern could fit the proposed explanation, but several other mechanisms could produce the same result.'],
            ['Why compare the two sources?','To test whether the claim is supported independently',['To make the text longer','To avoid checking the original claim'],'One article repeats the company press release, while an independent review examines the underlying data.'],
            ['What is the tone?','Analytical and qualified',['Mocking','Uncritically enthusiastic'],'The policy produced measurable benefits, although the effect was smaller than predicted and varied between groups.']
          ]
        }
      };
      const set=byGrade[Math.max(8,Math.min(10,grade))];
      set.vocabulary.forEach(x=>add('words','vocabulary',...x));
      set.grammar.forEach(x=>add('grammar','grammar',...x));
      set.sentence.forEach(x=>add('sentences','sentence',...x));
      set.reading.forEach(([q,a,o,p])=>read(q,a,o,p));
    }
    return bucketed(module,buckets);
  }

  window.LARIA_COMMERCIAL_CONTENT_V18={
    version:'p18rc1',
    norwegian,
    math,
    english
  };
})();