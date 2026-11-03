# RELATÓRIO DE TESTES — 03/11/2026

## Ambiente

- Linux (container de execução), Node.js v22.16.0.
- Servidor HTTP local via `node scripts/serve.js`.
- Python 3/Pillow para gerar e inspecionar os recursos originais.
- Chromium 144 instalado, mas com política administrativa de bloqueio a sites locais e links de arquivo.

## Linha de base original

Comando: `npm test` no conteúdo original extraído.
Resultado: **14 aprovados / 14**, antes da remasterização.

## Suite atualizada

Comando: `npm test` na raiz do jogo remasterizado.
Resultado: **20 aprovados / 20, zero falhas**.

| Área | Situação | Evidência |
| --- | --- | --- |
| Inicialização dos módulos e introdução com DOM simulado | APROVADO | `tests/game.test.js` |
| Todos os pontos de interesse dos seis mapas acessíveis | APROVADO | Busca completa sobre células navegáveis |
| História: rota de revelação e evacuação | APROVADO | Sequência de sete pistas, resgate e decisões |
| História: selar, espelho e chamado; requisitos bloqueados | APROVADO | Simulação das escolhas |
| Persistência e rejeição de saves inválidos | APROVADO | Salva, modifica estado, carrega e valida |
| Perseguição, dano e derrota | APROVADO | Testes por turno |
| Cenas rasterizadas e variação temporal/estática | APROVADO | `buildScene` + atributos |
| Colisão de mobiliário e migração de saves | APROVADO | Células DECOR e validação |
| Renderização em Canvas simulado e mudança de efeitos | APROVADO | Contexto 2D simulado |
| Níveis, pontos, recompensas sem duplicação | APROVADO | RPG |
| Efeitos de atributos em cura, medo, conhecimento e lanterna | APROVADO | RPG e modelo de cena |
| Condições de Força, Eloquência e Psicologia | APROVADO | Diálogos |
| Migração de save antigo sem atributos RPG | APROVADO | Storage |
| Distribuição inicial dos 10 pontos | APROVADO | Interface DOM simulada |
| Dimensões/assinaturas de 20 PNGs | APROVADO | `tests/assets.test.js` |
| Convergência decoração/colisão/pontos interativos | APROVADO | Dados + atlas |
| Cabeçalhos e amostragem de 13 WAVs | APROVADO | Arquivos RIFF PCM, 16 kHz mono |
| Imports relativos entre módulos ES | APROVADO | Verificação de existência |
| Estrutura HTML/CSS raster/responsiva | APROVADO (estático) | Verificação de marcadores e media queries |
| HTTP HTML/JS/PNG/WAV, MIME e front matter | APROVADO | Servidor real e requisições HTTP |

## Teste em navegador real — BLOQUEADO

Foi aberto o Chromium 144 em modo headless com interface Chrome DevTools Protocol. Houve tentativa de navegar para `http://127.0.0.1:8187/`, `http://localhost:8187/` e `file:///.../index.local.html`. Todos foram bloqueados pela política administrativa instalada no navegador, que retornou **`net::ERR_BLOCKED_BY_ADMINISTRATOR`** e a mensagem **"Your organization doesn't allow you to view this site"**.

O servidor HTTP foi verificado independentemente com sucesso, inclusive os caminhos dos módulos, PNGs e WAVs. No entanto, **os seguintes testes de navegador não foram executados até a conclusão**:

- Inspeção final da imagem composta dentro de um Canvas real e conferência visual dos seis cenários in-game.
- Cliques reais no navegador, mapeamento de teclas e transições de modal.
- Reprodução audível e troca de faixas WAV por região, permissões de autoplay e mute/volume.
- Console JS e rede durante sessão jogável em Chromium.
- Responsividade visual a 390 px / 768 px e medições efetivas de FPS/CPU/memória.
- Build Jekyll real com Ruby/Bundler.

Foi criado `tests/browser_smoke.py` para permitir execução futura desse roteiro em um ambiente que autorize páginas locais. O compositor Python utilizado para criar `docs/preview_cenarios.png` verifica elementos dos assets, **mas não substitui renderização feita pelo navegador**.

## Como fazer o teste manual final

Consulte `CHECKLIST_QA_MANUAL.md`. Após conferir as telas e recursos, registre os resultados do navegador em um relatório complementar. **Não declare homologação visual ou 60 FPS comprovados apenas com base na suite Node.**
