import {award,check,requirement,value} from './rpg.js';
// Ecos do Abismo — todos os direitos reservados. Consulte LICENSE.
import { clues, endings } from "./data.js";
import { newGame } from "./game.js";
import { s, log } from "./state.js";
import { show, journal } from "./ui.js";

export function once(flag,title,text,choices){if(s.flags[flag]){show(title,'Essa decisão já foi tomada. Consulte o diário para rever as consequências.');return;}show(title,text,choices.map(([label,fn,enabled=true])=>[label,()=>{s.flags[flag]=true;fn();award(s,'choice:'+flag,25);},enabled]));}

export function talk(id){switch(id){
case 'marinheiro':once('elias','O preço da travessia','Elias viu a caixa desembarcar. Ele pede que você prometa tirar os sobreviventes da ilha.',[
 ['Prometer ajudar · +1 confiança; rota de evacuação',()=>{s.trust++;s.flags.boat=true;log('Elias prepara um barco. Sua promessa será cobrada.');}],
 ['Exigir apenas informações · +10 conhecimento, -5 sanidade',()=>{s.occ=Math.min(100,s.occ+10);s.san-=5;log('Elias descreve os passageiros que respiravam água. Não oferecerá seu barco.');}]]);break;
case 'mara':once('mara','A chave entre as cinzas','Mara reconhece o nome na carta. A mansão guarda a segunda metade do desaparecimento.',[
 ['Compartilhar o manifesto · +2 confiança',()=>{s.trust+=2;log('Mara entrega a chave da mansão e confia em você.');},s.clues.includes('manifesto')],
 ['Argumentar · '+requirement(s,'eloquence',3)+' · +1 confiança',()=>{s.trust++;log('Sua reconstrução convence Mara a entregar a chave.');},check(s,'eloquence',3)],
 ['Mentir sobre sua identidade · acesso, -1 confiança',()=>{s.trust--;log('Mara entrega a chave, mas descobre sua mentira.');}]]);break;
case 'sobrevivente':once('helena','A pintora que sobreviveu','Helena não incendiou a casa: tentou destruir um quadro que ligava sua mente ao prisioneiro. Ela pede que você queime o último esboço.',[
 ['Queimar o esboço · +10 sanidade, +1 confiança',()=>{s.san+=10;s.trust++;s.flags.burn=true;log('O elo de Helena enfraquece. Ela ajudará os sobreviventes.');}],
 ['Estudar o esboço · +25 conhecimento, -'+Math.max(5,17-2*value(s,'occultism'))+' sanidade',()=>{s.occ=Math.min(100,s.occ+25);s.san-=Math.max(5,17-2*value(s,'occultism'));log('Você aprende a assumir o lugar do arauto. Helena se afasta.');}],
 ['Acalmar Helena e romper o elo · '+requirement(s,'psychology',3)+' · +15 sanidade, +2 confiança',()=>{s.san+=15;s.trust+=2;s.flags.burn=true;log('Você percebe o medo por trás do relato. Helena permite destruir o esboço e promete ajudar.');},check(s,'psychology',3)]]);break;
case 'medica':once('tunnel','Uma cura feita de silêncio','Avelar admite que o culto dirige o hospital. Ela pode abrir o túnel, mas pede que o nome dela não apareça nas provas.',[
 ['Aceitar o acordo · túnel e um curativo; provas comprometidas',()=>{s.kits++;s.flags.coverup=true;log('A médica abre o túnel. Você prometeu ocultar sua participação.');}],
 ['Exigir colaboração · prontuário OU '+requirement(s,'eloquence',3)+' · +1 confiança',()=>{s.trust++;log('Avelar aceita testemunhar. A rota subterrânea está aberta.');},check(s,'eloquence',3)||s.clues.includes('prontuario')],
 ['Arrombar · '+requirement(s,'strength',3)+(check(s,'strength',3)?' · sem dano':' · esforço arriscado: -15 vitalidade'),()=>{if(check(s,'strength',3)){log('Sua força rompe a fechadura sem ferimentos.');}else{s.hp-=15;log('A fechadura cede, ferindo sua mão.');if(s.hp<=0)finish('perdido');}}]]);break;
case 'cela':once('patient','A primeira testemunha','O paciente 34 investigou a cidade da costa em 1922. O que viu sob o recife foi transportado até aqui através de suas memórias.\n"Ela pinta o que eu lembro. O farol faz o resto."',[
 ['Resgatar · '+(check(s,'medicine',3)?'Medicina ≥ 3: sem gastar curativo':'gasta 1 curativo')+' · +2 confiança',()=>{if(!check(s,'medicine',3))s.kits--;s.flags.saved=true;s.trust+=2;log('O paciente segue por uma saída segura. A primeira testemunha está livre.');},s.kits>0||check(s,'medicine',3)],
 ['Extrair a lembrança ritual · +25 conhecimento, -20 sanidade',()=>{s.occ=Math.min(100,s.occ+25);s.san-=20;s.flags.extracted=true;log('Você absorve a memória do recife. O paciente permanece na cela.');}],
 ['Deixá-lo na cela · preserva recursos',()=>{log('O paciente observa você partir. A cela permanece fechada.');}]]);break;
case 'ritual':ritual();break;
}}

export function ritual(){show('As duas metades do chamado','O homem foi a testemunha. A pintora foi a lente. Você, atraído pela carta, seria a voz. Agora as duas investigações se unem neste círculo.\n\nOs requisitos são explícitos. Você pode voltar para buscar pistas ou ajuda antes de decidir.',[
 ['SELAR · selo + inscrição + sanidade ≥ 30',()=>finish('selar'),s.clues.includes('selo')&&s.clues.includes('inscricao')&&s.san>=30],
 ['REVELAR E EVACUAR · 7 pistas + confiança ≥ 3 + barco + paciente livre + sem acordo de silêncio',()=>finish('revelar'),s.clues.length===7&&s.trust>=3&&s.flags.boat&&s.flags.saved&&!s.flags.coverup],
 ['ASSUMIR O ESPELHO · conhecimento ≥ 60',()=>finish('espelho'),s.occ>=60],
 ['ACEITAR O CHAMADO · sempre disponível',()=>finish('chamado')],
 ['Recuar e continuar investigando',()=>{}]
]);}

export function finish(id){s.ending=id;log(endings[id][0]);show(endings[id][0],endings[id][1]+'\n\n'+(s.flags.saved?'O paciente foi libertado.':'O paciente não foi libertado.')+' '+(s.flags.burn?'Helena rompeu seu elo com o quadro.':'O quadro ainda guarda parte de Helena.')+'\nPistas: '+s.clues.length+'/7 · Sanidade: '+s.san+' · Conhecimento: '+s.occ,[['Ler meu diário',journal],['Nova investigação',newGame],['Observar o mapa',()=>{}]]);}
