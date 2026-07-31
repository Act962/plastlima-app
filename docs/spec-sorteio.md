# Especificação — Campanha do sorteio (`/sorteio`)

Página de campanha onde o cliente que comprou na Plastlima se cadastra para
concorrer ao **Kit Churrasco**, mais a fatia do painel administrativo que torna
essa seção utilizável pela equipe.

> **Resumo rápido:** rota `/sorteio` fora do menu, formulário com
> react-hook-form + Zod, deduplicação de participantes pelo **WhatsApp
> normalizado**, cupom opcional salvo em base64 **comprimido no browser**, e um
> `apps/admin` mínimo com login, listagem e exportação CSV. O back-end é a
> **fatia vertical da fundação** descrita no [spec do CMS](./spec-dashboard-cms.md):
> `packages/core` + `packages/infra` com um único agregado, `Participant`.

---

## ⚠️ Antes de publicar — autorização legal

Sorteio **condicionado a compra** se enquadra como *distribuição gratuita de
prêmios a título de propaganda*, regida pela **Lei 5.768/71** e pelo Decreto
70.951/72, e exige **autorização prévia da Secretaria de Prêmios e Apostas (SPA)
do Ministério da Fazenda**. Operar sem o certificado de autorização é infração
administrativa.

Isso é responsabilidade do cliente e **não bloqueia o desenvolvimento** — mas
precisa estar confirmado antes de a página entrar no ar.

O cliente forneceu o regulamento oficial ("Ganhe um Kit Churrasco PlastLima"),
que substituiu o rascunho em [`raffle-rules.ts`](../apps/web/src/data/raffle-rules.ts).
Ele cobre período, prêmio, sorteio, entrega e desclassificação, mas **não cita
número de certificado de autorização** — o único item legal ainda em aberto.

---

## 1. Situação atual

O banner da campanha já está no ar na home desde o commit `0b30769`:

```ts
// apps/web/src/data/home.ts:3-7
export const HERO_BANNERS: MediaItem[] = [
	{
		src: "/banners/sorteio-dia-dos-pais.png",
		alt: "Sorteio mês dos pais: compre na Plastlima e concorra a um Kit Churrasco. Sorteio em 31 de agosto.",
	},
	// …
];
```

**E ele não leva a lugar nenhum.** O carrossel em
[`hero-carousel.tsx`](../apps/web/src/components/home/hero-carousel.tsx) renderiza
só a imagem, sem link. Uma busca por "sorteio" em todo o repositório retorna
exatamente uma ocorrência: o `alt` acima. Não existe rota, componente, dado,
schema ou serviço da campanha.

Além disso, o site não tem **nenhum** back-end: zero API routes, zero server
actions, zero banco. O
[`lead-service.ts`](../apps/web/src/lib/services/lead-service.ts) que atende os
formulários de contato e franquia é um stub que só faz `console.info`.

Ou seja: a campanha precisa da primeira persistência real do projeto.

---

## 2. Decisões

