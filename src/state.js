import {createRpg} from './rpg.js';
// Ecos do Abismo — todos os direitos reservados. Consulte LICENSE.
import { clues } from "./data.js";

export let s=null;
export function setState(value){s=value;}
export function initial(role){return {version:1,visualVersion:2,rpg:createRpg(),role,region:'porto',x:3,y:8,hp:100,san:100,occ:0,trust:0,kits:2,turn:0,sneak:false,facing:'south',clues:[],flags:{},seen:{},enemies:{},log:[],ending:null};}

export function log(t){s.log.unshift(t);s.log=s.log.slice(0,35);}

export function clamp(){s.hp=Math.max(0,Math.min(100,s.hp));s.san=Math.max(0,Math.min(100,s.san));}
