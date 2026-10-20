import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';

test('every manufacturer form receives the complete CMS catalogue, separately from its explorer',async()=>{
 const directory=new URL('../src/pages/cars/',import.meta.url);
 for(const file of (await readdir(directory)).filter(file=>file.endsWith('.astro'))){
  const page=await readFile(new URL(file,directory),'utf8');
  if(!page.includes('data-manufacturer-page'))continue;
  assert.equal([...page.matchAll(/<QuoteForm\b/g)].length,1,file);
  assert.match(page,/<QuoteForm makes=\{vehicleData.makes\} models=\{vehicleData.models\} years=\{vehicleData.years\}/,file);
  assert.match(page,/<ManufacturerInteractions/,file);
 }
});
