'use strict';
// One-time, exact-anchor migration. Runs only on the isolated feature branch.
const fs=require('node:fs'),assert=require('node:assert/strict');
function replaceOnce(text,old,next,label){
  assert.equal(text.split(old).length,2,'Expected exactly one anchor: '+label);
  return text.replace(old,next);
}
function edit(file,fn){const old=fs.readFileSync(file,'utf8');const next=fn(old);fs.writeFileSync(file,next);}
(async()=>{
 const app='laer-litt-mer/';
 const marker='<!-- Country discoveries: independent editorial content. -->';
 if(fs.readFileSync(app+'index.html','utf8').includes(marker)){console.log('Already integrated');return;}
 const records=[];
 for(const [code,id,min,max] of [['CHE','ch',8900000,9200000],['CZE','cz',10700000,11100000]]){
   const url='https://api.worldbank.org/v2/country/'+code+'/indicator/SP.POP.TOTL?date=2024&format=json';
   const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
   assert(response.ok,'Population source unavailable: '+response.status);
   const payload=await response.json(),row=payload[1]?.[0];
   assert(row?.countryiso3code===code&&row.date==='2024'&&Number.isInteger(row.value)&&row.value>=min&&row.value<=max,'Unexpected population response');
   records.push({id,code,population:row.value,year:2024,source:url,checked:'2026-10-15'});
 }
 fs.writeFileSync(app+'country-population-sources-2024.json',JSON.stringify(records,null,2)+'\n');
 edit(app+'index.html',s=>{
   s=replaceOnce(s,'<script src="./globe-v25-renderer.js?v=20261012-ux-phase1" defer></script>',marker+'\n<script src="./country-discoveries-v1.js?v=20261015-discoveries1" defer></script>\n<script src="./country-discoveries-ui-v1.js?v=20261015-discoveries1" defer></script>\n<script src="./globe-v25-renderer.js?v=20261015-discoveries1" defer></script>','script order');
   s=s.replaceAll('./globe-v25-renderer.js?v=20261012-ux-phase1','./globe-v25-renderer.js?v=20261015-discoveries1');
   s=replaceOnce(s,'./laria-country-detail-premium-v1.js?v=20261015-story4-popyear-outline1','./laria-country-detail-premium-v1.js?v=20261015-discoveries1','detail cache');
   const css='<link rel="stylesheet" href="./laria-country-detail-premium-v1.css?v=20261015-story3-curated1" />';
   s=replaceOnce(s,css,css+'\n  <link rel="stylesheet" href="./country-discoveries-v1.css?v=20261015-discoveries1" />','styles');
   s=replaceOnce(s,'function stopSpeech(){\n  lariaSpeechRun++;','function stopSpeech(){\n  lariaSpeechRun++;\n  window.LARIA_COUNTRY_DISCOVERY_UI?.stopReading?.();','shared speech ownership');
   const cz=records.find(r=>r.id==='cz'),ch=records.find(r=>r.id==='ch');
   s=replaceOnce(s,"cz:{capital:'Praha'}","cz:{capital:'Praha',population:"+cz.population+",populationYear:2024},ch:{population:"+ch.population+",populationYear:2024}",'offline population');
   return s;
 });
 edit(app+'laria-country-detail-premium-v1.js',s=>{
   s=s.replace(/  const DEFAULT_TAGS=\{[\s\S]*?\n  \};\n/,'');
   s=s.replace(/^      summary:.*\n/gm,'');
   s=replaceOnce(s,"tag:source?.tag||DEFAULT_TAGS[country.continent]||'Et sted å oppdage'","tag:root.LARIA_COUNTRY_DISCOVERIES?.get(country)?.tagline||'Flagg, hovedstad og kart'",'country-specific subtitle');
   s=replaceOnce(s,'    lastCountry=country;lastId=id;','    root.LARIA_COUNTRY_DISCOVERY_UI?.stopReading?.();\n    lastCountry=country;lastId=id;','reader reset');
   const from=s.indexOf("          '<header>'+"),to=s.indexOf("          '<dl class=\"country-story-facts\">'+",from);
   assert(from>0&&to>from,'detail intro anchors');
   s=s.slice(0,from)+"          (root.LARIA_COUNTRY_DISCOVERY_UI?.intro(id,country)||'<header><h2>Kort om '+esc(country.name)+'</h2></header>')+\n"+s.slice(to);
   s=replaceOnce(s,"'Innbyggere · ca.',population(country.population)","'Innbyggere · eldre anslag',population(country.population)",'undated population label');
   s=replaceOnce(s,"          outline+\n          '<div class=\"country-story-bottom\">'+","          outline+\n          (root.LARIA_COUNTRY_DISCOVERY_UI?.sources(id,country)||'')+\n          '<div class=\"country-story-bottom\">'+",'source panel');
   s=replaceOnce(s,"    // Paint the silhouette before the page becomes visible, avoiding an empty","    root.LARIA_COUNTRY_DISCOVERY_UI?.mount(target,id);\n    // Paint the silhouette before the page becomes visible, avoiding an empty",'mount reader');
   return s;
 });
 edit(app+'globe-v25-renderer.js',s=>{
   s=replaceOnce(s,'<span class="globe-country-tagline">✨ \'+scene.tag+\'</span>','<span class="globe-country-tagline"></span>','globe teaser');
   s=replaceOnce(s,"  box.style.cursor='pointer';","  const teaser=box.querySelector('.globe-country-tagline');\n  if(teaser)teaser.textContent=window.LARIA_COUNTRY_DISCOVERIES?.get(id)?.teaser||'Se flagget, hovedstaden og kartet.';\n  box.style.cursor='pointer';",'safe teaser text');
   return s;
 });
 edit(app+'sw.js',s=>replaceOnce(s,'-popyear-outline1','-popyear-outline1-discoveries1','service worker release'));
 edit('tests/laria-country-detail-premium.playwright.js',s=>{
   const old="      const rect=await page.locator('.country-story-practice').boundingBox();\n      assert(rect&&rect.y+rect.height<=viewport.height-7,\n        label+' practice button pushed off the tablet screen');";
   return replaceOnce(s,old,"      // A reading page may scroll. The CTA must remain reachable, not force\n      // three discoveries into tiny type just to fit the first viewport.\n      await page.locator('.country-story-practice').scrollIntoViewIfNeeded();\n      const rect=await page.locator('.country-story-practice').boundingBox();\n      assert(rect&&rect.y>=0&&rect.y+rect.height<=viewport.height+1,\n        label+' practice button is not reachable by scrolling');\n      await page.evaluate(()=>window.scrollTo(0,0));",'reading page reachability');
 });
 const bank=require('../'+app+'country-discoveries-v1.js');
 const html=fs.readFileSync(app+'index.html','utf8');
 const world=JSON.parse(html.match(/const WORLD_COUNTRIES = (\[.*?\]);/s)[1]);
 const report=bank.coverage(world.map(c=>c.id));
 fs.writeFileSync(app+'country-discoveries-coverage.json',JSON.stringify({release:bank.version,...report},null,2)+'\n');
 console.log('Integrated discoveries:',JSON.stringify(report));
 fs.unlinkSync(__filename);
})().catch(e=>{console.error(e);process.exitCode=1});
