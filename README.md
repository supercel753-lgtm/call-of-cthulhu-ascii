# Ecos do Abismo

Jogo de horror e investigação ASCII, em português, com código JavaScript separado em `src/` e publicação por Jekyll no GitHub Pages. Versão 1.3 — edição Nocturne RPG: novo renderizador ASCII em Canvas 2D, mantendo módulos ES, sem ferramentas de empacotamento e sem bibliotecas de execução.

O jogo preserva seis regiões, sete pistas, três formações, diálogos com consequências, sanidade, furtividade, perseguição por turnos, salvamento local e quatro finais narrativos.

## Sistema de RPG — sete atributos

Balanceamento próprio baseado nos sete atributos solicitados; não é uma reprodução exata das regras ou dos valores de Call of Cthulhu (2018). O vídeo indicado não pôde ser recuperado neste ambiente; as definições usadas são as fornecidas pelo usuário.

Na criação, escolha seu passado e distribua **10 pontos**. Os sete atributos começam em **1** e vão até **5**. É possível desfazer a distribuição antes de confirmar; depois, a ficha permite somente aumentar valores com pontos disponíveis. A criação exige usar os dez pontos. O passado não concede bônus ocultos de atributo; Ocultista mantém o bônus explícito de 20 de conhecimento proibido.

| Atributo | Efeito implementado |
| --- | --- |
| Investigação | Análise extra do manifesto (3) e do jornal (2) |
| Medicina | Curativos recuperam `20 + 8 × atributo`; análise do prontuário (3); resgate sem gastar curativo (3) |
| Ocultismo | Analisa quadro e selo (3), inscrição (4); perda mental por artefato = `máximo(2, 10 − 2 × atributo)`; reduz o custo do esboço |
| Força | Arromba a porta do hospital sem dano em 3; abaixo disso permanece a alternativa arriscada, com 15 de dano |
| Eloquência | Convence Mara (3) e exige colaboração da médica sem prontuário (3) |
| Psicologia | Interpreta o diário (3) e acalma Helena (3), obtendo mais confiança e sanidade |
| Visão | Amplia a iluminação e indica a direção de pistas não lidas até `atributo + 1` quadrados de distância |

**F** ou **Atributos** abre a ficha durante o jogo. Cada **100 XP** aumenta um nível e concede **2 pontos**. Os pontos não precisam ser gastos imediatamente após subir de nível. Região inédita: 20 XP; pista principal: 40 XP; decisão de personagem: 25 XP; análise extra bem-sucedida: 30 XP. Recompensas são registradas por identificador e só podem ser recebidas uma vez.

Testes são determinísticos: o botão mostra atributo atual, requisito e se o resultado está disponível. Não há rolagem aleatória escondida. As análises extras podem ser tentadas depois de melhorar o atributo, relendo a pista. Pistas principais continuam acessíveis; não é preciso reiniciar por causa de uma distribuição.

**Ocultismo é habilidade; conhecimento proibido é um recurso narrativo diferente.** O primeiro ajuda a interpretar e resistir; o segundo influencia finais. Análises ocultas bem-sucedidas dão +5 de conhecimento proibido, além do XP.

Saves anteriores recebem os sete atributos em 1 e dez pontos livres na ficha, mantendo decisões, sanidade, vida e pistas. O XP só passa a ser concedido a novas ações realizadas nesta versão; ações já concluídas não recebem crédito retroativo. Novas análises de pistas antigas continuam disponíveis.

## Nova apresentação ASCII

- Investigador com chapéu, rosto, sobretudo, braços, pernas e lanterna; duas poses de caminhada e pose de furtividade.
- Personagens com silhuetas distintas: barqueiro, arquivista, pintora, médica e paciente. Criaturas têm animação própria.
- Cada célula lógica do mapa ocupa 6 × 6 caracteres. A câmera acompanha o investigador, mantendo um minimapa da região inteira.
- Seis panoramas originais, paletas regionais e materiais para madeira, pedra, azulejos e rocha.
- Caixas, barris, bancos, camas, estantes, colunas, ossadas e estalagmites. A mobília sólida usa a mesma posição para desenho e colisão.
- Luz visual por proximidade, chuva, poeira e goteiras. Os efeitos não avançam os turnos: é possível observar a cena sem sofrer ataques.
- Retratos ASCII nos diálogos, apresentação de regiões e resposta visual suave ao dano.
- Botão **Atmosfera** alterna animação e quadro estático. A preferência de movimento reduzido do sistema é respeitada por padrão, até que o usuário escolha outra opção.

