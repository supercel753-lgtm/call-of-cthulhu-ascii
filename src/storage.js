import {createRpg,validRpg} from './rpg.js';
import { DECOR } from './art.js';
// Ecos do Abismo — todos os direitos reservados. Consulte LICENSE.
import { W, H, regions, clues, endings } from "./data.js";
import { s, setState, log } from "./state.js";
import { finish } from "./story.js";
import { $, show, render, welcome } from "./ui.js";
import { walk } from "./world.js";

export const KEY='ecos-abismo-v1';
export function autosave(){if(!s)return;try{localStorage.setItem(KEY,JSON.stringify(s));}catch{ $('description').textContent=regions[s.region].desc+' Salvamento indisponível neste navegador.';}}

export function load(){try{const raw=localStorage.getItem(KEY);if(!raw){show('Sem arquivo','Não existe uma partida salva neste navegador.',[['Voltar',()=>s?render():welcome()]]);return;}const data=upgradeVisualSave(JSON.parse(raw));if(data&&data.version===1&&!data.rpg)data.rpg=createRpg();if(!validSave(data))throw Error('invalid');setState(data);render();if(s.ending)finish(s.ending);else show('Partida carregada','Seu progresso foi restaurado.');}catch{show('Não foi possível carregar','O arquivo está indisponível ou incompatível. Inicie uma nova investigação.',[['Voltar',()=>s?render():welcome()]]);}}

export function validSave(v){return v&&v.version===1&&validRpg(v.rpg)&&Object.hasOwn(regions,v.region)&&['Detetive','Médico','Ocultista'].includes(v.role)&&['hp','san','occ','trust','kits','turn','x','y'].every(k=>Number.isFinite(v[k]))&&Number.isInteger(v.x)&&Number.isInteger(v.y)&&walk(v.x,v.y,v.region)&&Array.isArray(v.clues)&&new Set(v.clues).size===v.clues.length&&v.clues.every(k=>Object.hasOwn(clues,k))&&Array.isArray(v.log)&&v.log.every(t=>typeof t==='string')&&v.flags&&v.seen&&v.enemies&&Object.values(v.enemies).every(a=>Array.isArray(a)&&a.every(e=>Number.isInteger(e.x)&&Number.isInteger(e.y)&&e.x>0&&e.x<W-1&&e.y>0&&e.y<H-1))&&(!v.ending||Object.hasOwn(endings,v.ending));}

// Saves anteriores podem coincidir com uma nova peça de mobília.
// Reposiciona somente nesses pontos conhecidos, preservando decisões e atributos.
export function upgradeVisualSave(data) {
  if (!data || data.version !== 1 || data.visualVersion === 2 || !Object.hasOwn(regions,data.region)) return data;
  const relocate = (actor, region) => {
    if (!(DECOR[region] || []).some(([x,y]) => actor.x === x && actor.y === y)) return;
    for (let distance = 1; distance < W + H; distance++) {
      for (let dx = -distance; dx <= distance; dx++) {
        const dy = distance - Math.abs(dx);
        for (const sign of [1,-1]) {
          const nx = actor.x + dx, ny = actor.y + dy * sign;
          if (walk(nx,ny,region)) { actor.x = nx; actor.y = ny; return; }
        }
      }
    }
  };
  relocate(data, data.region);
  if(data.enemies && typeof data.enemies === 'object') for(const [region,actors] of Object.entries(data.enemies)) {
    if (Object.hasOwn(regions,region) && Array.isArray(actors)) for(const actor of actors) if(actor) relocate(actor,region);
  }
  data.visualVersion = 2;
  return data;
}
