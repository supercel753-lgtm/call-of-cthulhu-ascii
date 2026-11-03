import {SKILLS,value} from './rpg.js';
import {renderScene,portraitFor,PROP_KINDS} from './renderer.js';
import {regions,clues} from './data.js';
import {newGame,heal} from './game.js';
import {s,log,clamp} from './state.js';
import {autosave,load} from './storage.js';
import {getAudioSettings,toggleMute,setVolume,playEffect} from './audio.js';
import {nearby} from './world.js';
export const $=id=>document.getElementById(id);

/** A mesma interface de opções antigas; apenas a apresentação foi remasterizada. */
export function show(title,text,choices=[['Continuar',()=>{}]]){
 $('modalTitle').textContent=title;
 const portrait=$('dialogPortrait');
 if(portrait){if(!portrait.style)portrait.style={};portrait.style.backgroundImage=`url('${portraitFor(title)}')`;portrait.setAttribute?.('aria-label','Ilustração original em pixel art relacionada a '+title);}
 $('modalText').textContent=text;
 $('modalActions').replaceChildren();
 choices.forEach(([label,fn,enabled=true])=>{
  const b=document.createElement('button');b.textContent=label;b.disabled=!enabled;
  b.onclick=()=>{$('modal').close();playEffect('ui');fn();if(s){clamp();render();autosave();}};
  $('modalActions').append(b);
 });
 if(!$('modal').open)$('modal').showModal();
}
export function objective(){
 if(!s.clues.includes('manifesto'))return 'Encontre o manifesto no porto. Aproxime-se do documento marcado como PISTA.';
 if(!s.flags.mara)return 'Converse com Mara na vila para acessar a mansão.';
 if(!s.clues.includes('diario'))return 'Investigue o diário na mansão Vesper.';
 if(!s.flags.tunnel)return 'Obtenha acesso ao túnel com a médica do hospital.';
 if(!s.clues.includes('selo')||!s.clues.includes('inscricao'))return 'Procure o selo e a inscrição nas grutas.';
 return 'Chegue ao farol e decida o destino da ilha.';
}
function resource(label,valueText,kind){return `<div class="quick-resource"><span class="resource-square ${kind}"></span><span>${label}</span><b>${valueText}</b></div>`;}
function bar(label,amount,cls){const v=Math.max(0,Math.min(100,Number(amount)||0));return `<div class="stat ${cls}">${label} <strong>${v}/100</strong><div class="bar-meter" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${v}"><span style="width:${v}%"></span></div></div>`;}
export function render(){
 if(!s)return;
 const r=regions[s.region];renderScene(s);
 $('location').textContent=r.name;
 $('chapter').textContent='CAMPANHA / '+s.role.toUpperCase()+' / TURNO '+s.turn;
 $('description').textContent=r.desc;
 const status=$('cameraStatus');if(status)status.textContent=s.region.toUpperCase();
 const near=nearby();$('near').textContent=near.length?'AO ALCANCE: '+near.map(o=>o[4]).join(' · '):'Explore com WASD ou setas. Aproxime-se de uma pessoa, objeto ou passagem e pressione E.';
 $('stats').innerHTML=bar('VITALIDADE',s.hp,'health')+bar('SANIDADE',s.san,'sanity')+bar('CONHECIMENTO PROIBIDO',s.occ,'occult');
 $('rpgSummary').textContent=`Nível ${s.rpg.level} · XP ${s.rpg.xp}/100 · ${s.rpg.points} pontos livres`;
 $('skillsSummary').textContent=Object.entries(SKILLS).map(([key,def])=>`${def.name} ${value(s,key)}/5`).join('  ·  ');
 $('objective').textContent=s.ending?'Investigação encerrada. Leia o diário ou inicie outra partida.':objective();
 $('inventory').innerHTML=resource('PISTAS',`${s.clues.length}/7`,'')+resource('CURATIVOS',s.kits,'med')+resource('CONFIANÇA',s.trust,'trust')+resource('NÍVEL',s.rpg.level,'lvl');
 $('log').replaceChildren();s.log.slice(0,11).forEach(t=>{const p=document.createElement('p');p.textContent=t;$('log').append(p);});
 const hidden=r.objects.find(o=>o[3]==='?'&&!s.clues.includes(o[0])&&Math.abs(o[1]-s.x)+Math.abs(o[2]-s.y)<=value(s,'awareness')+1);
 if(hidden&&!near.length)$('near').textContent+=' VISÃO: algo chama atenção '+(hidden[2]<s.y?'ao norte':hidden[2]>s.y?'ao sul':hidden[1]<s.x?'a oeste':'a leste')+'.';
 $('sneak').innerHTML=`FURTIVIDADE <kbd>C</kbd> · ${s.sneak?'ATIVA':'DESATIVADA'}`;
 $('heal').disabled=s.kits<=0||!!s.ending;
 $('interact').disabled=!!s.ending;
}
function node(type,classname,text){const el=document.createElement(type);if(classname)el.className=classname;if(text!==undefined)el.textContent=text;return el;}
function appendCaseFiles(target,ids){
 const board=node('div','caseboard');
 for(const id of ids){
  const item=node('div','casefile');item.append(node('strong',null,clues[id][0]));
  item.append(node('p',null,clues[id][1]));
  if(s.rpg?.insights?.includes(id)){item.append(node('small',null,'ANÁLISE ESPECIALIZADA CONFIRMADA'));}
  board.append(item);
 }
 target.append(board);
}
export function journal(){
 if(!s)return;
 show('Dossiê de investigação',s.clues.length?`DOCUMENTOS RECUPERADOS · ${s.clues.length} DE 7\nAs evidências abaixo permanecem no arquivo até o fim da investigação.`:'Nenhuma pista foi registrada. Vasculhe os ambientes marcados com objetos iluminados.',[['Retomar a investigação',()=>{}]]);
 if(s.clues.length)appendCaseFiles($('modalText'),s.clues);
 const events=node('div','caseboard');events.append(node('p','eyebrow','REGISTROS E DECISÕES'));
 s.log.slice().reverse().forEach(t=>{const p=node('div','casefile');p.append(node('p',null,t));events.append(p);});
 $('modalText').append(events);
}
export function world(){
 if(!s)return;
 show('Carta da ilha de São Breu','O acesso entre regiões é feito pelas passagens do cenário. As portas e condições narrativas permanecem inalteradas.',[['Fechar carta',()=>{}]]);
 const board=node('div','inventory-board');
 for(const [id,r] of Object.entries(regions)){
  const card=node('div','inventory-card');
  const img=node('img');img.src=`./assets/panoramas/${id}.png`;img.width=82;img.height=33;img.alt='Panorama de '+r.name;if(!img.style)img.style={};img.style.imageRendering='pixelated';
  const text=node('div');text.append(node('strong',null,r.name),node('small',null,s.seen[id]?'VISITADO':'NÃO VISITADO'));
  card.append(img,text);board.append(card);
 }
 $('modalText').append(board);
}
function inventoryCard(label,detail,kind,present=true){
 const card=node('div','inventory-card'+(present?'':' missing'));
 const art=node('div','pixel-object');if(!art.style)art.style={};art.style.backgroundPosition=`-${PROP_KINDS.indexOf(kind)*48}px 0`;
 card.append(art);
 const info=node('div');info.append(node('strong',null,label),node('small',null,detail));card.append(info);return card;
}
export function inventoryView(){
 if(!s)return;
 show('Inventário de campo','Recursos e documentos encontrados durante a investigação. Pistas essenciais não são consumidas.',[['Fechar inventário',()=>{}]]);
 const board=node('div','inventory-board');
 board.append(inventoryCard('Curativos',`${s.kits} unidade(s) · restauram vitalidade`,'prontuario',s.kits>0));
 board.append(inventoryCard('Correspondência','Uma carta úmida, sem remetente','manifesto'));
 board.append(inventoryCard('Selo partido',s.clues.includes('selo')?'Obtido nas grutas':'Ainda não descoberto','selo',s.clues.includes('selo')));
 board.append(inventoryCard('Contramaré',s.clues.includes('inscricao')?'Inscrição recuperada':'Ainda não descoberta','inscricao',s.clues.includes('inscricao')));
 for(const id of s.clues){const kinds={manifesto:'manifesto',jornal:'jornal',quadro:'quadro',diario:'diario',prontuario:'prontuario'};
  if(kinds[id])board.append(inventoryCard(clues[id][0],'Evidência registrada no diário',kinds[id]));
 }
 $('modalText').append(board);
}
export function syncAudioButton(){const b=$('audioToggle');if(!b)return;const a=getAudioSettings();b.textContent=a.muted?'SOM: SILENCIADO':'SOM: LIGADO';b.setAttribute('aria-pressed',String(!a.muted));}
export function settingsView(){
 show('Configurações','Ajustes da apresentação. As opções de áudio e efeitos são salvas neste navegador e não alteram seu progresso.',[['Retomar investigação',()=>{}]]);
 const settings=node('div','settings-group');
 const label=node('label',null,'VOLUME');const control=node('input');control.type='range';control.min='0';control.max='100';control.step='1';control.value=String(Math.round(getAudioSettings().volume*100));
 const out=node('output',null,control.value+'%');
 control.oninput=()=>{setVolume(Number(control.value)/100);out.textContent=control.value+'%';syncAudioButton();};
 control.onchange=control.oninput;
 settings.append(label,control,out);$('modalText').append(settings);
 const controls=node('div','settings-group');const mute=node('button',null,getAudioSettings().muted?'ATIVAR SOM':'SILENCIAR SOM');
 mute.onclick=()=>{toggleMute();syncAudioButton();mute.textContent=getAudioSettings().muted?'ATIVAR SOM':'SILENCIAR SOM';};
 const fx=node('button',null,'ALTERNAR EFEITOS');fx.onclick=()=>$('effects').click();
 controls.append(mute,fx);$('modalText').append(controls);
 $('modalText').append(node('p','setting-caption','A taxa de atualização pode chegar a 60 FPS, quando disponível. O botão Efeitos reduz a animação e respeita a preferência de movimento reduzido do sistema.'));
}
export function pauseGame(){
 if(!s)return;
 show('Investigação pausada','Você está a salvo enquanto a caixa de diálogo está aberta. A passagem do tempo no jogo continua sendo por turnos.',[
 ['Retomar a exploração',()=>{}],['Configurações de áudio e vídeo',settingsView],['Inventário',inventoryView],['Salvar arquivo',()=>{autosave();show('Arquivo preservado','Progresso armazenado neste navegador.');}],['Voltar ao menu inicial',welcome]
 ]);
}
export function help(){
 show('Como sobreviver','F: atributos. WASD ou setas: caminhar. E: interagir. I: inventário. Esc: pausar. C: alternar furtividade. H: curativo. R: respirar. J: diário. M: carta da ilha.\n\nA exploração é por turnos. Criaturas avançam a cada dois movimentos quando você está ao alcance: nove quadrados normalmente e três na furtividade. Diálogos suspendem a ação.\n\nLuz e visão ajudam a encontrar pistas, mas não revelam áreas separadas por paredes. Curativos recuperam vitalidade conforme Medicina. Respirar recupera 15 de sanidade uma vez por região, longe dos perseguidores.\n\nXP: 20 por região inédita, 40 por pista principal, 25 por decisão e 30 por análise extra. Cada 100 XP concede dois pontos. As sete pistas e quatro finais permanecem acessíveis conforme suas decisões.\n\nO jogo salva automaticamente no navegador. Não há combate armado: sobreviva investigando, negociando e fugindo.');
}
export function welcome(){
 show('O mar lembra','1928. Uma cidade da costa deixou um homem sem passado. Uma ilha deixou uma pintora sem futuro. Você recebeu a carta que liga os dois.\n\nECOS DO ABISMO · NOCTURNE PIXEL REMASTER\nCampanha original de horror cósmico e investigação.\nConteúdo: confinamento, perseguição e perda de sanidade.',[
 ['Começar investigação',newGame],['Continuar partida',load],['Controles',()=>show('Controles','WASD / setas: movimento. E: interagir. F: ficha. J: diário. I: inventário. C: furtividade. H: curativo. R: respirar. M: ilha. Esc: pausa.\nHá controles de toque em telas pequenas.',[['Voltar',welcome]])]
 ]);
}
