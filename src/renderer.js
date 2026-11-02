import {value} from './rpg.js';
// Renderizador ASCII: cada pixel visível do cenário é um glifo de texto.
// Mantém a grade lógica original; amplia cada célula em 6 x 6 caracteres.
import { CELL, SPRITES, THEMES, PANORAMAS, PORTRAITS, DECOR, PROPS } from './art.js';
import { regions, W, H } from './data.js';
import { grid, nearby } from './world.js';

export const VIEW = { cols: 114, rows: 62, top: 12, height: 48, cw: 8, ch: 12 };
const cache = new Map();
const limited = (v, min, max) => Math.max(min, Math.min(max, v));
const hash = (x, y, seed = 0) => ((x * 374761 + y * 668265 + seed * 127) >>> 0) % 101;
const hex = (c) => c.match(/[a-f0-9]{2}/gi).map(v => parseInt(v, 16));
function dim(color, amount) {
  const level = Math.round(limited(amount, .28, 1) * 7) / 7;
  const key = color + level;
  if (!cache.has(key)) cache.set(key, 'rgb(' + hex(color).map(v => Math.round(v * level)).join(',') + ')');
  return cache.get(key);
}

export function buildFrame(state, time = 0, motion = true) {
  const theme = THEMES[state.region];
  const frame = Array.from({ length: VIEW.rows }, () => Array.from({ length: VIEW.cols }, () => ({ char: ' ', color: '#101a1c' })));
  const tick = motion ? Math.floor(time / 180) : 0;
  const put = (x, y, text, color) => {
    if (y < 0 || y >= VIEW.rows) return;
    for (let i = 0; i < text.length; i++) if (x + i >= 0 && x + i < VIEW.cols) frame[y][x + i] = { char: text[i], color };
  };
  const stamp = (x, y, rows, color) => rows.forEach((line, i) => put(x, y + i, line, color));
  const cx = limited(state.x * CELL.width - Math.floor(VIEW.cols / 2), 0, W * CELL.width - VIEW.cols);
  const cy = limited(state.y * CELL.height - Math.floor(VIEW.height / 2), 0, H * CELL.height - VIEW.height);
  // Establishing shot remains visible over the moving exploration viewport.
  const art = PANORAMAS[state.region].split('\n').slice(1);
  stamp(1, 0, art, theme.sky);
  put(57, 2, 'S A O   B R E U  /  1 9 2 8', '#86a29a');
  put(57, 4, theme.name, theme.accent);
  put(57, 6, theme.subtitle, '#8d9991');
  put(57, 8, state.sneak ? '[ PASSOS ABAFADOS ]' : '[ LANTERNA ACESA ]', '#bcc7b8');
  put(0, 10, '_'.repeat(VIEW.cols), '#334e4b');

  const g = grid(state.region);
  // Light is visual only: it never changes collision or hides an exit completely.
  for (let vy = 0; vy < VIEW.height; vy++) {
    for (let vx = 0; vx < VIEW.cols; vx++) {
      const wx = vx + cx, wy = vy + cy;
      const tx = Math.floor(wx / CELL.width), ty = Math.floor(wy / CELL.height);
      const lx = wx % CELL.width, ly = wy % CELL.height;
      const tile = g[ty]?.[tx] || '#';
      const dist = Math.hypot(wx / CELL.width - state.x, (wy / CELL.height - state.y) * .85);
      let light = Math.max(.43, 1 - dist / (10 + value(state,'awareness') * 3));
      for (const [x, y] of theme.lamps) light = Math.max(light, .85 - Math.hypot(wx / CELL.width - x, wy / CELL.height - y) / 10);
      let char = ' ', color = theme.floor;
      if (tile === '#') {
        color = theme.wall;
        if (theme.material === 'rock') char = ['/', '\\', '.', ':', '#', '^'][hash(wx, wy) % 6];
        else if (ly === 0 || ly === 3) char = '-';
        else char = ((lx + (ly > 3 ? 3 : 0)) % 6 === 0) ? '|' : (hash(wx, wy) < 8 ? ':' : ' ');
      } else if (tile === '~') {
        char = '~=-~_-'[(wx + Math.floor(wy / 2) + tick) % 6]; color = '#73aab6';
      } else {
        const r = hash(wx, wy);
        if (theme.material === 'wood') char = ly === 5 && (lx === 0 || lx === 5) ? '.' : r < 4 ? ':' : ' ';
        else if (theme.material === 'tile') char = ly === 5 && lx === 0 ? '+' : r < 3 ? '.' : ' ';
        else if (theme.material === 'rock') char = r < 14 ? ['.', ',', '`', ':'][r % 4] : ' ';
        else char = ly === 5 ? '.' : lx === 0 && ly === 2 ? ':' : r < 4 ? '`' : ' ';
        light *= .76;
        // Passing rain, dust and mist occupy empty floor characters only.
        if (motion && char === ' ' && hash(wx + tick, wy - tick, 17) < 2) {
          char = theme.weather === 'rain' ? '/' : theme.weather === 'drip' ? ':' : '.';
          color = theme.sky;
        }
      }
      frame[vy + VIEW.top][vx] = { char, color: dim(color, light) };
    }
  }
  const actors = (DECOR[state.region] || []).map(([x,y,kind]) => ({x,y,sprite:PROPS[kind],color:kind==='lamp'?theme.accent:theme.wall,label:''}));
  for (const object of regions[state.region].objects) {
    const [id, x, y, type] = object;
    let sprite = SPRITES.book[0], color = theme.accent;
    if (type === '>') { sprite = SPRITES.door[0]; color = '#94b8c8'; }
    else if (type === 'N') {
      const npc = { marinheiro: 'elias', mara: 'mara', sobrevivente: 'helena', medica: 'doctor', cela: 'patient' }[id];
      sprite = SPRITES[npc][0]; color = theme.npc;
    } else if (id === 'quadro') sprite = SPRITES.painting[0];
    else if (id === 'selo') sprite = SPRITES.seal[0];
    else if (id === 'ritual') sprite = SPRITES.ritual[0];
    if (state.clues.includes(id)) color = '#6b7972';
    actors.push({x, y, sprite, color, label: type === '>' ? 'SAIDA' : type === 'N' ? 'FALAR' : state.clues.includes(id) ? 'LIDO' : 'PISTA'});
  }
  for (const e of state.enemies[state.region] || []) actors.push({ ...e, sprite: SPRITES.creature[tick % 2], color: '#f59e91', label: 'PERIGO' });
  actors.push({ x: state.x, y: state.y, sprite: state.sneak ? SPRITES.crouch[0] : SPRITES.investigator[state.turn % 2], color: '#f5e2b4', label: 'VOCE', player: true });
  actors.sort((a, b) => a.y - b.y || Number(a.player) - Number(b.player));
  for (const actor of actors) {
    const x = actor.x * CELL.width - cx, y = actor.y * CELL.height - cy + VIEW.top;
    const close = Math.abs(actor.x - state.x) + Math.abs(actor.y - state.y) <= 1;
    // Crop sprites to the world viewport so they never overwrite the panorama.
    actor.sprite.forEach((line, i) => { if (y + i >= VIEW.top && y + i < VIEW.top + VIEW.height) put(x, y + i, line, actor.color); });
    if (actor.label && y - 1 >= VIEW.top && y - 1 < VIEW.top + VIEW.height) put(x, y - 1, close && !actor.player ? '[E]' : actor.label, close ? '#f5e2b4' : dim(actor.color, .78));
  }
  put(0, 61, '  ' + (state.sneak ? 'FURTIVO' : 'EXPLORANDO') + '  /  ' + (regions[state.region].name.split(' · ')[1] || state.region) + '  /  X:' + state.x + ' Y:' + state.y, '#9ab6a8');
  put(82, 61, 'WASD  MOVER     E  INTERAGIR', '#ddc697');
  return frame;
}

