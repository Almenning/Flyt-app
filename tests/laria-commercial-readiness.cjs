const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'laer-litt-mer', 'index.html'), 'utf8');
const norwegianContent = fs.readFileSync(path.join(ROOT, 'laer-litt-mer', 'norwegian-content.js'), 'utf8');
const commercialContent = fs.readFileSync(path.join(ROOT, 'laer-litt-mer', 'commercial-content-v1.js'), 'utf8');

function extractFunction(source, name) {
  const marker = 'function ' + name + '(';
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, 'Missing function ' + name);
  const brace = source.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error('Unclosed function ' + name);
}

function extractConstExpression(source, name, openChar, closeChar) {
  const matcher = new RegExp('\\bconst\\s+' + name + '\\s*=');
  const match = matcher.exec(source);
  const start = match ? match.index : -1;
  assert.notEqual(start, -1, 'Missing const ' + name);
  const open = source.indexOf(openChar, start + match[0].length);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === openChar) depth += 1;
    if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error('Unclosed const ' + name);
}

function buildAuditRuntime() {
  const context = {
    console,
    window: null,
    CustomEvent: function CustomEvent(type) { this.type = type; },
    dispatchEvent: () => true,
  };
  context.window = context;
  vm.createContext(context);

  const prelude = `
    const CURRICULUM={norwegian:'NOR01-08',math:'MAT01-06',english:'ENG01-06'};
    function shuffle(items){return Array.isArray(items)?items.slice():items}
    let __auditRandState=0x12345678;\n    function rand(min,max){\n      __auditRandState=(Math.imul(__auditRandState,1664525)+1013904223)>>>0;\n      const lo=Number(min),hi=Number(max);\n      return lo+(__auditRandState%(hi-lo+1));\n    }
    function choiceQuestion(subject,skill,prompt,answer,options,extra={}){
      return Object.assign({subject,skill,type:'learning-choice',prompt,answer:String(answer),options:(options||[]).map(String),curriculum:CURRICULUM[subject]},extra);
    }
    function numberInputQuestion(skill,prompt,answer,extra={}){
      return Object.assign({subject:'math',skill,type:'number-input',prompt,answer:String(answer),curriculum:CURRICULUM.math},extra);
    }
    function sequenceOrderQuestion(skill,prompt,items,answerItems,extra={}){
      return Object.assign({subject:'math',skill,type:'sequence-order',prompt,items:(items||[]).map(String),answer:(answerItems||[]).map(String).join('|'),curriculum:CURRICULUM.math},extra);
    }
    function makeEnglishBuild(word,emoji){
      return {subject:'english',skill:'spelling',type:'build-word',prompt:'Build the word',answer:word,letters:String(word).split('').map((l,i)=>({l,id:i})),visual:emoji,curriculum:CURRICULUM.english};
    }
    function makeBuildWord(word,emoji='🔤',skill='word-building'){
      const letters=String(word).toUpperCase().replace(/[^A-ZÆØÅ]/g,'').split('');
      return {subject:'norwegian',skill,type:'build-word',prompt:'Bygg ordet',answer:letters.join(''),letters:letters.map((l,i)=>({l,id:i})),visual:emoji,curriculum:CURRICULUM.norwegian};
    }
    function jSkill(id,title,skills,module,copy=''){return {id,type:'skill',title,skills:Array.isArray(skills)?skills:[skills],module,copy}}
    function jArea(id,title,emoji,module,skillNodes,copy=''){
      const areaSkills=[...new Set(skillNodes.flatMap(n=>n.skills||[]))];
      return {id,title,emoji,module,copy,areaSkills,nodes:[
        ...skillNodes,
        {id:id+'-challenge',type:'challenge',title:'Utfordring',skills:areaSkills,module},
        {id:id+'-review',type:'review',title:'Husker du?',skills:areaSkills,module},
        {id:id+'-checkpoint',type:'checkpoint',title:'Trofé',skills:areaSkills,module}
      ]};
    }
  `;

  const runtime = [
    prelude,
    extractFunction(html, 'mathPool'),
    extractFunction(html, 'englishPool'),
    norwegianContent
  ].join('\n');
  vm.runInContext(runtime, context, { filename: 'laria-commercial-audit-runtime.js' });
  vm.runInContext(commercialContent, context, { filename: 'commercial-content-v1.js' });
  vm.runInContext('globalThis.__mathPool=mathPool;globalThis.__englishPool=englishPool;globalThis.__norwegianPool=window.buildNorwegianPool;', context);

  const journeyExpr = extractConstExpression(html, 'JOURNEY_TEMPLATES', '{', '}');
  vm.runInContext('const JOURNEY_TEMPLATES=' + journeyExpr + ';globalThis.__journeys=JOURNEY_TEMPLATES;', context);

  const countriesExpr = extractConstExpression(html, 'WORLD_COUNTRIES', '[', ']');
  vm.runInContext('globalThis.__countries=' + countriesExpr + ';', context);

  return context;
}

function questionIdentity(q) {
  return [q.subject, q.skill, q.type, q.prompt, q.answer, q.passage || '', q.visual || ''].join('|');
}

