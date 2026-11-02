import test from 'node:test';
import assert from 'node:assert/strict';
// DOM mínimo para testar regras e ligações entre os módulos sem navegador.
const elements=new Map(), storage=new Map();
function element(){return {open:false,textContent:'',innerHTML:'',children:[],replaceChildren(){this.children=[];},append(...b){this.children.push(...b);},setAttribute(){},showModal(){this.open=true;},close(){this.open=false;},addEventListener(){},click(){this.onclick?.();}};}
globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,querySelectorAll(){return [];},addEventListener(){}};
globalThis.localStorage={setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)??null};
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

test('seis cenas ASCII têm câmera, materiais, humanos e efeitos reversíveis', async()=>{
  const { buildFrame, VIEW }=await import('../src/renderer.js');
  const outputs=new Set();
  for(const region of Object.keys(regions)) {
    const s=state.initial('Detetive');s.region=region;
    const a=buildFrame(s,0,true),b=buildFrame(s,1200,true);
    assert.equal(a.length,VIEW.rows);assert.ok(a.every(row=>row.length===VIEW.cols));
    const text=a.map(row=>row.map(c=>c.char).join('')).join('\n');
    assert.ok(text.includes('(oo)'));assert.ok(text.includes('VOCE'));assert.ok(!text.includes('@'));
    assert.notDeepEqual(a,b);assert.deepEqual(buildFrame(s,0,false),buildFrame(s,1200,false));
    outputs.add(text);
    // A câmera também precisa caber nos extremos do mapa.
    s.x=35;s.y=15;assert.equal(buildFrame(s).length,VIEW.rows);
  }
  assert.equal(outputs.size,6);
});
test('mobília colide sem impedir migração de saves anteriores',async()=>{
  const {DECOR}=await import('../src/art.js');
  for(const [region,items]of Object.entries(DECOR))for(const [x,y]of items)assert.equal(world.walk(x,y,region),false);
  const old=state.initial('Médico');delete old.visualVersion;[old.x,old.y]=DECOR.porto[0];old.hp=62;old.clues=['manifesto'];
  const upgraded=save.upgradeVisualSave(old);
  assert.equal(save.validSave(upgraded),true);assert.equal(upgraded.hp,62);assert.deepEqual(upgraded.clues,['manifesto']);assert.equal(upgraded.visualVersion,2);
});
test('canvas recebe quadros e alterna atmosfera sem alterar estado', async()=>{
  const calls=[];
  const ctx={fillRect(){},fillText(char){calls.push(char);}};
  ui.$('scene').getContext=()=>ctx;
  globalThis.window={matchMedia:()=>({matches:false})};
  globalThis.requestAnimationFrame=()=>1;
  const {initRenderer,renderScene}=await import('../src/renderer.js');
  initRenderer();game.start('Detetive');renderScene(state.s);
  assert.ok(calls.length>200);const before=JSON.stringify(state.s);
  ui.$('effects').onclick();assert.equal(JSON.stringify(state.s),before);assert.equal(ui.$('effects').textContent,'Atmosfera: estática');
});

test('orçamento inicial, limites, evolução e recompensas sem repetição',async()=>{
  const {createRpg,spend,validRpg,award}=await import('../src/rpg.js');
  const r=createRpg();assert.equal(r.points,10);
  for(let i=0;i<4;i++)assert.equal(spend(r,'investigation'),true);
  assert.equal(spend(r,'investigation'),false);assert.equal(spend(r,'medicine',-1,true),false);
  for(let i=0;i<4;i++)spend(r,'medicine');for(let i=0;i<2;i++)spend(r,'strength');
  assert.equal(r.points,0);assert.equal(spend(r,'awareness'),false);assert.equal(validRpg(r),true);
  assert.equal(spend(r,'strength',-1),false);assert.equal(spend(r,'strength',-1,true),true);
  const st={rpg:r,log:[]};assert.equal(award(st,'unique',100),1);assert.equal(r.level,2);assert.equal(r.points,3);assert.equal(award(st,'unique',100),0);assert.equal(validRpg(r),true);
});
test('atributos mudam cura, medo, análise de pistas e iluminação',async()=>{
  const {spend,healing,occultCost,uncover}=await import('../src/rpg.js');
  const {buildFrame}=await import('../src/renderer.js');
  game.start('Detetive');state.s.clues=['manifesto'];assert.equal(uncover(state.s,'manifesto'),false);
  spend(state.s.rpg,'investigation');spend(state.s.rpg,'investigation');assert.equal(uncover(state.s,'manifesto'),true);assert.equal(uncover(state.s,'manifesto'),false);
  const lowHeal=healing(state.s),lowCost=occultCost(state.s);spend(state.s.rpg,'medicine');spend(state.s.rpg,'occultism');assert.ok(healing(state.s)>lowHeal);assert.ok(occultCost(state.s)<lowCost);
  const lowLight=buildFrame(state.s,0,false);spend(state.s.rpg,'awareness');spend(state.s.rpg,'awareness');assert.notDeepEqual(lowLight,buildFrame(state.s,0,false));
});
test('força, psicologia e eloquência alteram resultados de diálogos',async()=>{
  const {spend}=await import('../src/rpg.js');
  game.start('Detetive');spend(state.s.rpg,'strength');spend(state.s.rpg,'strength');story.talk('medica');pick(2);assert.equal(state.s.hp,100);assert.equal(state.s.flags.tunnel,true);
  game.start('Detetive');story.talk('sobrevivente');assert.equal(ui.$('modalActions').children[2].disabled,true);spend(state.s.rpg,'psychology');spend(state.s.rpg,'psychology');story.talk('sobrevivente');pick(2);assert.equal(state.s.trust,2);assert.equal(state.s.flags.burn,true);
  game.start('Detetive');story.talk('mara');assert.equal(ui.$('modalActions').children[1].disabled,true);spend(state.s.rpg,'eloquence');spend(state.s.rpg,'eloquence');story.talk('mara');pick(1);assert.equal(state.s.flags.mara,true);
});
test('save antigo recebe sete atributos sem perder decisões',async()=>{
  game.start('Médico');state.s.flags.saved=true;delete state.s.rpg;save.autosave();save.load();assert.equal(Object.keys(state.s.rpg.skills).length,7);assert.equal(state.s.rpg.points,10);assert.equal(state.s.flags.saved,true);assert.equal(save.validSave(state.s),true);
});
test('criação confirma apenas depois de gastar 10 pontos e não altera partida antes disso',async()=>{
  const {characterSheet}=await import('../src/rpg-ui.js');
  game.start('Médico');const old=state.s;characterSheet('Detetive');assert.equal(ui.$('modalActions').children[0].disabled,true);assert.equal(state.s,old);
  // A cada clique a interface é reconstruída. Acessa a última versão do editor.
  function editor(){return ui.$('modalText').children.at(-1);}
  function add(index){const row=editor().children[index+1],controls=row.children[1];controls.children.at(-1).onclick();}
  for(let i=0;i<4;i++)add(0);for(let i=0;i<4;i++)add(1);for(let i=0;i<2;i++)add(2);
  assert.equal(ui.$('modalActions').children[0].disabled,false);pick(0);assert.equal(state.s.role,'Detetive');assert.equal(state.s.rpg.points,0);assert.equal(state.s.rpg.skills.medicine,5);
});