let canvas, context, activeState, animation, lastFrame = -Infinity, lastRegion, lastHP;
let effects = true;
export function paintFrame(state, now = 0) {
  if (!context) return;
  const frame = buildFrame(state, now, effects);
  context.fillStyle = '#081114';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = 'bold 12px "Courier New", monospace';
  context.textBaseline = 'top';
  frame.forEach((row, y) => row.forEach((cell, x) => {
    if (cell.char === ' ') return;
    context.fillStyle = cell.color;
    context.fillText(cell.char, x * VIEW.cw, y * VIEW.ch);
  }));
}
function loop(now) {
  if (activeState && !document.hidden && now - lastFrame >= 120) {
    paintFrame(activeState, now); lastFrame = now;
  }
  animation = requestAnimationFrame(loop);
}
export function initRenderer() {
  canvas = document.getElementById('scene');
  if (!canvas?.getContext) return; // Logical tests can run without Canvas.
  context = canvas.getContext('2d');
  if (!context) return;
  canvas.width = VIEW.cols * VIEW.cw;
  canvas.height = VIEW.rows * VIEW.ch;
  effects = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { if (localStorage.getItem('ecos-effects') !== null) effects = localStorage.getItem('ecos-effects') === 'on'; } catch {}
  const button = document.getElementById('effects');
  const update = () => { button.textContent = effects ? 'Atmosfera: animada' : 'Atmosfera: estática'; button.setAttribute('aria-pressed', String(effects)); };
  button.onclick = () => { effects = !effects; try { localStorage.setItem('ecos-effects', effects ? 'on' : 'off'); } catch {} update(); if (activeState) paintFrame(activeState, 0); };
  update();
  if (!animation) animation = requestAnimationFrame(loop);
}
export function renderScene(state) {
  activeState = state;
  if (!canvas) initRenderer();
  if (canvas?.setAttribute) canvas.setAttribute('aria-label', regions[state.region].name + '. Investigador humano de chapéu e sobretudo na posição ' + state.x + ', ' + state.y + '. ' + nearby().map(o => o[4]).join(', '));
  const legend = document.getElementById('sceneCaption');
  if (legend) legend.textContent = state.san < 30 ? 'Sua respiração se confunde com os passos no escuro.' : THEMES[state.region].subtitle;
  const banner = document.getElementById('regionBanner');
  if (banner && lastRegion !== state.region) {
    banner.textContent = THEMES[state.region].name;
    if (banner.animate && effects) banner.animate([{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.75},{opacity:0}], {duration:2600,fill:'forwards'});
    else banner.style && (banner.style.opacity = '0');
  }
  if (canvas?.animate && lastHP !== undefined && state.hp < lastHP && effects) canvas.animate([{opacity:.65},{opacity:1}],{duration:450});
  lastRegion = state.region; lastHP = state.hp;
  paintFrame(state, effects && typeof performance !== 'undefined' ? performance.now() : 0);
}
export function portraitFor(title) {
  if (/pintora|médica|cura|testemunha|preço|chave|paciente/i.test(title)) return PORTRAITS.person;
  if (/pista|retrato|carga|prontuário|selo|contramaré|diário|incursão|memória/i.test(title)) return PORTRAITS.clue;
  if (/chamado|mar lembra|espelho|vigília|ondas|abismo/i.test(title)) return PORTRAITS.sea;
  return PORTRAITS.investigator;
}
