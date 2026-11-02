// Ecos do Abismo — todos os direitos reservados. Consulte LICENSE.
import { W, H, regions, clues } from "./data.js";
import { s } from "./state.js";

export function grid(id){const r=regions[id],g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>(x===0||y===0||x===W-1||y===H-1)?'#':'.'));for(const [x1,y1,x2,y2]of r.walls)for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++)g[y][x]='#';if(r.water)for(let y=1;y<H-1;y++)g[y][1]='~';return g;}

export function walk(x,y,id=s.region){const g=grid(id);return x>=0&&y>=0&&x<W&&y<H&&!['#','~'].includes(g[y][x]);}

export function nearby(){return regions[s.region].objects.filter(o=>Math.abs(o[1]-s.x)+Math.abs(o[2]-s.y)<=1);}

export function nextStep(e,target){const q=[[e.x,e.y]],seen=new Set([e.x+','+e.y]),parent=new Map();while(q.length){const [x,y]=q.shift();if(x===target.x&&y===target.y){let key=x+','+y;while(parent.has(key)&&parent.get(key)!==e.x+','+e.y)key=parent.get(key);return key.split(',').map(Number);}for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(walk(nx,ny)&&!seen.has(key)){seen.add(key);parent.set(key,x+','+y);q.push([nx,ny]);}}}return [e.x,e.y];}

export function gate(id){if(id==='mansao'&&!s.flags.mara)return 'Mara conhece a entrada. Converse com ela na vila.';if(id==='hospital'&&!s.clues.includes('diario'))return 'A guarda exige uma ligação com o caso Vesper. Procure o diário na mansão.';if(id==='grutas'&&!s.flags.tunnel)return 'A porta de serviço está trancada. Procure a médica.';if(id==='farol'&&(!s.clues.includes('selo')||!s.clues.includes('inscricao')))return 'O limiar rejeita sua presença. Encontre o selo e a inscrição nas grutas.';return null;}
