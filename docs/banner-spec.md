# Especificação — Banners do carrossel (home)

Guia para produzir as artes do carrossel da página inicial do site Plastlima.

> **Resumo rápido:** a faixa se ajusta à proporção da arte, então **nenhuma
> imagem é cortada nem ganha moldura**. O ideal é entregar duas versões da mesma
> campanha: **2400 × 1250 px** para desktop e **1080 × 1350 px** para celular.

---

## 1. Como a faixa se comporta

O carrossel fica no topo da home, ocupando **toda a largura da tela**
(full-bleed), trocando de imagem a cada 5 segundos.

**A altura sai da própria arte.** Cada banner declara sua proporção no código, e
a faixa assume exatamente essa proporção — a imagem preenche a área inteira, sem
corte e sem sobra. Uma arte de 1800 × 600 (3:1) numa tela de 375px vira uma faixa
de 375 × 125; a mesma arte num notebook de 1280px vira 1280 × 427.

Três travas de segurança:

- **No celular, todos os slides têm a mesma altura.** Ela vem da arte de celular
  mais alta declarada no carrossel. Assim a página não pula a cada troca de
  banner, mesmo quando um deles ainda não tem versão de celular.
- **Teto de 85% da altura da tela.** Protege contra arte em pé, que senão
  empurraria o resto da home para fora da tela.
- **Fundo desfocado.** Se sobrar espaço — por causa das duas regras acima ou
  porque a proporção declarada não bate com o arquivo — a sobra é preenchida por
  uma cópia borrada da própria imagem, nunca por uma faixa vazia.

## 2. Tamanhos recomendados

| Versão | Dimensão | Proporção | Quando aparece |
| --- | --- | --- | --- |
| Desktop | **2400 × 1250 px** | 1,92:1 | telas de 640px para cima |
| Celular | **1080 × 1350 px** | 4:5 | telas abaixo de 640px |

A versão de celular é opcional: **sem ela, o celular recebe a arte de desktop**,
inteira e sem corte, centralizada na altura que os outros banners ocupam — o
espaço que sobra fica desfocado. Numa faixa de 375 × 469, uma arte 3:1 aparece
como uma tira de 375 × 125 com moldura acima e abaixo, e o texto dela fica
pequeno demais para ler.

Ou seja: dá para publicar sem a arte de celular, mas o resultado sempre denuncia
que ela está faltando. Sempre que a campanha for importante, peça as duas.

### Legibilidade é o limite real

Como nada é cortado, **não existe região de recorte a evitar**. O limite agora é
o tamanho da letra: a arte de 2400px é reduzida para caber em 375px de tela, ou
seja, **6,4× menor**.

- Texto abaixo de **60px** na arte de 2400px vira letra ilegível no celular.
- Preço e chamada principal: mire em **120px ou mais**.
- Evite fonte fina e texto sobre foto de baixo contraste.

### Regras práticas

- **Deixe uma margem interna.** A arte vai até a borda da tela; conteúdo colado
  na margem fica visualmente apertado.
- **Uma mensagem por banner.** Em 375px de largura não cabe mais que isso.
- **Mantenha a mesma proporção entre os banners do carrossel.** No celular a
  altura é comum a todos, mas no desktop ela segue cada arte: misturar 1,92:1
  com 3:1 faz a faixa mudar de altura a cada troca.

## 3. Formato e peso

| Item | Recomendação |
| --- | --- |
| Formato | **JPEG** (qualidade 80) ou **WebP** |
| Peso máximo | **400KB** por banner |
| Espaço de cor | sRGB |
| Evitar | PNG para fotos |

O Next.js já converte e redimensiona automaticamente na entrega, então não é
preciso gerar versões menores — mande só o arquivo grande.

> **Por que evitar PNG:** `sorteio-dia-dos-pais.png` pesa 2,3MB; os JPEGs
> equivalentes ficam em ~260KB. PNG só compensa quando a arte é chapada, com
> texto vetorial e poucas cores.

## 4. O que está em uso hoje

| Arquivo | Dimensão | Proporção | Uso |
| --- | --- | --- | --- |
| `sorteio-kit-churrasco.jpeg` | 1800 × 600 | 3:1 | banner 1, desktop |
| `sorteio-popup.jpeg` | 1080 × 1350 | 4:5 | banner 1, celular |
| `sorteio-como-participar.jpeg` | 1800 × 600 | 3:1 | banner 2, desktop |
| `sorteio-como-participar-mobile.jpeg` | 1122 × 1402 | 4:5 | banner 2, celular |

Os dois banners têm as duas versões, então a faixa fica sem moldura em qualquer
tela: 375 × 469 no celular e 1280 × 427 no notebook.

As artes de desktop são 3:1, mais largas que os 1,92:1 recomendados — funciona,
mas uma arte 1,92:1 ocuparia mais altura da tela no desktop.

## 5. Como entregar

1. Nomeie o arquivo de forma descritiva (`sorteio-kit-churrasco.jpeg`,
   `promocao-copos.webp`). Extensão livre: `.jpg`, `.jpeg`, `.webp` ou `.png`.
2. Coloque em `apps/web/public/banners/`.
3. Registre em [`apps/web/src/data/home.ts`](../apps/web/src/data/home.ts), na
   lista `HERO_BANNERS` — **a ordem do array é a ordem do carrossel**:

```ts
export const HERO_BANNERS: HeroBanner[] = [
  {
    src: "/banners/banner-01.jpg",
    alt: "Descrição do que a arte mostra",
    href: "/sorteio", // opcional: destino ao clicar
    aspect: 2400 / 1250, // dimensão real do arquivo
    mobile: { src: "/banners/banner-01-celular.jpg", aspect: 1080 / 1350 },
  },
  // ...
];
```

- **`aspect`** é o que dá a altura da faixa. Escreva como a divisão das
  dimensões reais (`2400 / 1250`) para o número ficar conferível. Se ficar
  errado, a arte aparece com moldura desfocada em vez de preencher a faixa.
- **`mobile`** é opcional; sem ele o celular usa a arte principal.
- **`alt`** é obrigatório: é o texto lido por leitores de tela e exibido se a
  imagem falhar. Descreva a oferta ("Promoção de copos descartáveis 200ml"), não
  escreva apenas "banner".

Para adicionar ou remover um banner, basta editar essa lista — o carrossel, as
bolinhas de navegação e as setas se ajustam sozinhos à quantidade.
