/** Ecos do Abismo — Nocturne Pixel Remaster.
 * Renderização 2D raster real em Canvas: atlas de tiles e sprites PNG,
 * composição com profundidade, lanterna direcional, oclusão, clima e câmera.
 * Nenhum glifo ASCII é utilizado no palco ou nas imagens de personagens.
 */
import {value} from './rpg.js';
import {THEMES,DECOR} from './art.js';
import {regions,W,H} from './data.js';
import {grid,nearby} from './world.js';

export const TILE=32;
export const VIEW={width:768,height:448,cols:24,rows:14};
export const TILE_KINDS=['floor0','floor1','floor2','floor3','wall0','wall1','water','threshold','moss','stain','floor4','wall2'];
export const PROP_KINDS=['crate','barrel','lamp','tree','bench','table','shelf','bed','pillar','stalagmite','bones','door','manifesto','jornal','quadro','diario','prontuario','selo','inscricao','ritual','generic'];
export const CHARACTERS=['investigator','elias','mara','helena','doctor','patient','creature'];
const NPC={marinheiro:'elias',mara:'mara',sobrevivente:'helena',medica:'doctor',cela:'patient'};
const CLUES={manifesto:'manifesto',jornal:'jornal',quadro:'quadro',diario:'diario',prontuario:'prontuario',selo:'selo',inscricao:'inscricao',ritual:'ritual'};
const SAFE=(n,a,b)=>Math.min(b,Math.max(a,n));
const HASH=(x,y,seed=0)=>{let h=Math.imul(x+seed,374761393)^Math.imul(y-seed,668265263);h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0;};
const DIR={north:0,east:1,south:2,west:3};
const COLORS={floor:'#415358',wall:'#6a7981',water:'#285969',accent:'#d8bd86'};
const REGION_DARKNESS={porto:.66,vila:.70,mansao:.75,hospital:.73,grutas:.80,farol:.72};

/** Modelo inspecionável, independente de DOM; serve também aos testes. */
export function buildScene(state,time=0,motion=true){
  const id=regions[state.region]?state.region:'porto',map=grid(id),weather=THEMES[id].weather;
  const props=(DECOR[id]||[]).map(([x,y,kind])=>({x,y,kind,solid:true}));
  const objects=regions[id].objects.map(([key,x,y,type,label])=>({key,x,y,type,label,kind:type==='N'?NPC[key]:type==='>'?'door':CLUES[key]||'generic',read:state.clues.includes(key)}));
  const enemies=(state.enemies[id]||[]).map(e=>({...e,kind:'creature'}));
  return {id,map,props,objects,enemies,weather,lamps:THEMES[id].lamps,
    player:{x:state.x,y:state.y,dir:state.facing||'south',sneak:state.sneak,hurt:state.hp<=0},
    ambientLight:1-REGION_DARKNESS[id]-(state.san<30?.04:0),
    flashlightRadius:(4.4+value(state,'awareness')*.9)*TILE,
    animationTick:motion?Math.floor(time/210):0};
}

let canvas,ctx,activeState,rafId=0,lastPaint=0,lastRegion=null,lastHP=null;
let images=new Map(),loaded=false,loadingPromise,loadErrors=[];
let effects=true,camera={x:0,y:0,region:null},lastX=null,lastY=null,walkUntil=0,hurtUntil=0,interactUntil=0;
let lightingCanvas,lightingContext,visibilityCache={key:null,grid:null};
const lightResolution=4;

