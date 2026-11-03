// Paletas regionais e cenário — dados para o renderizador raster em pixel art.
// O atlas PNG é produzido em scripts/generate_assets.py.
export const THEMES = {
  porto: { sky: '#789d98', floor: '#456875', wall: '#638998', npc: '#cfb18b', accent: '#e6bb79', weather: 'rain', name: 'O PORTO DOS AFOGADOS', subtitle: 'A maré trouxe uma carta. E algo mais.', material: 'wood', lamps: [[6,6],[20,8],[32,8]] },
  vila: { sky: '#8e9e96', floor: '#51675f', wall: '#7e8978', npc: '#d9b8a6', accent: '#d0bb83', weather: 'rain', name: 'A VILA SEM JANELAS', subtitle: 'Ninguém admite ter ouvido o sino.', material: 'stone', lamps: [[12,6],[24,5],[33,12]] },
  mansao: { sky: '#ab8e88', floor: '#665758', wall: '#ae8b7c', npc: '#e0c6be', accent: '#d8a572', weather: 'dust', name: 'AS CINZAS DE VESPER', subtitle: 'Os retratos respiram entre as rachaduras.', material: 'wood', lamps: [[19,4],[29,5],[29,12]] },
  hospital: { sky: '#83ada7', floor: '#4c7170', wall: '#a1b7aa', npc: '#decec0', accent: '#9adbc9', weather: 'dust', name: 'O PAVILHÃO DO SILÊNCIO', subtitle: 'Algumas portas foram trancadas por dentro.', material: 'tile', lamps: [[17,4],[17,12],[29,8]] },
  grutas: { sky: '#8ca0c4', floor: '#52667c', wall: '#7c8aa5', npc: '#b1a6d4', accent: '#b7b0ef', weather: 'drip', name: 'A GARGANTA DA ILHA', subtitle: 'O eco responde antes de você falar.', material: 'rock', lamps: [[17,8],[26,13],[33,8]] },
  farol: { sky: '#a7bdac', floor: '#556c64', wall: '#99a68c', npc: '#d1c7ad', accent: '#a6edc8', weather: 'mist', name: 'O OLHO DO ABISMO', subtitle: 'A luz não aponta para o horizonte.', material: 'stone', lamps: [[30,8],[16,8]] },
};


// Posicionamento sólido dos objetos: motor de colisões e renderizador compartilham coordenadas.
export const DECOR = {
  porto: [[4,3,'crate'],[5,3,'crate'],[6,3,'barrel'],[13,5,'lamp'],[14,5,'crate'],[12,12,'barrel'],[13,12,'barrel'],[15,13,'crate'],[24,8,'lamp'],[27,5,'crate'],[28,5,'crate'],[30,13,'barrel'],[7,12,'bench'],[32,5,'lamp']],
  vila: [[4,3,'tree'],[5,12,'tree'],[6,12,'bench'],[16,5,'lamp'],[19,3,'tree'],[25,3,'barrel'],[27,6,'bench'],[18,13,'lamp'],[31,6,'tree'],[32,10,'lamp'],[4,14,'barrel'],[22,13,'crate']],
  mansao: [[5,3,'shelf'],[6,3,'shelf'],[7,3,'shelf'],[9,12,'pillar'],[6,12,'table'],[15,4,'pillar'],[22,4,'pillar'],[18,11,'table'],[19,11,'bench'],[28,3,'shelf'],[32,3,'lamp'],[32,12,'pillar'],[27,13,'table'],[15,13,'shelf']],
  hospital: [[4,3,'bed'],[6,3,'bed'],[4,12,'bed'],[6,12,'bed'],[13,3,'shelf'],[20,3,'lamp'],[13,12,'table'],[14,13,'shelf'],[26,7,'bed'],[26,9,'bed'],[33,3,'lamp'],[20,13,'barrel']],
  grutas: [[5,3,'stalagmite'],[6,12,'stalagmite'],[11,4,'stalagmite'],[12,12,'bones'],[15,7,'pillar'],[19,7,'pillar'],[22,13,'bones'],[26,3,'stalagmite'],[30,12,'stalagmite'],[32,6,'pillar'],[32,10,'pillar']],
  farol: [[5,3,'barrel'],[5,12,'crate'],[10,6,'pillar'],[10,10,'pillar'],[16,5,'pillar'],[16,11,'pillar'],[22,5,'pillar'],[22,11,'pillar'],[29,5,'bones'],[29,11,'bones'],[33,5,'lamp'],[33,11,'lamp']],
};
