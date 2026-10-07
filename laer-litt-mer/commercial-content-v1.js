(function(){
'use strict';
const baseMath=window.mathPool,baseEnglish=window.englishPool,baseNorwegian=window.buildNorwegianPool;
if(typeof baseMath!=='function'||typeof baseEnglish!=='function')return;
const cq=(s,k,p,a,o,e={})=>choiceQuestion(s,k,p,String(a),o.map(String),e);
const nq=(k,p,a,e={})=>numberInputQuestion(k,p,a,e);
const take=(items,n=5)=>items.slice(0,n);

function mathExtra(g){
 const q=[],N=(k,p,a,e)=>q.push(nq(k,p,a,e)),C=(k,p,a,o,e)=>q.push(cq('math',k,p,a,o,e));
 const pairs=(k,rows,op,unit)=>rows.forEach(([a,b])=>N(k,a+' '+op+' '+b,op==='×'?a*b:op==='÷'?a/b:op==='+'?Number((a+b).toFixed(2)):Number((a-b).toFixed(2)),unit?{unit}:{}));
 if(g===5){
  pairs('decimals',[[12.4,3.5],[8.75,1.2],[19.6,4.25],[6.08,2.9],[14.5,.75]],'+');
  pairs('division',[[48,6],[63,7],[72,8],[81,9],[96,12]],'÷');pairs('multiplication',[[14,6],[18,7],[24,8],[16,9],[12,11]],'×');
  [['1/2','4/8'],['3/4','6/8'],['2/5','4/10'],['1/3','2/6'],['3/5','6/10']].forEach(x=>C('fractions','Hvilken brøk er like stor som '+x[0]+'?',x[1],[x[1],'1/4','2/3','5/6']));
  [[200,10],[300,25],[400,50],[250,20],[600,15]].forEach(x=>N('percent','Hva er '+x[1]+' % av '+x[0]+'?',x[0]*x[1]/100));
  [[8,6],[12,5],[9,7],[15,4],[11,8]].forEach(x=>{N('area','Areal av rektangel '+x[0]+' × '+x[1]+' cm?',x[0]*x[1],{unit:'cm²'});N('perimeter','Omkrets av rektangel '+x[0]+' × '+x[1]+' cm?',2*(x[0]+x[1]),{unit:'cm'})});
  [[90,'rett'],[45,'spiss'],[120,'stump'],[30,'spiss'],[150,'stump']].forEach(x=>C('angles','Hva slags vinkel er '+x[0]+'°?',x[1],[x[1],'rett','spiss','stump']));
  [['2,5 m','250 cm'],['3 km','3000 m'],['750 ml','0,75 l'],['4,2 kg','4200 g'],['120 min','2 timer']].forEach(x=>C('units','Hva er det samme som '+x[0]+'?',x[1],[x[1],'25 cm','300 m','7,5 l']));
  [[50732,'50 000'],[8641,'10 000'],[125090,'130 000'],[9705,'10 000'],[64321,'60 000']].forEach(x=>C('large-numbers','Rund '+x[0]+' av til nærmeste titusen.',x[1],[x[1],'20 000','70 000','100 000']));
 }
 if(g===6){
  pairs('decimals',[[5.6,2.75],[14.2,3.08],[9.45,1.55],[20.1,6.35],[7.8,.92]],'+');
  pairs('division',[[144,12],[132,11],[156,12],[168,14],[180,15]],'÷');pairs('multiplication',[[18,14],[22,13],[16,17],[25,12],[19,15]],'×');
  [['2/3','4/6'],['3/8','6/16'],['5/6','10/12'],['3/5','9/15'],['7/10','14/20']].forEach(x=>C('fractions','Hvilken brøk er like stor som '+x[0]+'?',x[1],[x[1],'1/2','2/5','3/4']));
  [[240,15],[360,20],[500,12],[800,7.5],[1250,4]].forEach(x=>N('percent','Hva er '+x[1]+' % av '+x[0]+'?',x[0]*x[1]/100));
  [['2:3','4:6'],['3:5','6:10'],['1:4','3:12'],['5:2','15:6'],['4:7','8:14']].forEach(x=>C('ratio','Hvilket forhold er likt '+x[0]+'?',x[1],[x[1],'1:1','2:5','3:4']));
  [[7,5],[11,4],[9,8],[13,6],[15,3]].forEach(x=>{N('area','Areal av rektangel '+x[0]+' × '+x[1]+' m?',x[0]*x[1]);N('perimeter','Omkrets av rektangel '+x[0]+' × '+x[1]+' m?',2*(x[0]+x[1]))});
  [[3,4,5],[2,5,3],[4,3,2],[6,2,5],[5,5,4]].forEach(x=>N('volume','Volum av boks '+x[0]+' × '+x[1]+' × '+x[2]+' cm?',x[0]*x[1]*x[2]));
  [[35,'spiss'],[90,'rett'],[125,'stump'],[60,'spiss'],[150,'stump']].forEach(x=>C('angles','Hva slags vinkel er '+x[0]+'°?',x[1],[x[1],'rett','spiss','stump']));
  [['1,5 km','1500 m'],['0,8 l','800 ml'],['2,4 kg','2400 g'],['3,5 m','350 cm'],['2,5 timer','150 min']].forEach(x=>C('units','Hva er det samme som '+x[0]+'?',x[1],[x[1],'250','3500','24']));
  [['6 + 3 × 4',18],['20 - 2 × 6',8],['5 × 4 + 7',27],['30 ÷ 5 + 8',14],['18 - 12 ÷ 3',14]].forEach(x=>N('order',x[0],x[1]));
 }
 if(g>=7){
  const rows={
   negative:[['-4 + 7',3],['-9 + 5',-4],['6 - 11',-5],['-3 - 8',-11],['12 - 15',-3]],
   powers:[['2³',8],['3²',9],['5²',25],['2⁵',32],['10³',1000]],
   decimals:[['4,2 - 1,75',2.45],['9,6 - 3,25',6.35],['12,08 - 2,7',9.38],['6,5 - 0,85',5.65],['18,4 - 5,95',12.45]],
   algebra:[['x + 5 = 12',7],['2x = 18',9],['3x + 1 = 16',5],['4x - 8 = 12',5],['5x + 5 = 30',5]]
  };
  Object.entries(rows).forEach(([k,a])=>a.forEach(x=>N(k,x[0],x[1])));
  [[450,20],[800,12.5],[1200,15],[640,25],[300,30]].forEach(x=>N('percent','Hva er '+x[1]+' % av '+x[0]+'?',x[0]*x[1]/100));
  [['2/3','8/12'],['3/7','9/21'],['5/8','15/24'],['4/5','12/15'],['7/9','14/18']].forEach(x=>C('fractions','Hvilken brøk er lik '+x[0]+'?',x[1],[x[1],'1/2','2/5','3/4']));
  [['3:4','9:12'],['2:5','8:20'],['5:3','20:12'],['7:2','21:6'],['4:9','12:27']].forEach(x=>C('ratio','Hvilket forhold er likt '+x[0]+'?',x[1],[x[1],'1:2','2:3','5:6']));
  [[40,'spiss'],[90,'rett'],[135,'stump'],[75,'spiss'],[160,'stump']].forEach(x=>C('angles','Hva slags vinkel er '+x[0]+'°?',x[1],[x[1],'spiss','rett','stump']));
  [[12,7],[9,9],[14,5],[8,11],[16,6]].forEach(x=>N('area','Areal av rektangel '+x[0]+' × '+x[1]+'?',x[0]*x[1]));
  [['1:50 000','1 cm = 500 m'],['1:100 000','1 cm = 1 km'],['1:25 000','4 cm = 1 km'],['1:10 000','10 cm = 1 km'],['1:200 000','1 cm = 2 km']].forEach(x=>C('scale','Hva betyr målestokken '+x[0]+'?',x[1],[x[1],'1 cm = 10 km','1 cm = 100 m']));
  [[3,4,5],[5,12,13],[8,15,17],[7,24,25],[9,12,15]].forEach(x=>N('pythagoras','Rettvinklet trekant med kateter '+x[0]+' og '+x[1]+'. Hypotenusen?',x[2]));
  [[2,4,6,8,10],[5,7,9,11,13],[3,6,9,12,15],[10,20,30,40,50],[1,4,7,10,13]].forEach(x=>N('statistics','Gjennomsnitt av '+x.join(', ')+'?',x.reduce((a,b)=>a+b,0)/x.length));
  [[3,4,2],[5,2,6],[4,6,3],[8,2,5],[7,3,4]].forEach(x=>N('volume','Volum av boks '+x[0]+' × '+x[1]+' × '+x[2]+'?',x[0]*x[1]*x[2]));
  [[1,3,5,7,9],[2,5,8,11,14],[10,8,6,4,2],[3,6,12,24,48],[1,4,9,16,25]].forEach(x=>C('pattern','Hva er neste tall: '+x.slice(0,4).join(', ')+' ...?',x[4],[x[4],x[3]+1,x[3]*2]));
  [['3x + 2 når x = 4',14],['5x - 1 når x = 3',14],['2x + 7 når x = 5',17],['4x - 6 når x = 4',10],['x² + 1 når x = 3',10]].forEach(x=>N('expression',x[0],x[1]));
 }
 if(g>=8){
  [['√49',7],['√81',9],['√121',11],['√144',12],['√225',15]].forEach(x=>N('roots',x[0],x[1]));
  [[500,12],[800,7.5],[1250,16],[2400,5],[640,18.75]].forEach(x=>N('percent-change','Hva er '+x[1]+' % av '+x[0]+'?',x[0]*x[1]/100));
  [['y = 2x + 1 når x = 3',7],['y = 3x - 2 når x = 4',10],['y = 5 - x når x = 2',3],['y = 4x når x = 5',20],['y = x² når x = 6',36]].forEach(x=>N('linear',x[0],x[1]));
  [['f(x)=x+4, f(3)=?',7],['f(x)=2x, f(6)=?',12],['f(x)=x², f(5)=?',25],['f(x)=3x-1, f(4)=?',11],['f(x)=10-x, f(7)=?',3]].forEach(x=>N('functions',x[0],x[1]));
  [[3,Math.PI*9],[4,Math.PI*16],[5,Math.PI*25],[6,Math.PI*36],[2,Math.PI*4]].forEach(x=>C('circle','Areal av sirkel med radius '+x[0]+'? ',x[0]*x[0]+'π',[x[0]*x[0]+'π',2*x[0]+'π',x[0]+'π']));
  [['Trekantvinkler 50° og 60°. Siste vinkel?',70],['Trekantvinkler 35° og 75°. Siste vinkel?',70],['Vinkelsum i trekant?',180],['Vinkelsum i firkant?',360],['Rett linje i grader?',180]].forEach(x=>N('geometry',x[0],x[1]));
 }
 return q;
}

function englishExtra(g){
 const q=[],C=(k,p,a,o,e)=>q.push(cq('english',k,p,a,o,e)),S=(a,w)=>q.push({subject:'english',skill:'sentence',type:'sentence-order',prompt:'Build the sentence',answer:a,words:shuffle(w),curriculum:CURRICULUM.english});
 if(g<=2){
  [['fire','four'],['fem','five'],['seks','six'],['sju','seven'],['åtte','eight']].forEach(x=>C('numbers','What is “'+x[0]+'” in English?',x[1],[x[1],'one','ten']));
  [['BOOK','📘'],['SUN','☀️'],['FISH','🐟'],['BALL','⚽'],['HOUSE','🏠']].forEach(x=>q.push(makeEnglishBuild(x[0],x[1])));
  [['What do you say when someone helps you?','Thank you!'],['What do you say when you leave?','Goodbye!'],['How can you greet a friend?','Hello!'],['What do you say before bed?','Good night!'],['What word makes a request polite?','Please.']].forEach(x=>C('phrases',x[0],x[1],[x[1],'Yesterday.','Seven.']));
  if(g===1)[
   ['Mia has a red ball.','What colour is the ball?','Red'],['Sam sees a big dog.','What does Sam see?','A dog'],['The sun is yellow.','What is yellow?','The sun'],['Leo has two books.','How many books?','Two'],['A cat sleeps on the chair.','Where is the cat?','On the chair']
  ].forEach(x=>C('reading',x[1],x[2],[x[2],'Blue','At school'],{passage:x[0]}));
 }
 if(g>=3&&g<=4){
  [['She plays football every day.','She play football every day.'],['They are at school.','They is at school.'],['I have two sisters.','I has two sisters.'],['He does not like milk.','He do not likes milk.'],['Do you like music?','Does you like music?']].forEach(x=>C('grammar','Choose the correct sentence.',x[0],[x[0],x[1]]));
  [['Yesterday we ___ football.','played'],['She ___ home last night.','walked'],['I ___ a film yesterday.','watched'],['They ___ dinner at six.','ate'],['He ___ to school.','went']].forEach(x=>C('past-tense',x[0],x[1],[x[1],'play','go']));
  [['Anna','she'],['Ben','he'],['Anna and Ben','they'],['My friend and I','we'],['The book','it']].forEach(x=>C('pronouns',x[0]+' = ...',x[1],[x[1],'he','they','it']));
  ['jump','read','sleep','write','listen'].forEach(x=>C('verbs','Choose the verb.',x,[x,'blue','table']));
  [['Can you help me?','I need help.'],['I am sorry.','I made a mistake.'],['Yes, I agree.','I agree.'],['I do not understand.','I need clarification.'],['What is your name?','I meet a new friend.']].forEach(x=>C('phrases',x[1]+' What can you say?',x[0],[x[0],'Blue yesterday.']));
  S('We are reading a book.',['We','are','reading','a','book.']);S('He likes to play football.',['He','likes','to','play','football.']);S('My friend lives in Oslo.',['My','friend','lives','in','Oslo.']);S('They walk to school together.',['They','walk','to','school','together.']);S('I can speak a little English.',['I','can','speak','a','little','English.']);
 }
 if(g>=5&&g<=7){
  [['Yesterday she ___ the bus.','missed'],['We ___ home late.','came'],['He ___ a new book.','bought'],['They ___ the answer.','knew'],['I ___ my homework.','finished']].forEach(x=>C('past-tense',x[0],x[1],[x[1],'go','see']));
  [['Sofia','she'],['Daniel','he'],['My parents','they'],['You and I','we'],['The computer','it']].forEach(x=>C('pronouns',x[0]+' = ...',x[1],[x[1],'he','they','it']));
  ['could','might','must','explain','improve'].forEach(x=>C('verbs','Choose the verb or modal verb.',x,[x,'quiet','table']));
  [['She has already finished.','She already finish.'],['We were waiting for the bus.','We was waiting for the bus.'],['If it rains, we will stay inside.','If it rain, we stayed inside.'],['He is taller than his brother.','He is more tall his brother.'],['I have never been to Canada.','I never has been Canada.']].forEach(x=>C('grammar','Choose the correct sentence.',x[0],[x[0],x[1]]));
  [['I see your point, but I disagree.','Disagree politely'],['Could you explain that again?','Ask for clarification'],['We could try another way.','Make a suggestion'],['What do you think?','Ask for an opinion'],['You are welcome.','Reply to thanks']].forEach(x=>C('phrases',x[1]+'.',x[0],[x[0],'Blue yesterday.']));
 }
 if(g>=8){
  [['accurate','correct and precise'],['evaluate','judge or assess'],['assumption','something accepted without proof'],['contrast','show differences'],['interpret','explain the meaning']].forEach(x=>C('vocabulary','What does “'+x[0]+'” mean?',x[1],[x[1],'very loud','temporary']));
  [['Had I known, I would have acted differently.','Had I knew, I acted different.'],['The results may have been affected by the sample size.','The results may affected sample.'],['Neither option is entirely convincing.','Neither options are entirely convincing.'],['The evidence on which the claim relies is limited.','The evidence which claim rely are limited.'],['Despite the delay, the project was completed.','Despite of delay, project completed was.']].forEach(x=>C('grammar','Choose the correct sentence.',x[0],[x[0],x[1]]));
  S('The evidence should be examined carefully.',['The','evidence','should','be','examined','carefully.']);S('A strong argument acknowledges relevant counterarguments.',['A','strong','argument','acknowledges','relevant','counterarguments.']);S('The report distinguishes correlation from causation.',['The','report','distinguishes','correlation','from','causation.']);S('Reliable sources make their methods transparent.',['Reliable','sources','make','their','methods','transparent.']);S('The conclusion should follow from the evidence.',['The','conclusion','should','follow','from','the','evidence.']);
  [['The sample method is not explained.','What information is missing?','How the sample was selected'],['The headline is more certain than the study.','What should the reader notice?','The headline overstates the evidence'],['A survey of 50 volunteers represents a whole country.','What should be questioned?','Whether the sample is representative'],['Two variables rise together without a shown mechanism.','What cannot be assumed?','That one caused the other'],['The writer fairly presents a counterargument first.','What can this add?','Nuance and credibility']].forEach(x=>C('reading',x[1],x[2],[x[2],'The font size','Nothing'],{passage:x[0]}));
 }
 return q;
}

function norwegianExtra(g){
 const q=[],C=(k,p,a,o,e)=>q.push(cq('norwegian',k,p,a,o,e));
 if(g<=2)[['Lina pakker badetøy og håndkle.','Hva skal Lina trolig gjøre?','Bade'],['Noah tar frem paraplyen.','Hva tror Noah kan skje?','Det kan begynne å regne'],['Mia setter tallerkenen i vasken.','Hva har Mia trolig gjort?','Spist'],['Oskar finner frem skjerf og votter.','Hvordan er været trolig?','Kaldt'],['Sara slår av lyset og legger seg.','Hva skal Sara trolig gjøre?','Sove']].forEach(x=>C('reading-inference',x[1],x[2],[x[2],'Bake','Sykle'],{passage:x[0]}));
 else if(g<=4)[['Et ekorn samler nøtter hele høsten.','Hva handler teksten mest om?','Ekornet lagrer mat','reading-main-idea'],['Biblioteket fikk nye bøker og lengre åpningstid.','Hva er hovedideen?','Biblioteket er blitt bedre','reading-main-idea'],['Nora øver litt hver dag og blir bedre.','Hva viser teksten?','Øving kan gi fremgang','reading-main-idea'],['Bussen var forsinket, så Ali kom sent.','Hvorfor kom Ali sent?','Bussen var forsinket','reading-comprehension'],['Det lå is på fortauet, så Emma gikk sakte.','Hvorfor gikk Emma sakte?','Det var glatt','reading-comprehension']].forEach(x=>C(x[3],x[1],x[2],[x[2],'Noe annet','Det vet vi ikke'],{passage:x[0]}));
 else if(g<=7)[['«Et hav av lys»','Metafor'],['«Vinden hvisket»','Personifikasjon'],['Samme uttrykk gjentas tre ganger','Gjentakelse'],['«Alle velger oss»','Appell til flertallet'],['Setningene blir kortere under konflikten','Økt tempo og spenning']].forEach(x=>C('reading-rhetoric','Hvilket virkemiddel eller hvilken virkning passer best til: '+x[0]+'?',x[1],[x[1],'Fotnote','Kildeliste']));
 else [['Én løsning hevdes å passe alle, men gruppene er svært ulike.','Konklusjonen er bredere enn dokumentasjonen'],['En rapport finner sammenheng, men sier årsaken er ukjent.','Sammenheng er ikke det samme som årsak'],['To kilder er uenige; én var til stede, én bygger på rykter.','Kildenes troverdighet må vurderes'],['Forfatteren presenterer et motargument og svarer med dokumentasjon.','Teksten møter et motargument'],['Artikkelen skiller tydelig fakta fra journalistens antakelser.','Den skiller fakta fra tolkning']].forEach(x=>C('reading-main-idea','Hva er hovedpoenget?',x[1],[x[1],'Skriftstørrelsen er viktig','Kilder er unødvendige'],{passage:x[0]}));
 return q;
}

const mathModules={numbers:new Set(['addition-10','addition-100','subtraction-100','number-order','place-value','large-numbers','negative','powers','roots','order','statistics']),operations:new Set(['multiplication','division','decimals','fractions','percent','percent-change','ratio']),geometry:new Set(['angles','area','perimeter','volume','circle','scale','pythagoras','geometry','units']),algebra:new Set(['algebra','linear','functions','pattern','expression'])};
const englishModules={words:new Set(['words','numbers','vocabulary','spelling']),sentences:new Set(['sentence','phrases']),reading:new Set(['reading']),grammar:new Set(['grammar','past-tense','pronouns','verbs'])};
const norModules={reading:new Set(['letter-sound','word-picture','reading-comprehension','reading-inference','reading-main-idea','reading-detail','reading-source','reading-rhetoric','reading-structure']),spelling:new Set(['missing-letter','spelling','compound-words','double-consonant','letter-sound','change-letter','add-letter','remove-letter']),language:new Set(['sentence-order','rhyme','synonyms','word-class','grammar','nynorsk','punctuation','rhetoric','source-criticism','literary-devices','argumentation','language'])};
const merge=(base,extra,module,map)=>[...base,...(!module?extra:extra.filter(x=>!map[module]||map[module].has(x.skill)))];
window.mathPool=(g,m)=>merge(baseMath(g,m),mathExtra(Number(g)||1),m,mathModules);
window.englishPool=(g,m)=>merge(baseEnglish(g,m),englishExtra(Number(g)||1),m,englishModules);
if(typeof baseNorwegian==='function')window.buildNorwegianPool=(g,m)=>merge(baseNorwegian(g,m),norwegianExtra(Number(g)||1),m,norModules);
try{renderAll();if(activeScreenName()==='subject'&&activeSubject){renderSubjectModules();renderSubjectJourney();renderSubjectContinue()}}catch(_){}
})();