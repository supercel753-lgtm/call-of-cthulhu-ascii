# RELATÓRIO DE ALTERAÇÕES — ECOS DO ABISMO 2.0.0

**Origem:** `call-of-cthulhu-ascii-main.zip` (fornecido pelo solicitante).
**Data da remasterização:** 03/11/2026.
**Estratégia:** intervenção na apresentação, preservando regras, dados narrativos e formato de save.

## Fase 1 — Auditoria

- Extraídos os arquivos originais e inspecionados `index.html`, `package.json`, `scripts/serve.js`, `README.md`, `LICENSE`, `_config.yml`, `Gemfile`, os 13 módulos em `src/` e a suíte de testes.
- Os 14 testes originais passaram na linha de base antes das mudanças.
- Campanha mapeada: seis regiões, sete pistas, cinco NPCs nomeados/relevantes, três formações, sete atributos, quatro finais principais e derrota, sistema de fuga, interações, sanidade e salvamento.
- Decisão arquitetural: conservar a camada de dados e gameplay e substituir o renderizador de glifos por raster Canvas, com dependências nativas do navegador.

## Fase 2 — Renderização

- `src/renderer.js` substituído por compositor de tiles e sprites PNG, câmera de acompanhamento, ordenação por profundidade Y, animação de quadros e Canvas 768×448 com vizinho mais próximo.
- Adicionado `buildScene()` para inspecionar o modelo de cena sem dependência de navegador e facilitar testes.
- Imagens são pré-carregadas por `preloadAssets()` com registro de erros e fallback de desenho em caso de falha.
- O minimapa ASCII foi substituído por Canvas raster, sem remover a informação sobre posição, pistas, saídas, personagens e inimigos.

## Fase 3 — Pixel art e cenários

- Criado `scripts/generate_assets.py`, com geração determinística e original, mantido no pacote.
- Sete sheets de personagem: investigador, Elias, Mara, Helena, médica, paciente e criatura; cada sheet com 4 direções e 8 estados/poses (incluindo idle, walk, sneak, interact, hurt e death quando aplicável).
- Um atlas de 21 modelos interativos e decoração: caixas, barris, lampiões, árvores, bancos, mesas, estantes, camas, colunas, estalagmites, ossos, portas e objetos das pistas.
- Seis tilesets com 12 tipos cada, contemplando madeira, pedra, azulejo, rocha, água, desgaste e vegetação.
- Seis panoramas regionais noturnos para a interface.
- `src/art.js` reduzido às configurações de regiões e à mobília sólida; removeram-se os desenhos de caracteres ASCII não utilizados pela versão 2D.

## Fase 4 — Iluminação e atmosfera

- Composição em buffer de luz de resolução reduzida para não aplicar filtros caros por pixel.
- Lanterna direcional conforme orientação do protagonista; atributo Visão aumenta o alcance.
- Luzes ambientais e escurecimento regional; oclusão baseada na linha de visão das paredes e mobília sólida.
- Chuva, poeira, goteiras/névoa, cintilação e efeitos de baixa sanidade.
- Alternância entre animação e modo reduzido, com preferência do sistema respeitada por padrão.

## Fase 5 — Interface e gameplay

- `index.html` e `src/style.css` redesenhados integralmente: HUD, cenário, painéis, mapa, dossiê, inventário, diário, pausa, configurações, rodapé e layout adaptativo.
- `src/ui.js` reformulado visualmente mantendo a assinatura e a semântica dos diálogos de escolha originais.
- Adicionados indicadores de atributos, barra de saúde/sanidade/conhecimento e inventário em cartões raster.
- Teclas I e Esc adicionadas; interação com toque mantida e ampliada em telas menores.
- `src/game.js` ganhou integração de direção, animação de interação e sons, preservando comportamento das regras e danos.
- `src/state.js` ganhou orientação inicial opcional (`facing`). Saves anteriores continuam reconhecidos.

## Fase 6 — Áudio

- `src/audio.js`: áudio HTML5 local, transição de faixa por região, efeitos, controle persistente de volume/mute e desbloqueio após gesto do usuário.
- Treze WAVs originais sintetizados proceduralmente e entregues na pasta `assets/audio/`.
- Nenhuma biblioteca de reprodução ou serviço externo é exigido.

## Fase 7 — Otimização

- Cap de atualização visual: 60 FPS (animação) / 4 FPS (movimento reduzido); jogabilidade segue turnos independentemente da renderização.
- Pré-carregamento de recursos e memoização de visibilidade por região/posição/Visão.
- Atlas de objetos único reduz o número de URLs e objetos de imagem.
- Canvas mantém escala lógica fixa para evitar recalcular o mundo em resoluções diferentes.
- `scripts/serve.js` atualizado para tipos MIME PNG/WAV e preservação do front matter em memória.

## Fases 8 e 9 — Testes e entrega

- Suite de 14 testes originais preservada e atualizada apenas onde dependia da antiga apresentação ASCII.
- Adicionados cinco testes de integridade de mídia/arquitetura e um teste HTTP de integração.
- Total: **20 testes Node executados com sucesso**, zero falhas.
- Teste real no Chromium tentado, porém bloqueado por política da máquina de QA: consulte `RELATORIO_TESTES.md`.
- Código-fonte, PNGs, WAVs, testes, instruções Windows/Linux/macOS e documentação incluídos no ZIP.

## Módulos de regras conservados

`data.js`, `world.js`, `story.js`, `rpg.js`, `rpg-ui.js`, `storage.js` e a maior parte da lógica de `game.js` mantêm o fluxo original. As condições dos finais, recompensas de XP, atributos, diálogos e posições de mundo não foram simplificadas.
