import {SKILLS,MAX_SKILL,createRpg,spend,requirement,INSIGHTS,uncover} from './rpg.js';
import {s,log} from './state.js';
import {show,$,render} from './ui.js';
import {start,newGame} from './game.js';
import {autosave} from './storage.js';

export function characterSheet(role=null){
  const creation=role!==null;
  if(!creation&&!s)return;
  const draft=creation?createRpg():structuredClone(s.rpg);
  const refresh=()=>{
    show(creation?'Crie seu investigador':'Ficha do investigador',
      `${creation?role:s.role} · ${creation?'10 pontos para distribuir. Todos os atributos começam em 1.':'Nível '+draft.level+' · XP '+draft.xp+'/100'}\nCada ponto aumenta um atributo em 1, até 5. Testes são determinísticos: alcançar o requisito garante sucesso.`,[]);
    const area=document.createElement('div');area.className='skill-editor';
    const counter=document.createElement('p');counter.className='points-counter';counter.textContent=`Pontos disponíveis: ${draft.points}`;area.append(counter);
    for(const [key,def]of Object.entries(SKILLS)){
      const row=document.createElement('div');row.className='skill-row';
      const label=document.createElement('div');const name=document.createElement('strong');name.textContent=def.name;const desc=document.createElement('small');desc.textContent=def.description;label.append(name,desc);row.append(label);
      const controls=document.createElement('div');controls.className='skill-controls';
      if(creation){const minus=document.createElement('button');minus.textContent='−';minus.setAttribute('aria-label','Diminuir '+def.name);minus.disabled=draft.skills[key]<=1;minus.onclick=()=>{spend(draft,key,-1,true);refresh();};controls.append(minus);}
      const score=document.createElement('span');score.textContent=draft.skills[key]+'/'+MAX_SKILL;controls.append(score);
      const plus=document.createElement('button');plus.textContent='+';plus.setAttribute('aria-label','Aumentar '+def.name);plus.disabled=draft.points<=0||draft.skills[key]>=MAX_SKILL||(!creation&&!!s.ending);plus.onclick=()=>{spend(draft,key);refresh();};controls.append(plus);row.append(controls);area.append(row);
    }
    $('modalText').append(area);
    const confirm=document.createElement('button');confirm.className='primary';confirm.textContent=creation?'Confirmar atributos e desembarcar':'Aplicar distribuição';confirm.disabled=creation&&draft.points!==0;
    confirm.onclick=()=>{$('modal').close();if(creation)start(role,draft);else{s.rpg=draft;log('Ficha atualizada.');render();autosave();}};
    const cancel=document.createElement('button');cancel.textContent=creation?'Voltar às formações':'Cancelar';cancel.onclick=()=>{$('modal').close();if(creation)newGame();};
    $('modalActions').append(confirm,cancel);
  };refresh();
}
export function inspectClue(id){
  const detail=INSIGHTS[id];if(!detail)return;
  if(s.rpg.insights.includes(id)){show('Detalhe revelado',detail.text);return;}
  show('Examinar além do óbvio',`${requirement(s,detail.skill,detail.need)}\n\nUma análise bem-sucedida revela informação adicional e concede 30 XP uma única vez. Pistas essenciais não exigem este teste.`,[
    ['Realizar análise',()=>{if(uncover(s,id)){log('Análise: '+detail.text);show('Detalhe revelado',detail.text+'\n\n+30 XP'+(detail.skill==='occultism'?' · +5 conhecimento proibido':''));}},s.rpg.skills[detail.skill]>=detail.need],
    ['Voltar à investigação',()=>{}]
  ]);
}
