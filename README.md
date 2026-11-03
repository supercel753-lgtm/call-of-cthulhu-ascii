# ECOS DO ABISMO — NOCTURNE PIXEL REMASTER

**Versão 2.0.0 | Campanha narrativa original em português | JavaScript + Canvas 2D**

Survival horror investigativo 2D com arte raster original em pixel art, seis áreas, investigação por turnos, personagens com escolhas persistentes, progressão de sete atributos, sanidade, furtividade e quatro finais principais. Esta remasterização parte dos arquivos originais `call-of-cthulhu-ascii-main.zip`; preserva os sistemas de história, RPG, exploração, colisão e salvamento, e substitui integralmente a representação ASCII exibida no jogo por atlases de pixels.

**O jogo não utiliza personagens nem recursos copiados de jogos comerciais.** A atmosfera de terror cósmico é uma inspiração estética geral. Direitos reservados conforme `LICENSE` original.

## Abrir o jogo localmente

Requer **Node.js 20 ou superior** (testado com Node.js 22.16.0). Não necessita de instalação de dependências npm, internet, serviços externos, framework nem Python para jogar.

**Windows:** abra a pasta extraída e execute `INICIAR_WINDOWS.bat` (ou abra o terminal nessa pasta, execute `npm start` e acesse o endereço abaixo).

**Linux e macOS:** no terminal, abra a pasta e execute:

```sh
npm start
```

Depois, no navegador moderno, acesse **http://127.0.0.1:8080/**. O servidor escuta somente no seu próprio computador. Se a porta 8080 estiver ocupada, execute por exemplo `PORT=8187 npm start` (Linux/macOS) ou `set PORT=8187 && npm start` (Windows CMD), e ajuste a URL.

Não abra o `index.html` com duplo clique: este projeto é baseado em módulos JavaScript ES e usa HTTP local. O servidor converte o front matter Jekyll apenas na resposta HTTP, preservando o arquivo original.

O projeto também pode ser publicado com GitHub Pages + Jekyll: os caminhos de arquivos são relativos e `_config.yml`, `Gemfile` e front matter foram preservados. Não adicione `.nojekyll`.

## Como jogar

1. Escolha uma formação: **Detetive**, **Médico** ou **Ocultista**.
2. Distribua **10 pontos** entre sete atributos, inicialmente com valor 1 e limite 5; os testes de atributos exibem seu requisito antes da decisão.
3. Explore com **WASD** ou setas. Aproxime-se de objetos, NPCs e passagens e pressione **E**. O ícone E aparece no cenário quando há algo ao alcance.
4. Leia as pistas e escolha respostas. As decisões alteram confiança, sanidade, conhecimento, resgate, sigilo e possíveis finais.
5. Salve e carregue pelo menu inferior. O progresso também é salvo automaticamente no armazenamento local.

| Tecla | Função |
| --- | --- |
| WASD / setas | Andar nas quatro direções, com colisões |
| E | Investigar, conversar, usar passagem |
| C | Ativar/desativar furtividade |
| F | Ficha RPG e distribuição de pontos |
| J | Diário de investigação |
| I | Inventário visual |
| M | Carta da ilha |
| H | Usar curativo (se houver e existir dano) |
| R | Respirar: recuperar sanidade uma vez por região, longe de inimigos |
| Esc | Pausa, menus e configurações |

Controles virtuais aparecem automaticamente em telas menores. Sons podem ser silenciados com `SOM`, e o volume pode ser ajustado em `AJUSTES`. O áudio começa apenas após uma interação do usuário, por exigência de navegadores modernos.

## Campanha original preservada

**Regiões:** porto dos afogados → vila de São Breu → mansão Vesper / hospital de Santa Bruma → grutas da maré negra → farol do último sonho.

**Pistas principais (7):** manifesto de carga, arquivo do jornal, retrato, diário de Helena, prontuário do paciente 34, selo partido e inscrição da contramaré. Análises especializadas permanecem disponíveis e não bloqueiam o acesso às pistas principais.

**Personagens:** Elias, Mara, Helena Vesper, Dra. Avelar, Paciente 34 e o investigador criado pelo jogador. **Finais:** selar o ritual, revelar e evacuar, ocupar o espelho, aceitar o chamado, além de derrota por morte.

**Regras preservadas:** exploração por turnos, perseguição com detecção 9/3 quadrados, inimigos movendo a cada dois turnos, danos originais, requisitos de escolha, sanidade, conhecimento, confiança, curativos, 100 XP por nível, +2 pontos por nível e recompensas concedidas uma única vez. Os atributos continuam Investigação, Medicina, Ocultismo, Força, Eloquência, Psicologia e Visão. A campanha não possui combate armado.

**Saves antigos:** o formato `version: 1` e a chave `ecos-abismo-v1` são mantidos. A migração de saves antigos preserva progresso e decisões, corrige posições ocupadas por mobília e fornece atributos RPG quando ausentes. O campo visual `facing` é opcional para saves anteriores.

## Remasterização visual e sonora

