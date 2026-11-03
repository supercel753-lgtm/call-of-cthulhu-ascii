import {characterSheet} from './rpg-ui.js';
import {initRenderer,paintFrame} from './renderer.js';
import {newGame,move,interact,heal,rest} from './game.js';
import {s,initial} from './state.js';
import {KEY,autosave,load} from './storage.js';
import {$,show,render,journal,world,help,welcome,inventoryView,settingsView,pauseGame,syncAudioButton} from './ui.js';
import {unlockAudio,toggleMute} from './audio.js';

$('sheet').onclick=()=>characterSheet();
$('interact').onclick=interact;
$('journal').onclick=journal;
$('inventoryBtn').onclick=inventoryView;
$('world').onclick=()=>s&&world();
$('pause').onclick=()=>s?pauseGame():welcome();
$('settings').onclick=settingsView;
$('heal').onclick=heal;
$('rest').onclick=rest;
$('help').onclick=help;
$('audioToggle').onclick=()=>{unlockAudio();toggleMute();syncAudioButton();};
$('sneak').onclick=()=>{if(s&&!s.ending){s.sneak=!s.sneak;render();autosave();}};
$('save').onclick=()=>{if(s){try{localStorage.setItem(KEY,JSON.stringify(s));show('Arquivo preservado','Partida salva neste navegador.');}catch{show('Falha ao salvar','O navegador bloqueou o armazenamento local.');}}};
$('load').onclick=load;
$('new').onclick=()=>show('Nova investigação','A nova partida substituirá o progresso salvo quando você escolher uma formação.',[['Escolher formação',newGame],['Cancelar',()=>{}]]);
document.addEventListener('pointerdown',()=>unlockAudio(),{passive:true});
document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{unlockAudio();move(...b.dataset.move.split(',').map(Number));});
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='Escape'&&!$('modal').open&&s){e.preventDefault();pauseGame();return;}
 if($('modal').open||!s)return;
 if(e.target?.matches?.('button,input,select,textarea')&&['Enter',' '].includes(e.key))return;
 const k=e.key.toLowerCase(),dirs={w:[0,-1],arrowup:[0,-1],s:[0,1],arrowdown:[0,1],a:[-1,0],arrowleft:[-1,0],d:[1,0],arrowright:[1,0]};
 if(dirs[k]){e.preventDefault();unlockAudio();move(...dirs[k]);return;}
 if(e.repeat)return;
 const actions={f:()=>characterSheet(),e:interact,i:inventoryView,j:journal,m:world,h:heal,r:rest,c:()=>$('sneak').click()};
 if(actions[k]){e.preventDefault();unlockAudio();actions[k]();}
});
// Keeps narrative choices from being accidentally dismissed with Escape.
$('modal').addEventListener('cancel',e=>e.preventDefault());
syncAudioButton();
initRenderer();
paintFrame(initial('Detetive'));
welcome();
