'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const app=path.join(__dirname,'..','laer-litt-mer');
const bank=require(path.join(app,'country-discoveries-v1.js'));
const html=fs.readFileSync(path.join(app,'index.html'),'utf8');
const countries=JSON.parse(html.match(/const WORLD_COUNTRIES = (\[.*?\]);/s)[1]);
test('Each published country has three short, distinct, sourced discoveries',()=>{
 const seen={tagline:new Set(),teaser:new Set(),title:new Set(),text:new Set()};
 assert(Object.keys(bank.entries).length>=24);
 for(const [id,entry] of Object.entries(bank.entries)){
   assert(countries.some(c=>c.id===id),'Orphan country '+id);
   assert(Object.isFrozen(entry));assert.equal(entry.discoveries.length,3,id);
   for(const key of ['tagline','teaser']){
     assert(entry[key].length>10&&entry[key].length<185,id+' '+key+' length');
     assert(!seen[key].has(entry[key]),id+' duplicate '+key);seen[key].add(entry[key]);
   }
   for(const d of entry.discoveries){
     assert(d.category&&d.title&&d.text,id+' missing editorial field');
     assert(d.title.length<70&&d.text.length<310,id+' reading chunk too long');
     for(const key of ['title','text']){assert(!seen[key].has(d[key]),id+' duplicate '+key);seen[key].add(d[key]);}
     const url=new URL(d.source.url);assert.equal(url.protocol,'https:');
     assert(d.source.title&&/^\d{4}-\d{2}-\d{2}$/.test(d.source.reviewed));
     assert(!/Byer, fjell og mange landskap|Hvert land har noe/.test(d.text));
   }
 }
});
test('Country lookup is independent of art and does not synthesize generic stories',()=>{
 assert.equal(bank.get('CH'),bank.entries.ch);assert.equal(bank.get({a2:'CZ'}),bank.entries.cz);
 for(const input of [null,undefined,'unknown','__proto__','constructor','toString',{}])assert.equal(bank.get(input),null);
 assert.notEqual(bank.get('ch').teaser,bank.get('cz').teaser);
 assert.equal(bank.get('al'),null);
 assert.equal(bank.coverage(['ch','CH','cz','al']).covered,2);
});
test('Coverage report exposes every missing country and cannot silently lose content',()=>{
 const actual=bank.coverage(countries.map(c=>c.id));
 const baseline=JSON.parse(fs.readFileSync(path.join(app,'country-discoveries-coverage.json'),'utf8'));
 assert.equal(actual.total,baseline.total,'Country universe changed: review coverage');
 assert(actual.covered>=baseline.covered,'Previously curated countries lost content');
 assert(actual.missing.every(id=>baseline.missing.includes(id)),'New missing content is not declared');
 assert.equal(actual.complete,actual.missing.length===0);
 console.log('EDITORIAL COVERAGE: '+actual.covered+'/'+actual.total+'; '+actual.missing.length+' countries still require editorial work.');
 if(process.env.COUNTRY_REQUIRE_COMPLETE==='1')assert(actual.complete,'Full-world editorial release is blocked');
});
test('Read-aloud, cache, country data and deferred load order are connected',()=>{
 const marker=html.indexOf('<!-- Country discoveries: independent editorial content. -->');assert(marker>0);
 const tail=html.slice(marker);
 assert(tail.indexOf('country-discoveries-v1.js')<tail.indexOf('globe-v25-renderer.js'));
 assert(tail.indexOf('country-discoveries-ui-v1.js')<tail.indexOf('laria-country-detail-premium-v1.js'));
 assert(html.includes('window.LARIA_COUNTRY_DISCOVERY_UI?.stopReading?.();'));
 assert(html.includes('country-discoveries-v1.css?v=20261015-discoveries1'));
 assert(fs.readFileSync(path.join(app,'sw.js'),'utf8').includes('-discoveries1'));
 const records=JSON.parse(fs.readFileSync(path.join(app,'country-population-sources-2024.json'),'utf8'));
 for(const r of records){
   assert(['ch','cz'].includes(r.id));assert.equal(r.year,2024);assert.equal(new URL(r.source).hostname,'api.worldbank.org');
   assert(html.includes('population:'+r.population+',populationYear:2024}'));
 }
 const detail=fs.readFileSync(path.join(app,'laria-country-detail-premium-v1.js'),'utf8');
 assert(!detail.includes('DEFAULT_TAGS'));assert(!detail.includes('featured.summary'));
 assert(detail.includes('LARIA_COUNTRY_DISCOVERY_UI?.intro(id,country)'));
 assert(detail.includes('LARIA_COUNTRY_DISCOVERY_UI?.mount(target,id)'));
});