O Canvas desenha glifos com `fillText`; não há imagens externas, textura fotográfica ou geração de imagens em tempo real. As sombras são estilizadas, sem simulação física nem oclusão por parede. A apresentação usa ASCII em visão superior com panorama separado, não um cenário 3D.

Saves anteriores são preservados. Se a posição antiga coincidir com uma nova peça de mobília, a migração move o personagem para a célula livre mais próxima sem alterar pistas ou decisões. A iluminação não esconde completamente as passagens.

## Arquivos e responsabilidades

| Arquivo | Conteúdo |
| --- | --- |
| `index.html` | Estrutura da tela, botões e entrada do módulo principal; front matter do Jekyll |
| `src/rpg.js` | Atributos, orçamento de pontos, progressão, requisitos e análises extras |
| `src/rpg-ui.js` | Criação de personagem, ficha e interface dos testes |
| `src/art.js` | Sprites humanos, criaturas, panoramas, retratos, paletas e mobília ASCII |
| `src/renderer.js` | Câmera, composição de caracteres, luz, clima e desenho em Canvas |
| `src/main.js` | Inicialização e controles de teclado/toque |
| `src/game.js` | Exploração, turnos, interações, transições, cura e repouso |
| `src/world.js` | Grade dos mapas, colisões, passagens e busca de caminho dos inimigos |
| `src/story.js` | Diálogos, efeitos das escolhas, ritual e conclusão |
| `src/data.js` | Definição das regiões, obstáculos, pistas e textos dos finais |
| `src/state.js` | Estado compartilhado e atributos iniciais |
| `src/storage.js` | Salvamento, carregamento e validação |
| `src/ui.js` | Renderização ASCII, estatísticas, diálogos, diário e ajuda |
| `src/style.css` | Aparência opcional; não contém regras do jogo |
| `_config.yml` | Configuração do Jekyll, sem tema externo |
| `Gemfile` | Dependência `github-pages` para compilar localmente com Ruby |
| `package.json` | Configuração de módulos JavaScript e comandos locais |
| `scripts/serve.js` | Servidor local de desenvolvimento em Node.js |
| `tests/game.test.js` | Testes de integração das regras usando o test runner do Node.js |
| `LICENSE` | Reserva de direitos, sem autorização geral de uso a terceiros |

O código é **JavaScript (`.js`)**, executado pelo navegador. Não usa Java (`.java`) nem exige JVM. O CSS pode ser alterado ou removido do `index.html`, embora isso retire o acabamento visual. A lógica fica integralmente nos módulos JavaScript.

## Atualizar o repositório anterior

1. Extraia o ZIP.
2. Envie seu conteúdo para a raiz do repositório, substituindo o antigo `index.html` e `README.md` e adicionando as pastas e os demais arquivos.
3. **Remova o arquivo `.nojekyll` da versão anterior**, se existir. Ele desativa o processamento pelo Jekyll.
4. Não envie apenas o ZIP nem coloque tudo dentro de uma pasta adicional.
5. Em **Settings → Pages → Build and deployment**, use **Deploy from a branch**.
6. Selecione a branch com os arquivos, normalmente `main`, e a pasta **/(root)**. Salve.
7. Aguarde a conclusão da publicação e abra a URL informada pelo GitHub.

Os endereços de `src/` são relativos (`./src/main.js`), por isso funcionam tanto na raiz de um domínio quanto no caminho de um repositório. Não é necessário inserir o nome do repositório nos imports. O Jekyll processa o front matter do `index.html` e copia os módulos estáticos; nenhum plugin adicional é usado.

**Não adicione `.nojekyll` nesta versão.** Se o texto `layout: null` aparecer na página publicada, confirme que o build passou pelo Jekyll e que o arquivo `.nojekyll` foi removido.

## Executar localmente com Node.js

Use Node.js 20 ou superior. Dentro da pasta do projeto:

```sh
npm start
```

Abra `http://127.0.0.1:8080`. Não é necessário executar `npm install`: o servidor e os testes usam apenas módulos nativos do Node.js.

Esse servidor remove o front matter do HTML em memória para permitir desenvolvimento rápido. Ele não substitui o compilador Jekyll e não processa templates Liquid. Os arquivos no disco permanecem intactos.

**Não abra o `index.html` por duplo clique:** módulos ES precisam de HTTP, e o arquivo-fonte contém front matter para o Jekyll.

## Compilar com Jekyll

