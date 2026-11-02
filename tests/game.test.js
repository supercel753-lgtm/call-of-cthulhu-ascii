import test from 'node:test';
import assert from 'node:assert/strict';
// DOM mínimo para testar regras e ligações entre os módulos sem navegador.
const elements=new Map(), storage=new Map();
function element(){return {open:false,textContent:'',innerHTML:'',children:[],replaceChildren(){this.children=[];},append(b){this.children.push(b);},setAttribute(){},showModal(){this.open=true;},close(){this.open=false;},addEventListener(){},click(){this.onclick?.();}};}
globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,querySelectorAll(){return [];},addEventListener(){}};
globalThis.localStorage={setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)};
const state=await import('../src/state.js');
const game=await import('../src/game.js');
const story=await import('../src/story.js');
const ui=await import('../src/ui.js');
const world=await import('../src/world.js');
const save=await import('../src/storage.js');
const {regions,clues}=await import('../src/data.js');
function pick(i){const b=ui.$('modalActions').children[i];assert.ok(b&&!b.disabled);b.onclick();}
test('inicialização por módulos e retorno sem save',async()=>{await import('../src/main.js');assert.equal(ui.$('modal').open,true);pick(1);pick(0);assert.equal(ui.$('modalTitle').textContent,'O mar lembra');});
test('todos os pontos de interesse dos seis mapas são acessíveis',()=>{for(const id of Object.keys(regions)){state.setState(state.initial('Detetive'));state.s.region=id;const r=regions[id],q=[r.start],seen=new Set([r.start.join(',')]);while(q.length){const [x,y]=q.shift();for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(world.walk(nx,ny,id)&&!seen.has(k)){seen.add(k);q.push([nx,ny]);}}}for(const o of r.objects)assert.ok(seen.has(o[1]+','+o[2]),o[0]);}});
test('sequência de decisões libera revelação e evacuação',()=>{game.start('Detetive');game.activate('manifesto');story.talk('marinheiro');pick(0);story.talk('mara');pick(0);for(const id of ['jornal','quadro','diario'])game.activate(id);story.talk('sobrevivente');pick(0);game.activate('prontuario');story.talk('medica');pick(1);story.talk('cela');pick(0);game.activate('selo');game.activate('inscricao');story.ritual();pick(1);assert.equal(state.s.ending,'revelar');});
test('outros três finais e bloqueio de requisitos',()=>{for(const [ending,index]of [['selar',0],['espelho',2],['chamado',3]]){game.start('Ocultista');state.s.clues=Object.keys(clues);state.s.occ=65;story.ritual();pick(index);assert.equal(state.s.ending,ending);}game.start('Detetive');story.ritual();assert.equal(ui.$('modalActions').children[0].disabled,true);assert.equal(ui.$('modalActions').children[1].disabled,true);assert.equal(ui.$('modalActions').children[2].disabled,true);});
test('save mantém estado e rejeita dados incompatíveis',()=>{game.start('Médico');state.s.hp=45;save.autosave();state.s.hp=1;save.load();assert.equal(state.s.hp,45);assert.equal(save.validSave(state.s),true);assert.equal(save.validSave({...state.s,y:1.5}),false);assert.equal(save.validSave({...state.s,clues:['selo','selo']}),false);assert.equal(save.validSave({version:99}),false);});
test('perseguição causa dano; derrota encerra a partida',()=>{game.start('Detetive');game.enter('grutas');ui.$('modal').close();state.s.x=29;state.s.y=8;state.s.turn=1;game.tick();assert.equal(state.s.hp,88);state.s.hp=1;state.s.x=30;state.s.y=3;game.tick();assert.equal(state.s.ending,'perdido');});
