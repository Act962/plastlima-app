# Pendência — corte das ofertas em formato retrato

> **Status:** aberto, a decidir. As imagens já estão no site; falta ajustar o
> enquadramento. Nada quebrado — é uma decisão visual.

## O problema

A grade de ofertas da home usa **cards quadrados** (`aspect-square`) com
`object-cover`. Quando a imagem da oferta é quadrada (1080×1080), ela encaixa
perfeitamente. Quando é **retrato**, o `object-cover` preenche o quadrado e
**corta o topo e a base** da arte.

Medido na página: uma imagem 4:5 (1080×1350) perde **~20% da altura** — cerca de
**10% no topo e 10% na base**.

### O que é cortado

Nas três ofertas novas (retrato 4:5), some justamente onde costuma haver
informação importante:

- **Topo:** a logo PlastLima / início do título da peça.
- **Base:** a faixa de ícones de benefícios ("PRÁTICAS E RESISTENTES",
  "VAI AO FREEZER", "QUALIDADE QUE PROTEGE", etc.).

### Imagens afetadas

Somente as de formato retrato (1080×1350):

| Arquivo | Peça |
| --- | --- |
| `apps/web/public/offers/offer-09.jpg` | "A embalagem certa faz toda diferença" |
| `apps/web/public/offers/offer-10.jpg` | "Petisco no copo — copo PIC 040" |
| `apps/web/public/offers/offer-11.jpg` | "A qualidade da embalagem define o retorno" |

As antigas (`offer-01.jpg` … `offer-08.jpg`) são quadradas (1080×1080) e **não
têm problema** — encaixam certinho.

## Onde está no código

Arquivo: [`apps/web/src/components/home/offers-section.tsx`](../apps/web/src/components/home/offers-section.tsx)

- Linha 33 — o `<a>` do card define `aspect-square` (proporção quadrada).
- Linha 40 — a `<Image>` usa `object-cover` (preenche e corta).

A lista de imagens fica em
[`apps/web/src/data/home.ts`](../apps/web/src/data/home.ts) (`OFFER_HIGHLIGHTS`).

## Opções para corrigir

### Opção A — Deixar como está (não fazer nada)
O produto/centro da arte aparece; só as bordas somem. Como o card é uma miniatura
que leva ao catálogo externo, pode ser aceitável. Custo: zero.

### Opção B — `object-contain` nesses cards
Mostra a peça **inteira**, com uma faixa fina (letterbox) em cima e embaixo
preenchida pela cor de fundo do card.
- Prós: nada é cortado; simples.
- Contras: aparece a faixa; a arte fica visualmente menor dentro do card.
- Mudança: trocar `object-cover` por `object-contain` na linha 40 — mas isso
  afetaria **todas** as ofertas. Para aplicar só às retrato, seria preciso um
  flag por imagem (ex.: `fit: "contain"` em `MediaItem`).

### Opção C — Grade em proporção 4:5 (retrato)
Trocar `aspect-square` por `aspect-[4/5]` na linha 33.
- Prós: as três novas encaixam **perfeitas**, sem corte.
- Contras: as 8 antigas (quadradas) é que passariam a ganhar faixa/corte.
- Só vale se a intenção for padronizar as próximas ofertas em 4:5.

### Opção D — Padronizar o formato das artes (recomendada a médio prazo)
Pedir ao designer que exporte as ofertas **sempre no mesmo formato** (quadrado
1080×1080, ou sempre 4:5). Aí a grade fica consistente e nenhuma escolha de CSS
gera corte. É a solução de raiz.

## Recomendação

Curto prazo: **Opção A** (aceitar o corte) ou **Opção B** só para as retrato,
via flag `fit` no `MediaItem`.
Longo prazo: **Opção D** — combinar um formato único das artes com quem produz,
alinhado à [spec de banners](./banner-spec.md).

## Verificação após corrigir

1. Rodar o dev server (`pnpm run dev:web`, porta 3001).
2. Abrir a home e rolar até a seção "04 — Novidades".
3. Conferir as 3 primeiras ofertas: logo do topo e faixa de ícones da base
   devem estar visíveis (ou aceitavelmente enquadradas).
4. Conferir que as 8 antigas continuam sem faixa/corte.
