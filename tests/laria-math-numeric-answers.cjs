'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'laer-litt-mer/index.html'),'utf8');
const start=html.indexOf('function normalizeNumericAnswer(v)');
const end=html.indexOf('function renderNumberInput(q,wrap)',start);
assert.ok(start>=0&&end>start,'find real numeric validator in Læria runtime');
const compare=new Function(html.slice(start,end)+'\nreturn numericalAnswersMatch;')();

test('Læria Maths accepts equivalent decimal answers and old floating-point artifacts',()=>{
  for(const [input,expected] of [
    ['27,5','27,500000000000004'],
    ['220','220.00000000000003'],
    ['3,5','3.5000000000000004'],
    ['27.5','27,5'],
    ['3,00','3'],
    ['0003','3'],
    [' 1 200 ','1200'],
    ['−5','-5'],
    ['0,125','0.125'],
    ['12,50','12.5']
  ])assert.equal(compare(input,expected),true,input+' must equal '+expected);
});
test('Læria Maths rejects wrong numbers, units and malformed input',()=>{
  for(const [input,expected] of [
    ['27,4','27,500000000000004'],
    ['220,1','220.00000000000003'],
    ['30,1','30'],
    ['0','0,1'],
    ['-5','5'],
    ['12kr','12'],
    ['12%','12'],
    ['12abc','12'],
    ['','0'],
    ['  ','0'],
    ['NaN','NaN'],
    ['Infinity','Infinity'],
    ['1e2','100'],
    ['1,2,3','1.23']
  ])assert.equal(compare(input,expected),false,input+' must not equal '+expected);
});

const source=fs.readFileSync(path.join(root,'laer-litt-mer/commercial-content-v18.js'),'utf8');
const browserWindow={};
new Function('window',source)(browserWindow);
const commercial=browserWindow.LARIA_COMMERCIAL_CONTENT_V18;

test('the commercial Maths curriculum has canonical finite number answers for grades 1-10',()=>{
  assert.equal(typeof commercial.math,'function');
  let total=0;
  for(let grade=1;grade<=10;grade++){
    const questions=commercial.math(grade);
    assert.ok(questions.length>=10,'content for grade '+grade);
    for(const q of questions){
      assert.equal(q.type,'number-input');
      const normalized=q.answer.replace(',','.');
      assert.match(normalized,/^-?\d+(?:\.\d+)?$/,'malformed answer for '+q.prompt);
      const n=Number(normalized);
      assert.ok(Number.isFinite(n),'nonfinite answer for '+q.prompt);
      assert.equal(normalized,String(Number(n.toPrecision(12))),'floating-point artifact in '+q.prompt+': '+q.answer);
      total++;
    }
  }
  assert.ok(total>300,'examined actual curriculum answers');
});
test('regression: exact affected decimals are clean for grade 7 and 8',()=>{
  const g7=commercial.math(7);
  const noisy7=g7.find(q=>q.prompt==='0,275 × 100 = ?');
  assert.ok(noisy7);
  assert.equal(noisy7.answer,'27,5');
  const g8=commercial.math(8);
  const noisy8=g8.find(q=>q.prompt==='200 øker med 10 %. Ny verdi?');
  assert.ok(noisy8);
  assert.equal(noisy8.answer,'220');
});
