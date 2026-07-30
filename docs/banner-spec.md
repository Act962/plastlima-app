# Especificação — Banners do carrossel (home)

Guia para produzir as artes do carrossel da página inicial do site Plastlima.

> **Resumo rápido:** exporte **2400 × 1250 px** (proporção 1,92:1), JPEG ou WebP
> com menos de 400KB, e mantenha todo conteúdo importante dentro dos
> **1410 × 750 px centrais**.

---

## 1. Onde os banners aparecem

No topo da página inicial, ocupando **toda a largura da tela** (full-bleed), em um
carrossel que troca de imagem a cada 5 segundos.

A altura do banner não é fixa — ela segue esta regra CSS:

```css
height: clamp(320px, 52vw, 600px);
```

Em português: a altura é 52% da largura da tela, com mínimo de 320px e máximo de
600px. A imagem é encaixada com `object-fit: cover`, ou seja, **ela sempre
preenche a área inteira e o excedente é cortado** — nunca aparecem faixas vazias.

## 2. Por que a proporção da caixa muda

Como a largura acompanha a tela mas a altura trava em 320px e 600px, a proporção
da área do banner varia bastante:

| Largura da tela | Altura do banner | Proporção da caixa |
| --- | --- | --- |
| 360px (celular pequeno) | 320px | **1,13:1** |
| 375px | 320px | 1,17:1 |
| 414px | 320px | 1,29:1 |
| 615px | 320px | 1,92:1 |
| 768px (tablet) | 399px | **1,92:1** |
| 1024px | 532px | **1,92:1** |
| 1154px | 600px | **1,92:1** |
| 1280px (notebook) | 600px | 2,13:1 |
| 1440px | 600px | 2,40:1 |
| 1920px (monitor cheio) | 600px | 3,20:1 |
| 2560px (ultrawide) | 600px | 4,27:1 |

Repare na faixa **615px – 1154px**: ali a proporção fica constante em **1,92:1**.
Esse é o ponto de equilíbrio da regra, e é dele que sai a recomendação abaixo.

## 3. Tamanho recomendado

### 2400 × 1250 px — proporção 1,92:1

Uma arte nessa proporção encaixa **sem corte algum** entre 615px e 1154px de tela,
e a partir daí o corte cresce de forma suave e simétrica para os dois lados.
É a proporção que melhor equilibra a perda entre celular e desktop.

Quanto da arte fica visível em cada tela:

| Largura da tela | O que aparece da imagem |
| --- | --- |
| 360px | 59% da largura (altura inteira) |
| 615 – 1154px | **100% — sem corte** |
| 1280px | 90% da altura (largura inteira) |
| 1920px | 60% da altura (largura inteira) |
| 2560px | 45% da altura (largura inteira) |

### Área segura: 1410 × 750 px centrais

Título, preço, produto, logo e qualquer texto **devem caber dentro dessa região**.
É a parte que sobrevive em qualquer tela de 360px até 1920px.

```
┌──────────────────── 2400 px ────────────────────┐
│                                                 │
│        ┌───────── 1410 px ─────────┐            │  ▲
│        │                           │            │  │
│        │      ÁREA SEGURA          │  750 px    │  1250 px
│        │   (todo o conteúdo)       │            │  │
│        │                           │            │  │
│        └───────────────────────────┘            │  ▼
│                                                 │
└─────────────────────────────────────────────────┘
```

Se o público usa muito monitor ultrawide (2560px), aperte a altura útil para os
**560px centrais** em vez de 750px.

### Regras práticas

- **Nada encostado nas bordas.** As bordas são exatamente o que some primeiro.
- **Logo fora dos cantos.** Prefira o logo dentro da área segura.
- **Texto grande.** No celular a arte aparece reduzida; texto fino some.
- **Não repita informação crítica nas laterais** — elas não aparecem no celular.

## 4. Formato e peso

| Item | Recomendação |
| --- | --- |
| Formato | **JPEG** (qualidade 80) ou **WebP** |
| Peso máximo | **400KB** por banner |
| Espaço de cor | sRGB |
| Evitar | PNG para fotos |

O Next.js já converte e redimensiona automaticamente na entrega, então não é
preciso gerar versões menores — mande só o arquivo grande.

> **Por que evitar PNG:** no lote atual, `banner-01.png` pesa 483KB sendo a menor
> imagem de todas (575×574), enquanto os JPEGs de 1080×1080 ficam em ~260KB.
> PNG só compensa quando a arte é chapada, com texto vetorial e poucas cores.

## 5. O que está em uso hoje (e por que não é ideal)

As seis artes atuais são **posts de Instagram 1080×1080 (proporção 1:1)**.

Como 1:1 é sempre mais "alto" que qualquer proporção da tabela do item 2, o
`object-fit: cover` corta as **laterais** em todas as telas — no notebook padrão
(1280px) perde-se cerca de 47% da arte. É por isso que aparecem produtos e textos
cortados pela metade.

| Arquivo atual | Dimensão |
| --- | --- |
| `banner-01.png` | 575 × 574 |
| `banner-02.jpeg` … `banner-06.jpeg` | 1080 × 1080 |

## 6. Como entregar

1. Nomeie os arquivos em sequência: `banner-01`, `banner-02`, … (extensão livre:
   `.jpg`, `.jpeg`, `.webp` ou `.png`).
2. Coloque em `apps/web/public/banners/`.
3. Registre em [`apps/web/src/data/home.ts`](../apps/web/src/data/home.ts), na
   lista `HERO_BANNERS` — **a ordem do array é a ordem do carrossel**:

```ts
export const HERO_BANNERS: MediaItem[] = [
  { src: "/banners/banner-01.jpg", alt: "Descrição do que a arte mostra" },
  // ...
];
```

O campo `alt` é obrigatório: é o texto lido por leitores de tela e exibido se a
imagem falhar. Descreva a oferta ("Promoção de copos descartáveis 200ml"), não
escreva apenas "banner".

Para adicionar ou remover um banner, basta editar essa lista — o carrossel, as
bolinhas de navegação e as setas se ajustam sozinhos à quantidade.

## 7. Alternativa: arte dedicada para celular

O corte no celular (1,13:1) e no monitor grande (3,20:1) puxam para lados
opostos, então **qualquer imagem única é um meio-termo**.

É possível servir duas versões da mesma campanha — uma larga para desktop e uma
mais quadrada para celular — e o site troca automaticamente conforme a tela.
Cada dispositivo recebe uma arte pensada para ele, sem corte nenhum.

Nesse cenário, os tamanhos seriam:

| Versão | Dimensão | Proporção |
| --- | --- | --- |
| Desktop | 2400 × 1250 px | 1,92:1 |
| Celular | 1080 × 1350 px | 4:5 |

Requer um ajuste no componente
[`hero-carousel.tsx`](../apps/web/src/components/home/hero-carousel.tsx) para
aceitar o par de imagens. O formato full-bleed atual não muda — só melhora o
enquadramento.