Com Ruby e Bundler instalados:

```sh
bundle install
bundle exec jekyll serve
```

Abra a URL exibida no terminal. Para gerar apenas os arquivos finais:

```sh
bundle exec jekyll build
```

A saída fica em `_site/`. Não é necessário enviar `_site/` ao GitHub quando a publicação é feita a partir da branch com Jekyll.

## Jogar

| Controle | Ação |
| --- | --- |
| F | Abrir ficha e distribuir pontos |
| WASD / setas | Movimentar |
| E | Interagir no mesmo quadrado ou ao lado de uma pessoa, pista ou passagem |
| C | Alternar furtividade |
| J | Diário |
| M | Mapa da ilha |
| H | Usar curativo |
| R | Recuperar sanidade uma vez por região, longe de perseguidores |

Também existem botões para telas de toque. A exploração é por turnos. O perseguidor avança a cada dois turnos quando você está no alcance: nove quadrados normalmente, três com furtividade. Diálogos pausam a exploração.

O salvamento é automático e local ao navegador. A chave e o formato da versão anterior foram mantidos: o progresso anterior pode ser carregado se a página continuar na mesma origem e os dados não tiverem sido apagados. Navegação privada ou restrições de armazenamento podem impedir a persistência. Não existe sincronização entre dispositivos.

## Alterar e expandir

- Edite os desenhos e as paletas em `src/art.js`; altere câmera, luz e clima em `src/renderer.js`.
- Acrescente regiões e pontos de interesse em `src/data.js`.
- Defina condições das passagens em `src/world.js`, função `gate`.
- Edite as escolhas e suas consequências em `src/story.js`, função `talk`.
- Ajuste os requisitos dos finais em `src/story.js`, função `ritual`.
- Ajuste atributos iniciais em `src/state.js`, função `initial`.
- Ajuste dano, alcance e turnos em `src/game.js`, função `tick`.
- Mantenha a validação de `src/storage.js` coerente com qualquer alteração no estado.

O estado `s` é uma referência compartilhada pelos módulos. Substituições completas passam por `setState`; atualizações de atributos modificam o mesmo objeto. Os módulos de interface, história e jogo usam referências entre funções, chamadas somente após a inicialização em `main.js`. Não adicione chamadas de renderização no topo desses módulos.

## Testes

```sh
npm test
```

Quatorze testes cobrem criação, orçamento de pontos, progressão sem repetição, efeitos dos atributos e migração de saves, além de a nova renderização, alternância de efeitos, mobília e migração de saves, além de: inicialização dos módulos e retorno do menu sem save; acesso aos pontos de interesse dos seis mapas; sequência de decisões para revelação; os outros três finais e bloqueio de requisitos; persistência e rejeição de dados incompatíveis; perseguição e derrota.

Os testes simulam o DOM e verificam regras. Não substituem a validação visual ou a compilação real do Jekyll. Nesta entrega foram inspecionados quadros gerados pelo compositor ASCII e exercitado o desenho com Canvas simulado. O build Ruby/Jekyll e a avaliação completa em navegador real não foram executados neste ambiente; a instalação do navegador de teste não ficou disponível.

## História e direitos

A campanha é uma releitura própria inspirada no horror costeiro de *Dark Corners of the Earth* e na investigação insular de *Call of Cthulhu (2018)*. Um investigador desaparecido e uma pintora são ligados por um ritual. Não reproduz integralmente os roteiros, não é um port oficial e não contém recursos extraídos desses jogos.

Este projeto **não é disponibilizado sob licença de código aberto**. O arquivo `LICENSE` reserva os direitos e não concede permissão geral de uso, cópia, modificação, distribuição ou exploração comercial a terceiros. As restrições não são dirigidas ao próprio titular no exercício dos seus direitos. O titular deve ser identificado na versão publicada, caso deseje registrar seu nome ou razão social; não foi atribuído um nome presumido.

A licença não é um bloqueio técnico: publicar o código em repositório público permite sua leitura e, conforme os termos do GitHub, forks dentro da plataforma. Direitos legais, de terceiros e permissões da plataforma permanecem ressalvados. Publicar o jogo e permitir que visitantes o executem requer autorização compatível do titular; este pacote não concede automaticamente essa autorização geral.

## Referências de publicação

- [GitHub Pages: fonte de publicação](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Jekyll: front matter](https://jekyllrb.com/docs/front-matter/)
- [GitHub: licenciamento de repositórios](https://docs.github.com/pt/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
