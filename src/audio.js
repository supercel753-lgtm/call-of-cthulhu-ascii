/** Trilha e efeitos ORIGINAIS, sintetizados em WAV pelo pipeline de arte.
 * Nenhum arquivo de terceiros. Volume e mute persistem fora do save de jogo.
 */
export const AUDIO_ASSETS={
 environments:['porto','vila','mansao','hospital','grutas','farol'],
 effects:['step','pickup','door','damage','creature','whisper','ui']
};
const KEY='ecos-audio-settings-v1';
let muted=false,volume=.55,unlocked=false,region=null,music=null;
const effects=new Map();
function readPrefs(){try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object'){
 muted=!!saved.muted;volume=Math.max(0,Math.min(1,Number(saved.volume)||0));
}}catch{}}
readPrefs();
const enabled=()=>typeof Audio!=='undefined';
function track(path){if(!enabled())return null;const a=new Audio(path);a.preload='auto';return a;}
function apply(){if(music)music.volume=muted?0:volume*.38;for(const a of effects.values())a.volume=muted?0:volume*.70;}
function store(){try{localStorage.setItem(KEY,JSON.stringify({muted,volume}));}catch{}}
function play(el){if(!el||muted||volume<=0||!unlocked)return;try{const result=el.play();result?.catch?.(()=>{});}catch{}}
export function unlockAudio(){
 if(!enabled())return;
 if(!unlocked){unlocked=true;if(region)play(music);}
}
export function changeRegion(id){
 if(!AUDIO_ASSETS.environments.includes(id))return;
 if(region===id&&music)return;
 if(music){music.pause();music.src='';}
 region=id;music=track(`./assets/audio/${id}.wav`);
 if(!music)return;music.loop=true;music.volume=muted?0:volume*.38;
 play(music);
}
const lastPlayed=new Map();
export function playEffect(id){
 if(!AUDIO_ASSETS.effects.includes(id)||!enabled()||muted||volume===0)return;
 const now=typeof performance!=='undefined'?performance.now():Date.now();
 if(now-(lastPlayed.get(id)||-1000)<(id==='step'?70:110))return;
 lastPlayed.set(id,now);
 let a=effects.get(id);
 if(!a){a=track(`./assets/audio/${id}.wav`);if(!a)return;effects.set(id,a);}
 try{a.currentTime=0;}catch{}
 a.volume=volume*.70;play(a);
}
export function getAudioSettings(){return {muted,volume,unlocked,region};}
export function setMuted(v){muted=!!v;apply();if(!muted){unlockAudio();play(music);}store();return getAudioSettings();}
export function setVolume(v){volume=Math.max(0,Math.min(1,Number(v)||0));apply();if(volume>0)unlockAudio();store();return getAudioSettings();}
export function toggleMute(){return setMuted(!muted);}
