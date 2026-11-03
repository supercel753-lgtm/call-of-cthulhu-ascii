import {award,healing,occultCost,INSIGHTS} from './rpg.js';
import {playEffect,changeRegion} from './audio.js';
import {triggerInteraction} from './renderer.js';
import {characterSheet,inspectClue} from './rpg-ui.js';
// Ecos do Abismo — todos os direitos reservados. Consulte LICENSE.
import { regions, clues } from "./data.js";
import { s, setState, initial, log, clamp } from "./state.js";
import { autosave } from "./storage.js";
import { talk, finish } from "./story.js";
import { $, show, render } from "./ui.js";
import { walk, nearby, nextStep, gate } from "./world.js";

export function newGame(){show('Uma carta sem remetente','1928. Uma carta pede que você encontre um homem desaparecido em 1922. Na mesma noite, uma pintora sonha com o seu rosto. Duas investigações levam à ilha de São Breu.\n\nEscolha seu passado e depois distribua 10 pontos entre sete atributos. O passado não impõe sua distribuição. O Ocultista começa com 20 de conhecimento proibido, um recurso separado dos atributos. Os testes mostram os requisitos antes da escolha.',[
 ['Detetive · passado policial',()=>characterSheet('Detetive')],['Médico · formação clínica',()=>characterSheet('Médico')],['Ocultista · reconhece rituais; começa com 20 de conhecimento',()=>characterSheet('Ocultista')]
]);}

export function start(role,rpg=null){setState(initial(role));if(rpg)s.rpg=rpg;if(role==='Ocultista')s.occ=20;log('Você desembarca com uma carta úmida e duas ataduras.');enter('porto');}

export function enter(id){changeRegion(id);s.region=id;[s.x,s.y]=regions[id].start;if(!s.seen[id]){s.seen[id]=true;award(s,'region:'+id,20);log(regions[id].desc);if(id==='grutas'){s.san-=10;s.enemies.grutas=[{x:30,y:8}];log('Uma silhueta bloqueia a câmara. Furtividade reduz o alcance de detecção.');playEffect('creature');}if(id==='hospital')s.enemies.hospital=[{x:30,y:3}];}render();autosave();}

export function tick(){s.turn++;for(const e of s.enemies[s.region]||[]){const dist=Math.abs(e.x-s.x)+Math.abs(e.y-s.y);if(dist<=(s.sneak?3:9)&&s.turn%2===0){[e.x,e.y]=nextStep(e,s);}if(e.x===s.x&&e.y===s.y){s.hp-=12;s.san-=4;log('A criatura alcança você: -12 vitalidade, -4 sanidade.');e.x=30;e.y=3;playEffect('damage');}}
if(s.san<30&&s.turn%9===0){s.hp-=2;log('O pânico aperta seu peito. -2 vitalidade.');}clamp();if(s.hp<=0)finish('perdido');render();autosave();}

export function move(dx,dy){if(!s||s.ending||$('modal').open)return;s.facing=dx>0?'east':dx<0?'west':dy<0?'north':'south';if(walk(s.x+dx,s.y+dy)){s.x+=dx;s.y+=dy;playEffect('step');tick();}else{log('O caminho está bloqueado.');render();}}

export function interact(){if(!s||s.ending||$('modal').open)return;const near=nearby();if(!near.length){log('Nada ao alcance. Fique ao lado de uma pista, pessoa ou passagem.');render();return;}if(near.length>1){show('Examinar', 'Escolha um ponto de interesse.',near.map(o=>[o[4],()=>activate(o[0])]));}else activate(near[0][0]);}

export function activate(id){triggerInteraction();if(regions[id]){const lock=gate(id);if(lock)show('Passagem bloqueada',lock);else{playEffect('door');enter(id);}return;}if(clues[id]){if(s.clues.includes(id)){show(clues[id][0],clues[id][1],[['Continuar',()=>{}],['Analisar detalhe · teste de atributo',()=>inspectClue(id)]]);return;}s.clues.push(id);playEffect('pickup');award(s,'clue:'+id,40);log('Pista registrada: '+clues[id][0]);if(['quadro','selo','inscricao'].includes(id)){s.occ=Math.min(100,s.occ+15);s.san-=occultCost(s);}show(clues[id][0],clues[id][1]+'\n\n'+(['quadro','selo','inscricao'].includes(id)?'+15 conhecimento / -'+occultCost(s)+' sanidade.':'Adicionado ao diário.')+' +40 XP.',[['Continuar',()=>{}],['Analisar detalhe · teste de atributo',()=>inspectClue(id)]]);render();autosave();return;}playEffect('ui');talk(id);}

export function heal(){if(!s||s.ending||!s.kits||s.hp===100)return;const recovered=Math.min(100-s.hp,healing(s));s.kits--;s.hp+=recovered;playEffect('pickup');clamp();log('Medicina: curativo recuperou '+recovered+' de vitalidade.');tick();}

export function rest(){if(!s||s.ending)return;const key='rest_'+s.region;if(s.flags[key]){show('Sem repouso','Você já reuniu suas forças neste local. Procure outra região.');return;}if((s.enemies[s.region]||[]).some(e=>Math.abs(e.x-s.x)+Math.abs(e.y-s.y)<7)){show('Você está sendo observado','Afaste-se do perseguidor antes de respirar.');return;}s.flags[key]=true;s.san+=15;playEffect('whisper');log('Você controla a respiração. +15 sanidade (uma vez por região).');tick();}