| Tema | Decisão | Motivo |
| --- | --- | --- |
| Back-end | Fatia vertical da fundação do CMS — um agregado só | Valida a arquitetura num recurso real e descartável, sem virar retrabalho |
| Rota | `/sorteio`, fora do menu, indexada | Campanha temporária não deve poluir a navegação, mas deve captar busca orgânica |
| Cupom | Base64 comprimido no browser | Ver [seção 5.3](#53-compressão-do-cupom) — sem compressão, quebra na prática |
| Identidade | WhatsApp normalizado para E.164 | É o único dado que a pessoa não troca entre um cadastro e outro |
| Chances | **1 pessoa = 1 chance** | O contador é métrica de engajamento; mais defensável se o resultado for questionado |
| Encerramento | Automático na data limite | Não depende de alguém lembrar de derrubar a página |
| Sortear ganhador | **Fora do escopo desta entrega** | — |

### 2.1 Por que react-hook-form aqui, e não o hook do site

Os dois formulários existentes usam
[`useFormSubmission`](../apps/web/src/hooks/use-form-submission.ts), que faz
`Object.fromEntries(new FormData(...))` e valida com Zod. Funciona bem para
campos de texto, e **continua intocado**.

Não serve para este formulário por três motivos concretos:

1. `Object.fromEntries` devolve um objeto `File` para `<input type="file">` — um
   schema Zod de string rejeita.
2. Checkbox via `FormData` chega como a string `"on"` ou simplesmente ausente,
   nunca como booleano.
3. `FormError` mostra **apenas a primeira** mensagem de erro do Zod. Num
   formulário de 5 campos, o usuário corrige um erro por vez sem saber quantos
   faltam.

react-hook-form resolve os três e é o que o briefing pede.

---

## 3. Arquitetura

```
packages/core/src/                     # TS puro — sem Prisma, sem Next, sem React
  domain/shared/                       entity.ts · unique-id.ts · result.ts
  domain/raffle/
    entities/participant.ts
    value-objects/phone-number.ts      ← carrega a invariante do requisito
    repositories/participant-repository.ts
    errors.ts
  application/ports/clock.ts
  application/use-cases/               register-participation.ts · list-participants.ts
  schemas/raffle.ts                    ← Zod compartilhado entre web e admin
  testing/                             in-memory-participant-repository.ts

packages/infra/                        # server-only
  prisma/schema.prisma
  src/prisma/                          client.ts · participant-repository.ts · mappers/
  src/clock/system-clock.ts

apps/web/                              # a página pública
apps/admin/                            # o painel (porta 3002)
```

**Regra de dependência, verificável em revisão:**

```
apps/web ───┐
            ├──→ packages/core ──→ (nada)
apps/admin ─┘           ↑
                        │ implementa as interfaces
                 packages/infra ──→ prisma
```

Se `packages/core` precisar importar Prisma, Next ou React, a abstração está
errada.

---

## 4. Modelo de dados

```prisma
model Participant {
  id                 String   @id @default(auto()) @map("_id") @db.ObjectId
  campaignId         String                    // "kit-churrasco-2026"
  name               String
  phone              String                    // E.164: "5586988970955"
  phoneDisplay       String                    // "(86) 98897-0955"
  storeId            String                    // id de STORE_LOCATIONS
  storeName          String                    // snapshot
  city               String                    // snapshot
  state              String                    // snapshot
  receiptImage       String?                   // data URL base64 comprimida
  participationCount Int      @default(1)
  acceptedTermsAt    DateTime
  createdAt          DateTime @default(now())
  lastParticipatedAt DateTime

  @@unique([campaignId, phone])
  @@index([campaignId, createdAt])
}
```

Quatro escolhas que merecem explicação:

- **`@@unique([campaignId, phone])`** — a deduplicação é garantida pelo banco, não
  só por uma checagem na aplicação. Sem isso, duas submissões simultâneas do mesmo
  número criam dois registros.
- **`campaignId`** — o modelo já nasce preparado para uma segunda campanha, sem
  precisar limpar a coleção nem criar outra tabela.
- **`storeName` / `city` / `state` são snapshot** — o registro de participação é
  histórico imutável. Se a loja for renomeada em
  [`locations.ts`](../apps/web/src/data/locations.ts), o cadastro antigo tem que
  continuar dizendo onde a pessoa comprou de fato.
- **`phone` e `phoneDisplay` separados** — o primeiro é chave de deduplicação, o
  segundo é o que a equipe lê no painel e cola no WhatsApp.

---

## 5. Página `/sorteio`

Composição no padrão do site — a página monta seções, as seções usam `Section` /
`Container` / `Eyebrow` de [`components/ui/`](../apps/web/src/components/ui/), e a
copy mora em `data/`.

```
app/sorteio/page.tsx               metadata indexada + JsonLd breadcrumb
app/sorteio/confirmacao/page.tsx   página de confirmação
app/sorteio/actions.ts             Server Action registerParticipation

components/raffle/
  raffle-hero.tsx                  Section tone="brand", no molde de franchise-hero.tsx
  how-it-works.tsx                 os 4 passos, em cards numerados
  raffle-form-section.tsx          card do formulário
  raffle-form.tsx                  "use client" — RHF + zodResolver
  raffle-closed.tsx                estado de inscrições encerradas
  constants.ts                     RAFFLE_FORM_ID

data/raffle.ts + types/raffle.ts   prêmio, datas, passos, copy
```

### 5.1 Como participar (os 4 passos)

Renderizados como cards numerados, direto do briefing:

| # | Título | Texto |
| --- | --- | --- |
| 1 | Faça uma compra | Qualquer valor já garante sua participação. |
| 2 | Acesse o site | Entre na página oficial da campanha. |
| 3 | Faça seu cadastro | Informe nome, WhatsApp e a loja onde comprou. |
| 4 | Participação confirmada | Após validar o cadastro, você já estará concorrendo ao Kit Churrasco. |

### 5.2 Campos do formulário

| Campo | Tipo | Regra |
| --- | --- | --- |
| Nome | texto | mínimo 3 caracteres |
| WhatsApp | tel | máscara BR ao digitar, validado pelo `PhoneNumber` do core |
| Loja que comprou | select | alimentado por `STORE_LOCATIONS`, rótulo `${name} — ${city}` |
| Cidade | *derivada* | **não é campo** — aparece como texto ao escolher a loja |
| Cupom | file | opcional, `accept="image/*"`, comprimido antes de enviar |
| Regulamento | checkbox | obrigatório, com link para o regulamento e a política de privacidade |

Sobre o rótulo da loja: existem **duas lojas chamadas "Loja Ceasa"** — uma em
Teresina, outra em Timon. O `<option>` precisa do `value={id}` e do rótulo com a
cidade, ou o usuário escolhe a errada.

A cidade ser derivada, e não digitada, é o que garante que o dado chegue limpo —
o briefing já apontava isso ("Dá pra saber pela loja").

### 5.3 Compressão do cupom

Uma foto de cupom tirada com celular tem **3 a 8 MB**. Em base64 ela cresce ~33%,
chegando a ~10 MB — e o body de uma Server Action do Next tem limite padrão de
**1 MB**. Sem compressão, o upload simplesmente falha no aparelho do cliente.

`lib/image/compress-image.ts` resolve no browser, antes de enviar:

1. Lê o `File` e carrega em um `Image`.
2. Desenha em um `<canvas>` redimensionado para no máximo **1200 px** no maior
   lado, preservando a proporção.
3. Exporta como **JPEG qualidade 0.7** em data URL.

Resultado típico: **~200 KB**. A interface mostra o preview e o tamanho final,
para o usuário ver que deu certo.

### 5.4 Primitivas de formulário a criar

Não existe `SelectField`, `FileField` nem `CheckboxField` em
[`components/forms/`](../apps/web/src/components/forms/). Os três serão criados
reaproveitando `fieldControlClassName` e `fieldLabelClassName` de
[`field-styles.ts`](../apps/web/src/components/forms/field-styles.ts), para o
formulário novo parecer nativo do site.

`TextField` e `TextareaField` ganham suporte a `ref` e rest props — mudança
**aditiva**, os formulários de contato e franquia continuam funcionando sem
alteração.

As primitivas de `packages/ui` (`input.tsx`, `checkbox.tsx`, …) **não** servem
aqui: são o visual padrão do shadcn (`rounded-none`, `h-8`, `text-xs`, tokens
`border-input`/`ring`) e nenhum componente de `apps/web` as usa hoje.

### 5.5 Tela de confirmação

Rota própria (`/sorteio/confirmacao`) em vez de troca de estado na mesma página —
uma URL distinta é o que permite marcar a conversão em analytics.

> **Parabéns!**
> Sua participação foi registrada com sucesso. Agora é só torcer!
>
> Comprou de novo? Volte aqui e preencha o formulário com o mesmo WhatsApp —
> cada compra vale mais uma chance.
>
> Enquanto isso, aproveite para conhecer nossa linha completa de produtos para
> churrasco, festas e eventos.
>
> **[Conheça nossos produtos]** → `EXTERNAL_LINKS.onlineCatalog`

**O participante repetido vê a contagem.** A cláusula 5 do regulamento oficial
promete mais chances a quem compra mais, então esconder o recadastro seria
desonesto — e pior, quem reenvia o mesmo número acharia que não valeu. A partir
da segunda vez o parágrafo de destaque troca:

> Esta é a sua **2ª participação**. Quanto mais você compra e se cadastra, mais
> chances tem de ganhar!

O fluxo continua idêntico (mesma rota, mesmo redirect), como pede o requisito
não funcional 2 — só o texto muda.

**Como a contagem chega até a tela.** O `redirect` não carrega payload. A Server
Action grava a contagem num cookie `httpOnly` de 5 minutos, com `path=/sorteio`,
e a página apenas lê — apagar cookie durante o render não é permitido, por isso
o prazo curto faz o descarte. Query string foi descartada: fica no histórico, é
compartilhável e qualquer um edita o número. Sem cookie válido — visita direta,
cookie expirado — a tela cai na versão de primeira participação.

---

## 6. Regra de deduplicação

O caso de uso `RegisterParticipation`:

```
execute({ campaignId, name, rawPhone, storeId, receiptImage, acceptedTerms })
  → Result<{ isNewParticipant, participationCount }, RegistrationError>
```

1. **Campanha aberta?** (`Clock` + data limite) → senão `CampaignClosedError`
2. **`PhoneNumber.create(rawPhone)`** → senão `InvalidPhoneError`
3. **Já existe esse telefone?** → incrementa `participationCount`, atualiza
   `lastParticipatedAt`, salva. Retorna `isNewParticipant: false`
4. **Não existe?** → cria o participante. Retorna `isNewParticipant: true`
5. **Violação do índice único no passo 4** (duas submissões simultâneas) → cai
   para o passo 3

O passo 5 é o que separa "passa no teste" de "funciona no dia da campanha".

### 6.1 `PhoneNumber` — o value object que sustenta tudo

Como é o telefone que identifica a pessoa, **a normalização é a regra de
negócio**, não um detalhe de formatação. Todas estas entradas precisam colapsar
no mesmo valor:

| Entrada do usuário | `.value` (E.164) | `.display` |
| --- | --- | --- |
| `86988970955` | `5586988970955` | `(86) 98897-0955` |
| `(86) 98897-0955` | `5586988970955` | `(86) 98897-0955` |
| `+55 86 98897-0955` | `5586988970955` | `(86) 98897-0955` |
| `86 9889-70955` | `5586988970955` | `(86) 98897-0955` |

Regras: remove tudo que não é dígito; aceita 10 ou 11 dígitos (DDD + número), ou
12/13 com o prefixo `55`; valida que o DDD existe; celular de 11 dígitos precisa
começar com `9` após o DDD. Retorna `Result<PhoneNumber, InvalidPhoneError>`.

Não existe nenhum helper de telefone no projeto hoje —
[`lib/whatsapp.ts`](../apps/web/src/lib/whatsapp.ts) só monta a URL do `wa.me` a
partir de um número já normalizado.

---

## 7. Integração com o site

| O quê | Onde | Mudança |
| --- | --- | --- |
| Banner clicável | [`types/content.ts`](../apps/web/src/types/content.ts), [`hero-carousel.tsx`](../apps/web/src/components/home/hero-carousel.tsx) | `MediaItem` ganha `href?: Route`; o slide vira `Link` quando houver |
| Sitemap | [`sitemap.ts`](../apps/web/src/app/sitemap.ts) | Hoje deriva só de `NAV_ITEMS` + `LEGAL_ITEMS`. `/sorteio` entra explicitamente, **sem** entrar no menu |
| OG image | [`metadata.ts`](../apps/web/src/lib/seo/metadata.ts) | `buildPageMetadata` ganha um parâmetro `image?` opcional |

A imagem de compartilhamento merece atenção: a campanha vai circular por WhatsApp,
e hoje qualquer link do site mostra o `og-image.jpg` genérico. Uma arte própria da
campanha no preview muda materialmente a taxa de clique.

---

## 8. Painel (`apps/admin`)

Next 16 na porta 3002, consumindo `packages/core` e `packages/infra`.

- **Better Auth** com e-mail e senha, usuário criado por seed. **Sem cadastro
  público.**
- **`/participantes`** — tabela com nome, WhatsApp, loja, cidade, data,
  nº de participações e **miniatura do cupom** (abre em diálogo no tamanho real).
  Busca por nome ou telefone, com paginação.
- **Exportar CSV** — a lista completa, sem a coluna de imagem, com **BOM UTF-8**
  para o Excel abrir a acentuação corretamente.

Primitivas shadcn que faltam em `packages/ui` e precisam ser adicionadas:
`table`, `dialog`, `badge`, `select`, `form`, `sidebar`.

```bash
npx shadcn@latest add table dialog badge select form sidebar -c packages/ui
```

**Fora do escopo desta entrega:** sortear o ganhador pelo painel, marcar cupom
como válido/inválido, e edição de participante.

---

## 9. Testes

Não existe suíte de testes no projeto hoje, nem task `test` no
[`turbo.json`](../turbo.json). Ambos entram aqui.

| Onde | O que |
| --- | --- |
| `packages/core` | `PhoneNumber`: tabela de entradas cruas → E.164 esperado, incluindo os inválidos. `RegisterParticipation`: cadastro novo, repetido (contador incrementa e **não** duplica), campanha fechada, telefone inválido, e corrida com violação de índice único |
| `packages/infra` | MongoDB real do `docker-compose.yml`, no banco `plastlima_test`: o índice único realmente barra a duplicata, e o mapper preserva o snapshot da loja |
| `apps/web` | Schema Zod de registro e a matemática de redimensionamento da compressão |

Sobre a compressão: a matemática de redimensionamento é testável, mas o `canvas`
em si não é confiável em jsdom. Essa parte fica na verificação manual do
[item 4](#10-como-verificar) — está registrado aqui para não parecer coberto
quando não está.

O banco de teste é o mesmo container do desenvolvimento, separado apenas pelo
nome (`plastlima_test`) — assim os testes limpam as coleções à vontade sem apagar
o que você cadastrou testando na mão. Rodar os testes de integração exige
`pnpm run db:up` antes; sem o container, o setup falha com uma mensagem dizendo
exatamente isso, em vez de pular os testes em silêncio.

---

## 10. Como verificar

1. **Isolamento do domínio** — `grep -r "prisma\|next/\|react" packages/core/src`
   não retorna nada.
2. **Testes** — `pnpm run test` na raiz, unitários e integração verdes.
3. **Tipos e lint** — `pnpm run check-types` e `pnpm run check` verdes, incluindo
   os pacotes novos.
4. **Fluxo completo** (`pnpm run dev:web`, porta 3001): abrir a home, clicar no
   banner do sorteio, preencher o formulário **com uma foto real de celular**,
   confirmar que o preview mostra o tamanho reduzido, enviar e cair na
   confirmação.
5. **Deduplicação** — cadastrar o mesmo WhatsApp em três formatos diferentes
   (`86988970955`, `(86) 98897-0955`, `+55 86 98897-0955`) e conferir no painel:
   **um** participante, com `participationCount = 3`.
6. **Encerramento** — adiantar a data limite e recarregar `/sorteio`: mostra
   "inscrições encerradas", e a Server Action rejeita um envio direto.
7. **Painel** — login, listar, abrir a miniatura do cupom, exportar o CSV e
   conferir que abre no Excel com acentuação correta.
8. **SEO** — `/sorteio` aparece em `/sitemap.xml`, **não** aparece no menu do
   header nem no rodapé, e o compartilhamento no WhatsApp mostra a arte da
   campanha.

---

## 11. Notas de implementação

O que a construção revelou e que não estava previsto no planejamento:

| # | Achado | Decisão tomada |
| --- | --- | --- |
| 1 | **O Prisma 7 ainda não suporta MongoDB** — a própria documentação manda usar a 6.19 até o suporte sair, e a 7 remove `url` do schema exigindo driver adapter, que não existe para Mongo | Catálogo fixado em `prisma@^6.19.3`. Subir para a 7 quebra o `prisma generate` |
| 2 | `pnpm-workspace.yaml` usava a chave **`allowBuilds`, que o pnpm 10 não reconhece** — os postinstall de `sharp` e do Prisma nunca rodavam | Corrigido para `onlyBuiltDependencies` |
| 2b | A primeira versão usava `mongodb-memory-server`, que **baixa um mongod de ~74 MB e grava os dados dentro do projeto** — que aqui fica no OneDrive, sincronizando arquivos de banco em uso | Trocado por `docker-compose.yml`. Dados no volume do Docker, fora da pasta sincronizada |
| 3 | Gerar o cliente Prisma dentro de `src/` fazia o rastreio do Turbopack **empacotar o projeto inteiro** na função de servidor | Cliente volta ao padrão em `node_modules`, coberto por `serverExternalPackages` |
| 4 | O Better Auth gera ids alfanuméricos próprios, **incompatíveis com `@db.ObjectId`** (erro P2023 ao criar a sessão) | `advanced.database.generateId: false` — quem gera o id é o Mongo |
| 5 | O Next 16 **depreciou a convenção `middleware.ts`** | Renomeado para `proxy.ts`, exportando `proxy` |
| 6 | A máscara de telefone **destruía número colado em formato internacional**: `+55 86 98897-0955` virava `(55) 86988-9709` | `PhoneNumber.mask` descarta o `55` acima de 11 dígitos; o limiar respeita o DDD 55 (Santa Maria/RS). Coberto por teste |
| 7 | `entity.ts` e `unique-id.ts`, previstos no planejamento, seriam classes vazias — o Mongo gera a identidade | Não criados. Em `domain/shared/` ficou só o `Result`, que ganha o seu espaço |
| 8 | O `.next/types` de um build antigo convivia com o `.next/dev/types` do Turbopack, **quebrando `check-types` com rotas que existem** (inclusive `/politica-de-privacidade`, anterior a esta entrega) | Resolvido por um `next build`, que regenera o arquivo antigo |

### Compressão medida

Teste com imagem sintética de **4000 × 3000 px e 11,6 MB** (ruído, pior caso para
JPEG): resultado **1200 × 900 px e 302 KB**, ou 402 mil caracteres em base64 —
dentro do limite de 800 mil do schema e do 1 MB da Server Action. Fotos reais
comprimem melhor que esse pior caso.

---

## 12. Pendências antes de ir ao ar

> **Estado atual: a campanha está publicável apenas para visualização interna.**
> Os itens marcados como bloqueador impedem a divulgação ao público.

### Bloqueadores

| # | Pendência | Por quê |
| --- | --- | --- |
| 1 | **Autorização da SPA/Ministério da Fazenda** | Sorteio condicionado a compra é regido pela Lei 5.768/71. O regulamento oficial do cliente **não cita Certificado de Autorização** — ou ele existe e falta informar, ou a campanha está irregular. Único ponto do texto legal ainda em aberto |
| 2 | **Não existe proteção anti-spam** | A [seção 2.6](#26-stack-complementar) previu honeypot, tempo mínimo de preenchimento e rate limit por IP — **nenhum foi implementado**. Hoje `/sorteio` grava direto no MongoDB sem limite: um script simples enche o banco e contamina o sorteio |
| 3 | **Política de retenção LGPD** | Nome, WhatsApp e foto de cupom são dado pessoal. Falta definir prazo de descarte e quem executa depois do sorteio. O regulamento oficial ainda amplia o uso: autoriza "comunicações institucionais e promocionais", o que exige base legal própria |
| 4 | **A apuração precisa usar `participationCount`** | Cláusula 5 do regulamento oficial promete mais chances a quem compra mais. O site já convida ao recadastro e a tela de confirmação mostra a contagem ([seção 5.5](#55-tela-de-confirmação)); falta o cliente confirmar que o sorteio vai **ponderar pelo campo**, e não sortear um registro por participante |

### Infraestrutura de produção

| # | Pendência | Detalhe |
| --- | --- | --- |
| 5 | Cluster no MongoDB Atlas | Já é replica set, atende o Prisma. Liberar o IP de saída da Vercel e rodar `pnpm run db:push` uma vez |
| 6 | **Dois** projetos na Vercel, não um | Mesmo repositório, *Root Directory* diferente: `apps/web` → `www.plastlima.com.br`, `apps/admin` → `admin.plastlima.com.br` |
| 7 | Build command com `prisma generate` | A Vercel cacheia `node_modules` e pode pular o `postinstall`. Forçar `pnpm --filter @plastlima-app/infra db:generate && next build` |
| 8 | Variáveis de ambiente | Ver os `.env.example` de cada app. `BETTER_AUTH_SECRET` novo (`openssl rand -base64 32`), nunca o de desenvolvimento |
| 9 | Usuário real do painel | `pnpm run seed:admin -- --email=… --senha=…` apontando para o Atlas |

### Qualidade

| # | Pendência | Detalhe |
| --- | --- | --- |
| 10 | Arte de OpenGraph em JPEG | Hoje é o banner de **2,3 MB em PNG**. É o preview no WhatsApp; 1200 × 630 em JPEG cai para ~150 KB |
| 11 | Nenhum CI configurado | Não existe `.github/`. Um workflow com `biome ci` + `turbo run check-types test build` protege a campanha durante o ar |
| 12 | `pnpm run check` reformata ~40 arquivos alheios | O repositório nunca passou pelo Biome por inteiro. Merece um commit de faxina isolado, antes de ligar o CI |
| 13 | "Semana dos Pais" × "Mês dos Pais" | O regulamento oficial fala em Semana dos Pais; o site inteiro (hero, banner, SEO) diz Mês dos Pais. Alinhar a nomenclatura |

### Resolvido pelo regulamento oficial do cliente

O documento `REGULAMENTO.pdf` (campanha "Ganhe um Kit Churrasco PlastLima")
substituiu o rascunho e fechou: início em **01/08/2026**, encerramento em
**30/08/2026** — confirmando o valor já assumido em [`raffle.ts`](../apps/web/src/data/raffle.ts) —,
sorteio em 31/08 em horário e formato definidos pela Plastlima, prazo de
**7 dias corridos** para localizar o ganhador sob pena de novo sorteio, e a
cláusula de substituição de itens do kit por outros de igual ou maior valor.
Continuam sem definição, agora por escolha do cliente: valor e composição
detalhada do prêmio, critério de apuração, prazo de retenção dos dados e se
sócios e funcionários podem participar.

### Corrigido durante a revisão de deploy

O `binaryTargets` do Prisma estava em `debian-openssl-3.0.x`. O runtime serverless
da Vercel é **Amazon Linux (base RHEL)** — com o alvo errado o build passa e o
deploy quebra ao abrir a primeira conexão. Corrigido para `rhel-openssl-3.0.x`.
Se a hospedagem virar Docker sobre Debian, o valor precisa voltar.

---

## 13. Decisões em aberto

| # | Questão |
| --- | --- |
| 1 | Número do certificado de autorização da SPA/MF (o regulamento oficial não o menciona) |
| 2 | Arte dedicada de OpenGraph para a campanha (1200 × 630) — hoje só existe a genérica |
| 3 | Como a apuração usa `participationCount` — o regulamento promete mais chances a quem compra mais |
| 4 | O que fazer com os dados dos participantes após o sorteio — prazo de retenção pela LGPD |
| 5 | Notificar o ganhador por WhatsApp a partir do painel, numa fase seguinte |
| 6 | Valor e composição detalhada do Kit Churrasco, e se sócios e funcionários podem participar |
