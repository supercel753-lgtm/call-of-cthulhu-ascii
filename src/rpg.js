// Regras próprias inspiradas nos sete atributos indicados pelo usuário.
export const SKILLS = {
  investigation: {name:'Investigação',description:'Reconstitui cenas e revela detalhes extras nas pistas.'},
  medicine: {name:'Medicina',description:'Melhora curativos, interpreta laudos e estabiliza feridos.'},
  occultism: {name:'Ocultismo',description:'Decifra símbolos e reduz o impacto mental dos artefatos.'},
  strength: {name:'Força',description:'Permite arrombar a porta de serviço sem ferimentos.'},
  eloquence: {name:'Eloquência',description:'Libera argumentos persuasivos e acordos favoráveis.'},
  psychology: {name:'Psicologia',description:'Identifica intenções ocultas e acalma testemunhas.'},
  awareness: {name:'Visão',description:'Amplia a iluminação da lanterna e detecta pistas próximas.'},
};
export const MAX_SKILL=5, START_POINTS=10, XP_STEP=100;
export function createRpg(){return {version:1,skills:Object.fromEntries(Object.keys(SKILLS).map(k=>[k,1])),points:START_POINTS,level:1,xp:0,rewards:[],insights:[]};}
export function value(state,key){return state.rpg?.skills?.[key]??1;}
export function check(state,key,required){return value(state,key)>=required;}
export function requirement(state,key,required){return `${SKILLS[key].name} ${value(state,key)}/${required} · ${check(state,key,required)?'sucesso garantido':'atributo insuficiente'}`;}
export function spend(rpg,key,delta=1,creation=false){
  if(!Object.hasOwn(SKILLS,key)||![1,-1].includes(delta))return false;
  if(delta===-1&&!creation)return false;
  if(delta===1&&(rpg.points<1||rpg.skills[key]>=MAX_SKILL))return false;
  if(delta===-1&&rpg.skills[key]<=1)return false;
  rpg.skills[key]+=delta;rpg.points-=delta;return true;
}
export function award(state,id,amount){
  const r=state.rpg;if(!r||r.rewards.includes(id))return 0;
  r.rewards.push(id);r.xp+=amount;let levels=0;
  while(r.xp>=XP_STEP){r.xp-=XP_STEP;r.level++;r.points+=2;levels++;}
  if(levels&&Array.isArray(state.log))state.log.unshift(`Nível ${r.level}: +${2*levels} pontos de atributo. Abra a ficha [F].`);
  return levels;
}
export function healing(state){return 20+value(state,'medicine')*8;}
export function occultCost(state){return Math.max(2,10-2*value(state,'occultism'));}
export function validRpg(r){return !!r&&r.version===1&&r.skills&&Object.keys(SKILLS).every(k=>Number.isInteger(r.skills[k])&&r.skills[k]>=1&&r.skills[k]<=MAX_SKILL)&&Number.isInteger(r.points)&&r.points>=0&&Number.isInteger(r.level)&&r.level>=1&&Number.isInteger(r.xp)&&r.xp>=0&&r.xp<XP_STEP&&Array.isArray(r.rewards)&&r.rewards.every(x=>typeof x==='string')&&new Set(r.rewards).size===r.rewards.length&&Array.isArray(r.insights)&&r.insights.every(x=>typeof x==='string')&&Object.values(r.skills).reduce((a,b)=>a+b,0)+r.points===7+START_POINTS+2*(r.level-1);}
export const INSIGHTS={
 manifesto:{skill:'investigation',need:3,text:'A tinta da assinatura veio do hospital. O manifesto foi falsificado depois do desembarque.'},
 jornal:{skill:'investigation',need:2,text:'As datas dos desaparecimentos coincidem com as marés mais baixas. O caminho subterrâneo permanece ativo.'},
 quadro:{skill:'occultism',need:3,text:'O quadro é uma lente ritual. Quem aprende a inverter a imagem pode interromper a ligação.'},
 diario:{skill:'psychology',need:3,text:'As mudanças na caligrafia não indicam culpa: Helena escrevia sob terror. Ela precisa de segurança, não de uma confissão.'},
 prontuario:{skill:'medicine',need:3,text:'As marcas nos braços são de sedação repetida, não de uma doença contagiosa. O paciente pode ser retirado sem isolamento.'},
 selo:{skill:'occultism',need:3,text:'As fraturas são intencionais. O selo foi construído para absorver a ruptura do ritual.'},
 inscricao:{skill:'occultism',need:4,text:'Uma linha omitida ensina a separar a voz da memória. Você compreende por que o culto precisa de uma terceira pessoa.'},
};
export function uncover(state,id){const item=INSIGHTS[id];if(!item||!state.clues.includes(id)||!check(state,item.skill,item.need)||state.rpg.insights.includes(id))return false;state.rpg.insights.push(id);award(state,'insight:'+id,30);if(item.skill==='occultism')state.occ=Math.min(100,state.occ+5);return true;}