- **20 PNGs raster originais:** 7 spritesheets animadas de personagens (8 poses por 4 direções), atlas com 21 tipos de objetos, 6 tilesets regionais com 12 variantes e 6 panoramas de abertura de local.
- **Cenários:** piso, paredes, água, madeira, pedra, azulejos e rochas; mobiliário sólido coincide com as células de colisão.
- **Câmera:** viewport Canvas interno 768 × 448 em pixel art com `image-rendering: pixelated`, acompanhando o jogador sem interpolação borrada.
- **Iluminação:** luz ambiental distinta por região, lanterna direcionada pelo último movimento, alcance ampliado pela habilidade Visão, lâmpadas, oclusão de obstáculos, neblina, chuva, poeira e efeitos de pânico.
- **Animações:** repouso, caminhada, ação/interação, furtividade, dano e morte do protagonista; sprites modulares de NPCs e inimigo.
- **Interface:** HUD de vitalidade, sanidade e conhecimento, inventário rasterizado, mapa Canvas, diário temático, tela de pausa, ficha e opções de áudio.
- **13 WAVs originais:** seis drones ambientes por região e efeitos de passos, coleta, passagem, dano, criatura, sussurro e interface. Volume/mute salvos separadamente.
- **Desempenho:** loop de renderização limitado a 60 FPS quando a animação está habilitada, reduzido para 4 atualizações por segundo quando ela está desativada. Recursos pré-carregados e cachê de visibilidade por posição. O FPS efetivo depende do dispositivo.

Os assets foram desenhados e sintetizados proceduralmente pelo script `scripts/generate_assets.py`; **não são placeholders de terceiros**. Este script requer Python 3 e Pillow **somente para regenerar os assets**. Os PNGs e WAVs prontos já estão incluídos e o jogo funciona sem Python.

## Organização dos arquivos

| Arquivo/pasta | Responsabilidade |
| --- | --- |
| `index.html` / `src/style.css` | Página, HUD, menus e layout responsivo |
| `src/main.js` | Inicialização, teclado, toque e comandos |
| `src/renderer.js` | Renderizador raster, composição, câmera, luz, clima, minimapa |
| `src/art.js` | Paletas de regiões, posições de mobília sólida e lâmpadas |
| `src/audio.js` | Gestão de trilhas WAV, volume, mute e desbloqueio de áudio |
| `src/game.js`, `src/world.js` | Exploração, turnos, perseguição, movimentação e colisão |
| `src/story.js`, `src/data.js` | História, diálogos, região, pistas, escolhas e finais |
| `src/rpg.js`, `src/rpg-ui.js` | Regras e ficha dos sete atributos |
| `src/state.js`, `src/storage.js`, `src/ui.js` | Estado, saves, interações e UI de investigação |
| `assets/tiles/` | Tilesets PNG de seis regiões |
| `assets/sprites/` | Personagens animados e props PNG |
| `assets/panoramas/` | Arte original de seis regiões |
| `assets/audio/` | Áudios WAV originais |
| `scripts/generate_assets.py` | Pipeline reproduzível de arte e áudio |
| `scripts/serve.js` | Servidor HTTP local, sem dependências |
| `tests/` | 20 testes automatizados Node e script opcional de navegador CDP |
| `docs/` | Alterações, testes, limitações e checklist manual |

## Testes

Execute na pasta do jogo:

```sh
npm test
```

**Resultado registrado na entrega:** 20 testes aprovados, zero falhas, utilizando Node.js v22.16.0. Os testes cobrem as regras anteriores, todas as regiões/pontos acessíveis, os quatro finais, persistência e migração de saves, spritesheets e sons, imports, apresentação em Canvas simulado e resposta real do servidor HTTP a módulos, PNGs e WAVs.

**Importante:** o teste exploratório em Chromium real foi tentado, mas o navegador da máquina de validação bloqueou acessos locais por política administrativa (`net::ERR_BLOCKED_BY_ADMINISTRATOR`). Não houve validação visual final no browser, teste de áudio reproduzido nem medição de FPS. Consulte `docs/RELATORIO_TESTES.md`, `docs/LIMITACOES.md` e `docs/CHECKLIST_QA_MANUAL.md`. O teste opcional `tests/browser_smoke.py` permite repetir o roteiro após habilitar navegação local e ferramentas CDP em um ambiente autorizado.

## Solução de problemas

**A página mostra front matter (`--- layout: null ...`):** você abriu o arquivo no modo errado; use `npm start` ou um build Jekyll adequado.

**Navegador não abre o endereço:** confirme Node.js instalado e se o servidor está rodando; se a porta 8080 estiver ocupada, altere `PORT`.

**Arte ou áudio não carrega:** confira se a pasta `assets/` foi extraída por inteiro e se a barra superior mostra `PIXEL ART · RECURSOS CARREGADOS`. O servidor usa MIME `image/png` e `audio/wav`.

**O som não toca:** clique ou pressione uma tecla no jogo. O autoplay é bloqueado até gesto do usuário em muitos navegadores. Verifique mute, volume e permissão do navegador.

**O save não aparece:** progressos ficam no navegador e na origem HTTP onde foram criados; `localhost` e `127.0.0.1` são origens diferentes. Modo privado e limpeza de dados podem apagar o save.

## Direitos

Consulte `LICENSE`. O conteúdo narrativo original foi mantido; sprites e WAVs desta remasterização são criados para este projeto, sem recursos comerciais de terceiros. Este pacote não altera nem amplia as permissões legais concedidas pelo titular.
