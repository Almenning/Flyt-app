'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {exactWebpDimensions,plan}=require('../tools/laria_grovanova_import_approved.cjs');
test('approved Grovanova importer reads VP8 WebP dimensions without re-encoding',()=>{
 const b=Buffer.alloc(40);b.write('RIFF',0,'ascii');b.write('WEBP',8,'ascii');b.write('VP8 ',12,'ascii');
 b[23]=0x9d;b[24]=0x01;b[25]=0x2a;
 b.writeUInt16LE(2048,26);b.writeUInt16LE(2732,28);
 assert.deepEqual(exactWebpDimensions(b),[2048,2732]);
 b.writeUInt16LE(1536,28);
 assert.deepEqual(exactWebpDimensions(b),[2048,1536]);
 b[23]=0;
 assert.throws(()=>exactWebpDimensions(b),/Invalid VP8/);
});
test('asset import refuses missing source directory before writing anything',()=>{
 assert.throws(()=>plan(null),/Supply the directory/);
 assert.throws(()=>plan('/this-directory-should-not-exist-20261118'),/ENOENT/);
});
