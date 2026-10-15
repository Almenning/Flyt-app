'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const app=path.join(__dirname,'..','laer-litt-mer');
const bank=require(path.join(app,'country-discoveries-v1.js'));
const html=fs.readFileSync(path.join(app,'index.html'),'utf8');
const countries=JSON.parse(html.match(/const WORLD_COUNTRIES = (\[.*?\]);/s)[1]);
const originalIds='au br ca ch cn cz de dk eg es fi fr gb in is it jp ke no nz se td us za'.split(' ');
const europeIds='ad al at ba be bg by ch cy cz de dk ee es fi fr gb gr hr hu ie is it li lt lu lv mc md me mk mt nl no pl pt ro rs ru se si sk sm ua va'.split(' ');
test('Each published country has three short, distinct, sourced discoveries',()=>{
 const seen={tagline:new Set(),teaser:new Set(),title:new Set(),text:new Set()};
 assert(Object.keys(bank.entries).length>=57);
 for(const [id,entry] of Object.entries(bank.entries)){
   assert(countries.some(c=>c.id===id),'Orphan country '+id);
   assert(Object.isFrozen(entry));assert(Object.isFrozen(entry.discoveries));assert.equal(entry.discoveries.length,3,id);
   for(const key of ['tagline','teaser']){
     assert(entry[key].length>10&&entry[key].length<185,id+' '+key+' length');
     assert(!seen[key].has(entry[key]),id+' duplicate '+key);seen[key].add(entry[key]);
   }
   for(const d of entry.discoveries){
     assert(Object.isFrozen(d));assert(Object.isFrozen(d.source));
     assert(d.category&&d.title&&d.text,id+' missing editorial field');
     assert(d.title.length<70&&d.text.length<310,id+' reading chunk too long');
     for(const key of ['title','text']){assert(!seen[key].has(d[key]),id+' duplicate '+key);seen[key].add(d[key]);}
     const url=new URL(d.source.url);assert.equal(url.protocol,'https:');assert(!url.username&&!url.password);
     assert(d.source.title&&/^\d{4}-\d{2}-\d{2}$/.test(d.source.reviewed));
     assert(!/Byer, fjell og mange landskap|Hvert land har noe/.test(d.text));
   }
 }
});
test('The first 24 country records remain byte-equivalent as editorial objects',()=>{
 const original=Object.fromEntries(originalIds.map(id=>[id,bank.get(id)]));
 const digest=crypto.createHash('sha256').update(JSON.stringify(original)).digest('hex');
 assert.equal(digest,'cca2e345663aef22c281cc63ca4fc33f057071923bb6c05f7eccc2ce6d0f1361','Existing country content changed; review separately');
});
test('Every country in the existing Europe group has its own three discoveries',()=>{
 const existing=countries.filter(c=>c.continent==='Europa').map(c=>c.id).sort();
 assert.deepEqual(existing,europeIds,'Do not change country classifications to make coverage pass');
 for(const id of existing)assert.equal(bank.get(id)?.discoveries.length,3,'Missing Europe content: '+id);
 const region=bank.coverage(existing);assert.equal(region.total,45);assert.equal(region.covered,45);assert(region.complete);
});
test('Country lookup is independent of art and does not synthesize generic stories',()=>{
 assert.equal(bank.get('CH'),bank.entries.ch);assert.equal(bank.get({a2:'CZ'}),bank.entries.cz);
 for(const input of [null,undefined,'unknown','__proto__','constructor','toString',{}])assert.equal(bank.get(input),null);
 assert.notEqual(bank.get('ch').teaser,bank.get('cz').teaser);
 assert(bank.get('al'),'Albania now has editorial content');
 assert.equal(bank.get('af'),null);
 assert.equal(bank.coverage(['ch','CH','cz','af']).covered,2);
});
test('Coverage report exactly matches every missing country and declared region',()=>{
 const actual=bank.coverage(countries.map(c=>c.id));
 const baseline=JSON.parse(fs.readFileSync(path.join(app,'country-discoveries-coverage.json'),'utf8'));
 assert.equal(bank.version,baseline.release);
 assert.deepEqual(actual,{total:baseline.total,covered:baseline.covered,missing:baseline.missing,complete:baseline.complete},'Coverage report is stale');
 for(const [name,record] of Object.entries(baseline.regions||{})){
   const region=bank.coverage(countries.filter(c=>c.continent===name).map(c=>c.id));
   assert.deepEqual({total:region.total,covered:region.covered,complete:region.complete},record);
 }
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
 const sw=fs.readFileSync(path.join(app,'sw.js'),'utf8');
 assert(sw.includes('-discoveries1-europe2'));
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