export function getAssetReport(){return {loaded,errors:[...loadErrors],count:images.size};}
export function preloadAssets(){
 if(loadingPromise)return loadingPromise;
 if(typeof Image==='undefined'){loadingPromise=Promise.resolve({loaded:0,failed:[]});return loadingPromise;}
 const urls=[...Object.keys(regions).map(id=>[`tile-${id}`,`./assets/tiles/${id}.png`]),
  ...CHARACTERS.map(id=>[`char-${id}`,`./assets/sprites/${id}.png`]),
  ['props','./assets/sprites/props.png'],
  ...Object.keys(regions).map(id=>[`pan-${id}`,`./assets/panoramas/${id}.png`])];
 loadingPromise=Promise.all(urls.map(([key,src])=>new Promise(resolve=>{
   const im=new Image();im.onload=()=>{images.set(key,im);resolve(true);};
   im.onerror=()=>{loadErrors.push(src);resolve(false);};im.src=src;
 }))).then(results=>{
  loaded=true;
  const status=document.getElementById('assetsStatus');
  if(status)status.textContent=loadErrors.length?`Recursos indisponíveis: ${loadErrors.length}`:'PIXEL ART · RECURSOS CARREGADOS';
  if(activeState)paintFrame(activeState,typeof performance!=='undefined'?performance.now():0);
  return {loaded:results.filter(Boolean).length,failed:[...loadErrors]};
 });
 return loadingPromise;
}
const img=key=>images.get(key);
function blit(image,sx,sy,sw,sh,dx,dy,dw=sw,dh=sh){if(image&&ctx)ctx.drawImage(image,sx,sy,sw,sh,Math.floor(dx),Math.floor(dy),dw,dh);}
function lineOfSight(x0,y0,x1,y1,map){
 let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx-dy;
 let x=x0,y=y0;
 while(x!==x1||y!==y1){let e=2*err;if(e>-dy){err-=dy;x+=sx;}if(e<dx){err+=dx;y+=sy;}
  if(x===x1&&y===y1)break;
  if(map[y]?.[x]==='#')return false;
 }
 return true;
}
function visibility(state,scene){
 const key=`${scene.id}:${state.x},${state.y}:${value(state,'awareness')}`;
 if(key===visibilityCache.key)return visibilityCache.grid;
 const visible=Array.from({length:H},()=>Array(W).fill(false)),r=7+value(state,'awareness');
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
   if(Math.abs(x-state.x)+Math.abs(y-state.y)>r*2)continue;
   visible[y][x]=lineOfSight(state.x,state.y,x,y,scene.map);
 }
 visibilityCache={key,grid:visible};return visible;
}
function drawGround(scene,camx,camy,time){
 const startX=Math.max(0,Math.floor(camx/TILE)-1),endX=Math.min(W-1,Math.ceil((camx+VIEW.width)/TILE)+1);
 const startY=Math.max(0,Math.floor(camy/TILE)-1),endY=Math.min(H-1,Math.ceil((camy+VIEW.height)/TILE)+1);
 const atlas=img('tile-'+scene.id);
 for(let y=startY;y<=endY;y++)for(let x=startX;x<=endX;x++){
  const c=scene.map[y][x],h=HASH(x,y),kind=c==='#'?(h%7===0?11:h%3===0?5:4):c==='~'?6:h%17===0?8:h%23===0?9:h%5===0?10:h%4;
  const px=x*TILE-camx,py=y*TILE-camy;
  if(atlas)blit(atlas,kind*TILE,0,TILE,TILE,px,py);
  else{ctx.fillStyle=c==='#'?COLORS.wall:c==='~'?COLORS.water:COLORS.floor;ctx.fillRect(Math.floor(px),Math.floor(py),TILE,TILE);}
  if(c==='~'&&effects){ctx.fillStyle='#79b9bf4b';ctx.fillRect(Math.floor(px+((time/180+x*7+y*9)%24)),Math.floor(py+11+(y*3)%8),6,1);}
 }
}
function propIndex(kind){const n=PROP_KINDS.indexOf(kind);return n>=0?n:20;}
function spriteProp(kind,x,y,camx,camy,scale=1){const atlas=img('props');
 const px=x*TILE-camx,py=y*TILE-camy-8;
 if(atlas)blit(atlas,propIndex(kind)*32,0,32,40,px,py,32*scale,40*scale);
 else{ctx.fillStyle='#a28d75';ctx.fillRect(Math.floor(px+7),Math.floor(py+15),18,19);}
}
function spriteChar(kind,x,y,camx,camy,dir,pose=0){
 const atlas=img('char-'+kind),px=x*TILE-camx,py=y*TILE-camy-8;
 if(atlas)blit(atlas,pose*32,(DIR[dir]??2)*40,32,40,px,py);
 else{ctx.fillStyle=kind==='creature'?'#bd7277':'#d3b890';ctx.fillRect(Math.floor(px+11),Math.floor(py+7),12,24);}
}
function drawWorldActors(state,scene,camx,camy,time){
 const actors=[];
 for(const p of scene.props)actors.push({...p,category:0});
 for(const o of scene.objects)actors.push({...o,category:o.type==='N'?2:1});
 for(const e of scene.enemies)actors.push({...e,category:3});
 actors.push({...scene.player,kind:'investigator',category:4});
 actors.sort((a,b)=>a.y-b.y||a.category-b.category);
 const near=nearby(),active=new Set(near.map(o=>o[0]));
 for(const a of actors){
  if(a.category===0){spriteProp(a.kind,a.x,a.y,camx,camy);continue;}
  if(a.category===1){spriteProp(a.kind,a.x,a.y,camx,camy);}
  else if(a.category===2){spriteChar(a.kind,a.x,a.y,camx,camy,'south',effects&&scene.animationTick%7===0?7:0);}
  else if(a.category===3){spriteChar('creature',a.x,a.y,camx,camy,'south',effects?1+scene.animationTick%2:0);}
  else{
   const pose=a.hurt?6:time<hurtUntil?5:time<interactUntil?4:a.sneak?3:time<walkUntil?(state.turn%2?1:2):effects&&scene.animationTick%12===0?7:0;
   spriteChar('investigator',a.x,a.y,camx,camy,a.dir,pose);
  }
  if(a.key&&active.has(a.key)){
   const px=Math.floor(a.x*TILE-camx+16),py=Math.floor(a.y*TILE-camy-17);
   const bw=28,bh=16;
   ctx.fillStyle='#111b22e8';ctx.fillRect(px-bw/2,py-bh/2,bw,bh);
   ctx.strokeStyle='#e5c783';ctx.lineWidth=1;ctx.strokeRect(px-bw/2+.5,py-bh/2+.5,bw-1,bh-1);
   ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f5e4bd';ctx.fillText('E',px,py);
  }
  if(a.category===1&&a.read){
   ctx.fillStyle='#879b8cbb';ctx.fillRect(Math.floor(a.x*TILE-camx+15),Math.floor(a.y*TILE-camy-3),3,3);
  }
 }
}
function drawLighting(state,scene,camx,camy,time){
 if(!lightingCanvas||!lightingContext)return;
 const g=lightingContext,lw=lightingCanvas.width,lh=lightingCanvas.height;
 g.globalCompositeOperation='source-over';g.clearRect(0,0,lw,lh);
 const san=SAFE(state.san,0,100),pulse=effects&&san<30?Math.sin(time/110)*.055:0;
 const darkness=SAFE(REGION_DARKNESS[scene.id]+pulse+(100-san)/100*.09,.60,.90);
 g.fillStyle=`rgba(2,7,14,${darkness})`;g.fillRect(0,0,lw,lh);
 const cut=(x,y,r,power)=>{
  const sx=x/lightResolution,sy=y/lightResolution,rr=Math.max(1,r/lightResolution);
  const grad=g.createRadialGradient(sx,sy,0,sx,sy,rr);
  grad.addColorStop(0,`rgba(0,0,0,${power})`);grad.addColorStop(.42,`rgba(0,0,0,${power*.72})`);grad.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=grad;g.beginPath();g.arc(sx,sy,rr,0,Math.PI*2);g.fill();
 };
 g.globalCompositeOperation='destination-out';
 for(const [x,y] of scene.lamps){
  const shimmer=effects?Math.sin(time/335+x*7+y*3)*5:0;
  cut(x*TILE+16-camx,y*TILE+16-camy,112+shimmer,.70);
 }
 const p=scene.player,px=p.x*TILE+16-camx,py=p.y*TILE+14-camy;
 const f={north:[0,-1],south:[0,1],east:[1,0],west:[-1,0]}[p.dir]||[0,1];
 const r=scene.flashlightRadius*(p.sneak?.80:1),flicker=effects?Math.sin(time/177)*2:0;
 cut(px,py,70+flicker,.85);
 cut(px+f[0]*r*.36,py+f[1]*r*.36,r*.82+flicker,.84);
 g.globalCompositeOperation='source-over';
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.drawImage(lightingCanvas,0,0,lw,lh,0,0,VIEW.width,VIEW.height);ctx.restore();
 const vis=visibility(state,scene);
 ctx.fillStyle='#050d18a8';
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
   if(vis[y][x])continue;
   const px=x*TILE-camx,py=y*TILE-camy;
   if(px+TILE<0||py+TILE<0||px>VIEW.width||py>VIEW.height)continue;
   ctx.fillRect(Math.floor(px),Math.floor(py),TILE,TILE);
 }
 // Bloom-like colored motes around light sources without blur or costly filters.
 if(effects){ctx.globalAlpha=.25;
  for(const [x,y]of scene.lamps){
   const px=x*TILE+16-camx,py=y*TILE+6-camy;
   ctx.fillStyle=THEMES[scene.id].accent;
   const z=3+Math.sin(time/230+x)*2;
   ctx.fillRect(Math.floor(px-z),Math.floor(py-z),z*2,z*2);
  }
  ctx.globalAlpha=1;
 }
}
function drawWeather(scene,time){
 if(!effects)return;
 const w=scene.weather,drip=w==='drip',rain=w==='rain';
 ctx.save();ctx.globalAlpha=rain?.28:drip?.25:.13;
 for(let i=0;i<(rain?80:drip?28:24);i++){
  const seed=HASH(i,scene.id.length,19),x0=seed%VIEW.width,y0=(seed>>>11)%VIEW.height;
  const x=((x0+time*(rain?.115:.018))%VIEW.width),y=((y0+time*(rain?.27:drip?.12:.012))%VIEW.height);
  ctx.strokeStyle=rain?'#b3d4d1':drip?'#abc6dc':'#c3d8c9';
  ctx.beginPath();ctx.moveTo(Math.floor(x),Math.floor(y));ctx.lineTo(Math.floor(x-(rain?3:0)),Math.floor(y+(rain?12:drip?8:2)));ctx.stroke();
 }
 ctx.restore();
}
function drawAtmosphere(state,time){
 ctx.save();
 const t=effects?time:0;
 if(state.san<40){
  const alpha=(40-state.san)/40*.16;
  ctx.fillStyle=`rgba(105,29,49,${alpha})`;ctx.fillRect(0,0,VIEW.width,VIEW.height);
 }
 // Thin cinematic vignette plus 1px image-space film texture, motion-independent.
 const v=ctx.createRadialGradient(VIEW.width/2,VIEW.height/2,110,VIEW.width/2,VIEW.height/2,480);
 v.addColorStop(0,'rgba(4,8,13,0)');v.addColorStop(1,'rgba(4,8,13,.43)');
 ctx.fillStyle=v;ctx.fillRect(0,0,VIEW.width,VIEW.height);
 if(state.hp<30&&effects){ctx.fillStyle=`rgba(143,28,29,${.055+.028*Math.sin(t/170)})`;ctx.fillRect(0,0,VIEW.width,VIEW.height);}
 ctx.restore();
}
export function paintFrame(state,now=0){
 if(!ctx||!state)return;
 const scene=buildScene(state,now,effects);
 ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#0a1319';ctx.fillRect(0,0,VIEW.width,VIEW.height);
 if(camera.region!==scene.id){camera={x:SAFE(state.x*TILE-VIEW.width/2,0,W*TILE-VIEW.width),y:SAFE(state.y*TILE-VIEW.height/2,0,H*TILE-VIEW.height),region:scene.id};}
 const desiredX=SAFE(state.x*TILE-VIEW.width/2,0,W*TILE-VIEW.width);
 const desiredY=SAFE(state.y*TILE-VIEW.height/2,0,H*TILE-VIEW.height);
 const ease=effects?.28:1;
 camera.x+= (desiredX-camera.x)*ease;camera.y+=(desiredY-camera.y)*ease;
 if(Math.abs(desiredX-camera.x)<.35)camera.x=desiredX;
 if(Math.abs(desiredY-camera.y)<.35)camera.y=desiredY;
 const cx=Math.round(camera.x),cy=Math.round(camera.y);
 drawGround(scene,cx,cy,now);
 drawWorldActors(state,scene,cx,cy,now);
 drawLighting(state,scene,cx,cy,now);
 drawWeather(scene,now);
 drawAtmosphere(state,now);
}
function loop(now){
 if(activeState&&!document.hidden&&now-lastPaint>=(effects?1000/60:250)){
  paintFrame(activeState,now);lastPaint=now;
 }
 rafId=requestAnimationFrame(loop);
}
function setFxButton(){
 const b=document.getElementById('effects');if(!b)return;
 b.textContent=effects?'Efeitos: ativos':'Efeitos: reduzidos';b.setAttribute('aria-pressed',String(effects));
}
export function initRenderer(){
 if(typeof document==='undefined')return;
 canvas=document.getElementById('scene');if(!canvas?.getContext)return;
 ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return;
 canvas.width=VIEW.width;canvas.height=VIEW.height;ctx.imageSmoothingEnabled=false;
 if(typeof document.createElement==='function'){
  const l=document.createElement('canvas');
  if(l?.getContext){l.width=VIEW.width/lightResolution;l.height=VIEW.height/lightResolution;lightingCanvas=l;lightingContext=l.getContext('2d');}
 }
 if(typeof window!=='undefined'&&window.matchMedia)effects=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 try{const saved=localStorage.getItem('ecos-effects');if(saved!==null)effects=saved==='on';}catch{}
 const b=document.getElementById('effects');
 if(b){b.onclick=()=>{effects=!effects;try{localStorage.setItem('ecos-effects',effects?'on':'off');}catch{}setFxButton();if(activeState)paintFrame(activeState,0);};setFxButton();}
 preloadAssets();
 if(!rafId&&typeof requestAnimationFrame==='function')rafId=requestAnimationFrame(loop);
}
export function renderScene(state){
 activeState=state;
 if(!canvas)initRenderer();
 if(canvas?.setAttribute)canvas.setAttribute('aria-label',regions[state.region].name+`. Investigador em ${state.x}, ${state.y}. `+nearby().map(o=>o[4]).join(', '));
 const sceneText=document.getElementById('sceneCaption');
 if(sceneText)sceneText.textContent=state.san<30?'Você ouve passos que não são seus.':THEMES[state.region].subtitle;
 const sceneArt=document.getElementById('regionArt');if(sceneArt&&sceneArt.dataset?.region!==state.region){if(!sceneArt.dataset)sceneArt.dataset={};sceneArt.src=`./assets/panoramas/${state.region}.png`;sceneArt.dataset.region=state.region;}
 const banner=document.getElementById('regionBanner');
 if(banner&&lastRegion!==state.region){banner.textContent=THEMES[state.region].name;
  if(banner.animate&&effects)banner.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)',offset:.16},{opacity:1,offset:.78},{opacity:0}],{duration:2400,fill:'forwards'});
  else if(banner.style)banner.style.opacity='0';
 }
 const t=typeof performance!=='undefined'?performance.now():0;
 if(lastX!==state.x||lastY!==state.y)walkUntil=t+190;
 if(lastHP!==null&&state.hp<lastHP){hurtUntil=t+470;
  if(canvas?.animate&&effects)canvas.animate([{opacity:.82},{opacity:1}],{duration:350});
 }
 lastX=state.x;lastY=state.y;lastHP=state.hp;lastRegion=state.region;
 paintFrame(state,t);drawMinimap(state);
}
export function triggerInteraction(){interactUntil=typeof performance!=='undefined'?performance.now()+300:0;}
export function drawMinimap(state){
 const mini=document.getElementById('map');const c=mini?.getContext?.('2d');if(!c)return;
 mini.width=W*5;mini.height=H*5;c.imageSmoothingEnabled=false;
 const model=buildScene(state,0,false),p=THEMES[state.region],g=model.map;
 c.fillStyle='#0d1820';c.fillRect(0,0,mini.width,mini.height);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const item=g[y][x];c.fillStyle=item==='#'?p.wall:item==='~'?'#3a7085':p.floor;c.fillRect(x*5,y*5,4,4);
 }
 for(const o of model.objects){c.fillStyle=o.type==='>'?'#7cd7e1':o.type==='N'?'#e4ad80':o.read?'#778b81':'#e5d198';c.fillRect(o.x*5-1,o.y*5-1,7,7);}
 for(const e of model.enemies){c.fillStyle='#db6677';c.fillRect(e.x*5,e.y*5,5,5);}
 c.fillStyle='#fff2c5';c.fillRect(state.x*5-1,state.y*5-1,7,7);
 c.fillStyle='#1d3033';c.fillRect(state.x*5+1,state.y*5+1,3,3);
 mini.setAttribute?.('aria-label',`Mapa de ${regions[state.region].name}. Marcador claro: investigador.`);
}
export function portraitFor(title){
 if(/Elias|travessia|preço/i.test(title))return './assets/sprites/elias.png';
 if(/Mara|chave|cinzas/i.test(title))return './assets/sprites/mara.png';
 if(/pintora|Helena|esboço/i.test(title))return './assets/sprites/helena.png';
 if(/médica|cura|Avelar|túnel/i.test(title))return './assets/sprites/doctor.png';
 if(/paciente|primeira testemunha/i.test(title))return './assets/sprites/patient.png';
 if(/abismo|chamado|ondas|espelho|vigília/i.test(title))return './assets/sprites/creature.png';
 return './assets/sprites/investigator.png';
}