function summarizePool(pool) {
  const unique = new Map();
  for (const q of pool) unique.set(questionIdentity(q), q);
  const bySkill = {};
  const byType = {};
  for (const q of unique.values()) {
    bySkill[q.skill] = (bySkill[q.skill] || 0) + 1;
    byType[q.type] = (byType[q.type] || 0) + 1;
  }
  return {
    total: pool.length,
    unique: unique.size,
    skills: Object.keys(bySkill).sort(),
    bySkill,
    byType,
  };
}

function templateFor(journeys, subject, grade) {
  return (journeys[subject] || []).find(t => grade >= t.min && grade <= t.max);
}

function expectedSkills(journeys, subject, grade) {
  const template = templateFor(journeys, subject, grade);
  assert.ok(template, 'Missing journey template for ' + subject + ' grade ' + grade);
  return [...new Set(template.areas.flatMap(area =>
    area.nodes.filter(node => node.type === 'skill').flatMap(node => node.skills || [])
  ))].sort();
}

test('Prompt 18 commercial content audit exposes real launch readiness', () => {
  const runtime = buildAuditRuntime();
  const subjects = {
    norwegian: runtime.__norwegianPool,
    math: runtime.__mathPool,
    english: runtime.__englishPool,
  };

  const report = { generatedAt: new Date().toISOString(), subjects: {}, geography: {}, blockers: [] };

  for (const [subject, poolFactory] of Object.entries(subjects)) {
    report.subjects[subject] = {};
    for (let grade = 1; grade <= 10; grade += 1) {
      const samples = subject === 'math' ? 40 : 1;
      const pool = [];
      for (let sample = 0; sample < samples; sample += 1) pool.push(...poolFactory(grade, null));
      const summary = summarizePool(pool);
      const expected = expectedSkills(runtime.__journeys, subject, grade);
      const missing = expected.filter(skill => !summary.bySkill[skill]);
      const thin = expected
        .filter(skill => summary.bySkill[skill] && summary.bySkill[skill] < 5)
        .map(skill => ({ skill, count: summary.bySkill[skill] }));
      report.subjects[subject][grade] = { ...summary, expectedSkills: expected, missing, thin };

      assert.ok(summary.unique >= 5, subject + ' grade ' + grade + ' has fewer than five unique questions');
      assert.deepEqual(missing, [], subject + ' grade ' + grade + ' journey advertises skills with no questions: ' + missing.join(', '));

      if (thin.length) {
        report.blockers.push({
          kind: 'thin-skill-bank',
          subject,
          grade,
          details: thin,
          message: 'Journey skill has fewer than five own unique questions and may borrow unrelated questions to fill a session.'
        });
      }
      assert.deepEqual(thin, [], subject + ' grade ' + grade + ' has journey skills with fewer than five own questions: ' + JSON.stringify(thin));
    }
  }

  const countries = runtime.__countries || [];
  const ids = new Set();
  const continentCounts = {};
  const countryProblems = [];
  for (const c of countries) {
    const disputedCapital = !!(c && !c.capital && /omstridt/i.test(String(c.note || '')));
    const missingCore = !c || !c.id || !c.name || !c.continent || (!c.capital && !disputedCapital)
      || !Number.isFinite(Number(c.lat)) || !Number.isFinite(Number(c.lon))
      || !Number.isFinite(Number(c.population)) || Number(c.population) <= 0;
    if (missingCore) {
      countryProblems.push(c && c.id ? c.id : '<unknown>');
      continue;
    }
    if (ids.has(c.id)) countryProblems.push('duplicate:' + c.id);
    ids.add(c.id);
    continentCounts[c.continent] = (continentCounts[c.continent] || 0) + 1;
  }
  report.geography = {
    countries: countries.length,
    uniqueIds: ids.size,
    continentCounts,
    countryProblems,
  };
  assert.equal(countryProblems.length, 0, 'Geography country dataset has missing/duplicate core metadata');
  for (const continent of ['Europa','Asia','Afrika','Nord-Amerika','Sør-Amerika','Oseania']) {
    assert.ok((continentCounts[continent] || 0) > 0, 'Missing geography coverage for ' + continent);
  }

  const commercialSignals = {
    subscription: /abonnement|subscription/i.test(html),
    payment: /betaling|purchase|storekit|paywall/i.test(html),
    terms: /vilkår|terms of use|terms/i.test(html),
    privacy: /personvern|privacy/i.test(html),
    parentArea: /Foreldreområde|Til foreldre/i.test(html),
    localOnlyProgress: /lagres lokalt|localStorage/i.test(html),
  };
  report.commercialSignals = commercialSignals;
  if (!commercialSignals.subscription || !commercialSignals.payment) {
    report.blockers.push({
      kind: 'monetization',
      message: 'No subscription/payment entitlement flow is present in the active Læria runtime.'
    });
  }
  if (!commercialSignals.terms) {
    report.blockers.push({
      kind: 'legal',
      message: 'No Terms/Vilkår surface is present in the active Læria runtime.'
    });
  }

  console.log('LARIA_PROMPT18_AUDIT=' + JSON.stringify(report));
});
