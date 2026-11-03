import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {regions,clues} from '../src/data.js';
import {DECOR,THEMES} from '../src/art.js';
import {PROP_KINDS,CHARACTERS,TILE_KINDS,buildScene} from '../src/renderer.js';
import {AUDIO_ASSETS} from '../src/audio.js';
import {initial} from '../src/state.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const filepath=p=>path.join(root,p);
function pngInfo(p){const data=fs.readFileSync(filepath(p));assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');return [data.readUInt32BE(16),data.readUInt32BE(20)];}

test('atlases raster originais: tamanhos, spritesheet, variedade regional',()=>{
 assert.equal(Object.keys(regions).length,6);
 assert.deepEqual(pngInfo('assets/sprites/props.png'),[32*PROP_KINDS.length,40]);
 assert.equal(CHARACTERS.length,7);
 for(const id of CHARACTERS)assert.deepEqual(pngInfo(`assets/sprites/${id}.png`),[256,160]);
 for(const id of Object.keys(regions)){
  assert.deepEqual(pngInfo(`assets/tiles/${id}.png`),[32*TILE_KINDS.length,32]);
  assert.deepEqual(pngInfo(`assets/panoramas/${id}.png`),[480,168]);
  assert.ok(THEMES[id].lamps.length>0);
 }
});
test('atlas de mobiliário contém todos os modelos sólidos e pontos de interesse',()=>{
 for(const [region,objects] of Object.entries(DECOR)){
  assert.ok(objects.length>=9);
  for(const [x,y,kind]of objects){assert.ok(PROP_KINDS.includes(kind),kind);assert.equal(buildScene({...initial('Detetive'),region}).map[y][x],'#');}
 }
 for(const [region,r] of Object.entries(regions))for(const [id,, ,type] of r.objects){
  assert.ok(type==='N'||PROP_KINDS.includes(type==='>'?'door':id),region+':'+id);
 }
 assert.equal(Object.keys(clues).length,7);
});
test('faixas WAV próprias existem, têm cabeçalhos PCM legíveis e tamanho coerente',()=>{
 for(const id of [...AUDIO_ASSETS.environments,...AUDIO_ASSETS.effects]){
  const p=filepath(`assets/audio/${id}.wav`),data=fs.readFileSync(p);
  assert.equal(data.subarray(0,4).toString(),'RIFF',id);
  assert.equal(data.subarray(8,12).toString(),'WAVE',id);
  assert.equal(data.readUInt16LE(22),1,id+' mono');
  assert.equal(data.readUInt32LE(24),16000,id+' taxa 16 kHz');
  assert.ok(data.length>2000,id+' duração não vazia');
 }
});
test('imports relativos ES Modules apontam para arquivos existentes',()=>{
 const files=fs.readdirSync(filepath('src')).filter(x=>x.endsWith('.js'));
 for(const f of files){
  const content=fs.readFileSync(filepath('src/'+f),'utf8');
  const imports=[...content.matchAll(/\b(?:from\s*|import\s*\()\s*['"](\.[^'"\s]+)['"]/g)];
  for(const m of imports)assert.ok(fs.existsSync(path.resolve(filepath('src'),m[1])),f+' => '+m[1]);
 }
});
test('HTML e CSS usam cena e minimapa Canvas, com pixel art sem glifos de cenário',()=>{
 const h=fs.readFileSync(filepath('index.html'),'utf8'),c=fs.readFileSync(filepath('src/style.css'),'utf8');
 assert.match(h,/<canvas id="scene"/);assert.match(h,/<canvas id="map"/);
 assert.doesNotMatch(h,/<pre id="map"/);
 assert.match(c,/image-rendering:pixelated/);assert.match(c,/@media\(max-width:540px\)/);
 assert.ok(!fs.existsSync(filepath('.nojekyll')),'GitHub Pages mantém Jekyll');
});
