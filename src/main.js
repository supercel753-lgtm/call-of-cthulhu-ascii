import {characterSheet} from './rpg-ui.js';
import { initRenderer, paintFrame } from './renderer.js';
import { PORTRAITS } from './art.js';
// Inicialização e controles de teclado/toque.
import { newGame, move, interact, heal, rest } from "./game.js";
import { s, initial } from "./state.js";
import { KEY, autosave, load } from "./storage.js";
import { $, show, render, journal, world, help, welcome } from "./ui.js";

$('sheet').onclick=()=>characterSheet();$('interact').onclick=interact;$('journal').onclick=journal;$('world').onclick=()=>s&&world();$('heal').onclick=heal;$('rest').onclick=rest;$('help').onclick=help;$('sneak').onclick=()=>{if(s&&!s.ending){s.sneak=!s.sneak;render();autosave();}};$('save').onclick=()=>{if(s){try{localStorage.setItem(KEY,JSON.stringify(s));show('Arquivo preservado','Partida salva neste navegador.');}catch{show('Falha ao salvar','O navegador bloqueou o armazenamento local.');}}};$('load').onclick=load;$('new').onclick=()=>show('Nova investigação','A nova partida substituirá o progresso salvo quando você escolher uma formação.',[['Escolher formação',newGame],['Cancelar',()=>{}]]);
document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>move(...b.dataset.move.split(',').map(Number)));
document.addEventListener('keydown',e=>{if($('modal').open||!s||e.ctrlKey||e.metaKey||e.altKey)return;if(e.target.matches('button,input,select,textarea')&&['Enter',' '].includes(e.key))return;const k=e.key.toLowerCase(),dirs={w:[0,-1],arrowup:[0,-1],s:[0,1],arrowdown:[0,1],a:[-1,0],arrowleft:[-1,0],d:[1,0],arrowright:[1,0]};if(dirs[k]){e.preventDefault();move(...dirs[k]);return;}if(e.repeat)return;const actions={f:()=>characterSheet(),e:interact,j:journal,m:world,h:heal,r:rest,c:()=>$('sneak').click()};if(actions[k]){e.preventDefault();actions[k]();}});
$('modal').addEventListener('cancel',e=>e.preventDefault());
$('playerPortrait').textContent=PORTRAITS.investigator;
initRenderer();
paintFrame(initial("Detetive"));
welcome();
