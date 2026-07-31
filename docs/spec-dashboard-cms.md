# Especificação — Dashboard de conteúdo (CMS) da Plastlima

Plano de arquitetura para o painel que permitirá à equipe da Plastlima editar
textos, fotos, banners, unidades e documentos legais do site sem passar por
código e deploy.

> **Resumo rápido:** app separado `apps/admin` no monorepo, MongoDB com **Prisma**,
> **Better Auth**, mídia no **Cloudflare R2**, publicação por **ISR sob demanda**
> (`revalidateTag`). Domínio isolado em `packages/core` (hexagonal + DDD tático),
> infraestrutura em `packages/infra`, testes com **Vitest**. A **estrutura do site
> não muda** — rotas, seções e layout continuam fixos em código; o CMS edita
> apenas conteúdo.

---

## 1. Situação atual

Levantamento real do repositório, não estimativa:

| Fato | Medida |
| --- | --- |
| Arquivos de conteúdo em [`apps/web/src/data/`](../apps/web/src/data/) | 8 arquivos, ~26 KB |
| Constantes exportadas | 21 |
| Importações estáticas desses dados | **40 ocorrências em 29 arquivos** |
| Rotas | 6 páginas + `sitemap.ts` + `robots.ts` + `not-found.tsx` |
| API routes / server actions | **nenhuma** |
| Banco, ORM, auth | **nenhum** |
| Testes | **nenhum** (sem Vitest, Jest, Playwright ou task `test` no `turbo.json`) |
| CI | **nenhum** (não existe `.github/`) |

Todas as páginas são **estáticas** — não há um único `fetch`, `revalidate`,
`generateStaticParams` ou `unstable_cache` no código. Isso é uma qualidade do
site atual (rápido, barato, sem ponto de falha) e o CMS **precisa preservá-la**.

Duas lacunas encontradas de passagem, que este spec resolve:

1. **Os leads estão sendo perdidos.**
   [`apps/web/src/lib/services/lead-service.ts`](../apps/web/src/lib/services/lead-service.ts)
   é um stub — `submitFranchiseLead` e `submitContactMessage` só fazem
   `console.info`. Os formulários de contato e de franquia não gravam nem enviam
   nada. O próprio arquivo documenta que é um ponto de inversão a ser
   substituído.

2. **A política de privacidade é montada com template literal.**
   [`apps/web/src/data/privacy-policy.ts`](../apps/web/src/data/privacy-policy.ts)
   interpola `${SITE.name}`, `${SITE.address}`, `${SITE.email}` e
   `${CONTACT.support.display}` dentro do texto (linhas 12, 22, 73, 105, 135).
   Ao virar conteúdo editável, isso precisa virar um sistema de tokens — ver
   [seção 7.3](#73-tokens-na-política-de-privacidade).

---

## 2. Decisões de arquitetura

### 2.1 Onde o dashboard vive — `apps/admin` separado

Um novo app Next.js em `apps/admin`, publicado em domínio próprio
(ex.: `admin.plastlima.com.br`), porta 3002 em desenvolvimento.

**Por quê, e não uma rota `(admin)` dentro de `apps/web`:** o site público é
estático e sem JavaScript de autenticação. Colocar o painel dentro dele
adicionaria middleware de sessão, aumentaria o bundle e tiraria as páginas do
modo puramente estático — exatamente o oposto do que se quer preservar. Separar
também permite escalar, versionar e derrubar o admin sem tocar no site.

**Alternativa descartada:** Payload CMS 3 (roda dentro do Next com MongoDB e
entrega o admin pronto). Entrega mais rápido, mas o objetivo declarado inclui
DDD, SOLID e testes próprios — com Payload praticamente não há domínio para
modelar nem para testar. Vale reconsiderar se o prazo apertar.

### 2.2 DDD sim, mas tático e seletivo

Recomendação: **arquitetura hexagonal (ports & adapters) com padrões táticos de
DDD aplicados onde existe invariante real**.

**O que entra:**

- **Casos de uso** — uma classe, um método `execute`, dependências recebidas no
  construtor. É o que dá SRP e DIP de graça.
- **Portas e adaptadores** — o domínio declara interfaces (`ContentRepository`,
  `StorageProvider`, `CacheInvalidator`, `AuditLogger`, `Clock`); a infra as
  implementa. É isso, e só isso, que torna o teste unitário possível sem mockar
  framework.
- **Value objects onde há regra** — `ContentKey`, `PublishState`, `Slug`,
  `RevisionNumber`.
- **`Result<T, E>` em vez de exceções** nos casos de uso — força o chamador a
  tratar a falha e deixa a asserção do teste trivial.
- **Identidade delegada** ao Better Auth, atrás de uma porta `AuthenticatedActor`
  (camada anticorrupção). `User` não é modelado no domínio.

**O que fica de fora, deliberadamente:** event bus / domain events publicados,
CQRS, um agregado por coleção, e value object para cada campo primitivo
(`name: string` continua `string`).

**Por quê:** este é um CMS de sete documentos com dois ou três editores. A
cerimônia completa de DDD tático custaria mais linhas de infraestrutura de
domínio do que de domínio — e é a causa mais comum de projetos assim travarem
antes da primeira tela funcionar. As costuras ficam abertas: se um dia for
preciso publicar eventos, o caso de uso `PublishDocument` já é o único lugar que
precisa mudar.

### 2.3 Por que Prisma (e o que vigiar)

| Opção | Veredito |
| --- | --- |
| **Prisma** (`mongodb`) | **Escolhido.** Tipagem gerada ponta a ponta, `composite types` encaixam no conteúdo aninhado, e some bem atrás de um repositório. |
| Mongoose | Descartado. `Document`/`Schema` vazam para o domínio; sem mappers muito disciplinados vira Active Record disfarçado, que é o oposto da inversão de dependência pretendida. |
| Driver oficial + Zod | Descartado. DDD purista, mas todo o mapeamento, índice e query viram código manual sem tipagem gerada. |

Dois pontos de atenção a respeitar:

- **Transação interativa (`$transaction`) exige replica set.** O Atlas já é um;
  nos testes, o `mongodb-memory-server` precisa ser iniciado com `replSet`.
- **Não há migrations reais no provider Mongo.** O fluxo é `prisma db push` +
  índices declarados no schema. Versionamento de shape de conteúdo é feito pelos
  schemas Zod, não pelo Prisma — ver [seção 5.2](#52-versionamento-de-shape).

### 2.4 Modelagem híbrida do conteúdo — a decisão estruturante

**Não** criar uma tabela por seção do site. O modelo é:

- Uma coleção **`ContentDocument`** com uma `key` (`home`, `about`, `franchise`,
  `locations`, `privacy-policy`, `site`, `navigation`) e dois campos JSON:
  `draft` e `published`.
- O **formato** de cada `key` é definido por um **schema Zod** em
  `packages/core/src/schemas/`. Esses schemas passam a ser a fonte da verdade,
  substituindo [`apps/web/src/types/`](../apps/web/src/types/).
- Viram coleção de verdade apenas o que tem consulta ou ciclo de vida próprio:
  `ContentRevision`, `MediaAsset`, `Lead`, `AuditLogEntry`, mais os modelos do
  Better Auth.

**Por quê:** essas sete estruturas são sempre lidas inteiras e nunca consultadas
por campo interno. Um documento JSON validado na fronteira dá o mesmo rigor de
tipos com uma fração do código, torna o snapshot de revisão trivial (é só copiar
o JSON) e evita alterar o schema do banco a cada mudança de copy.

**Consequência que merece destaque: as unidades também são um `ContentDocument`**
(`key: "locations"`, um array com as 14 lojas), não uma coleção. Isso dá
rascunho, publicação, histórico e rollback uniformes para *todo* conteúdo, com um
único mecanismo e um único conjunto de casos de uso.

> **Trade-off registrado:** essa escolha vale enquanto a lista for pequena. Com
> ~200 unidades o documento passa de ~500 KB e a edição concorrente fica
> desconfortável (limite do Mongo é 16 MB, então não é o gargalo — a UX é).
> Nesse ponto, promover `StoreLocation` a coleção própria com o mesmo par
> draft/published por item. Reavaliar quando passar de 100 lojas.

### 2.5 `typedRoutes` e o requisito "a estrutura não muda"

[`apps/web/next.config.ts`](../apps/web/next.config.ts) tem `typedRoutes: true`,
que valida todo `href` contra rotas reais em tempo de build — e
[`apps/web/src/types/navigation.ts`](../apps/web/src/types/navigation.ts) tipa
`NavItem.href` como `Route` do Next. Um valor vindo do banco não passa nessa
checagem.

Como a estrutura do site não muda, a solução é direta: **o CMS edita apenas o
`label` do menu.** Os `href` continuam constantes tipadas em
[`apps/web/src/data/navigation.ts`](../apps/web/src/data/navigation.ts), e o
documento `navigation` guarda um mapa `href → label`. Isso elimina o conflito em
vez de contorná-lo, e impede que um editor quebre a navegação por engano.

O mesmo princípio vale para o resto: o CMS **não** cria páginas, não cria seções,
não reordena blocos estruturais. Ele troca o conteúdo dentro de posições fixas.

### 2.6 Stack complementar

| Necessidade | Escolha | Por quê |
| --- | --- | --- |
| Testes | **Vitest** + `@vitest/coverage-v8` | Config base compartilhada em `packages/config` |
| Integração com Mongo | **`mongodb-memory-server`** com `replSet` | Roda no Windows sem Docker Desktop; Testcontainers exigiria Docker rodando |
| Teste de UI | Testing Library + jsdom | Formulários e componentes do admin |
| Formulários | `react-hook-form` + `@hookform/resolvers/zod` | Reusa **os mesmos** schemas Zod do core |
| Mutações | **Server Actions** chamando os casos de uso | Evita duplicar uma camada REST; a action fica fina e o teste vai no caso de uso |
| Reordenação | `dnd-kit` | Banners, ofertas, timeline, blocos do "Sobre" |
| Rich text | **Tiptap restrito a parágrafo + negrito** | Ver [seção 6.4](#64-editor-de-texto-com-ênfase) |
| Datas | `date-fns` com locale `pt-BR` | Formatação de `updatedAt` e histórico |
| Anti-spam | Honeypot + tempo mínimo de preenchimento + rate limit por IP | Sem CAPTCHA |
| CI | GitHub Actions | `biome ci` + `turbo run check-types test build` |

Toda dependência compartilhada entre pacotes deve ser declarada com `catalog:` no
[`pnpm-workspace.yaml`](../pnpm-workspace.yaml), seguindo a convenção já em uso.

---

## 3. Estrutura do monorepo

```
apps/
  web/                       # existente — permanece estático, agora com ISR
  admin/                     # novo Next 16 · porta 3002 · admin.plastlima.com.br

packages/
  core/                      # @plastlima-app/core — TS puro, zero dependência de infra
    src/domain/shared/       #   Entity, ValueObject, UniqueId, Result
    src/domain/content/      #   ContentDocument (raiz), ContentRevision, VOs, interfaces
    src/domain/media/        #   MediaAsset + MediaRepository (interface)
    src/domain/leads/        #   Lead + LeadRepository (interface)
    src/application/ports/   #   StorageProvider, CacheInvalidator, AuditLogger, Clock
    src/application/use-cases/
    src/schemas/             #   Zod por documento — fonte da verdade do formato
    src/testing/             #   repositórios in-memory usados como test doubles

  infra/                     # @plastlima-app/infra — server-only
    prisma/schema.prisma
    src/prisma/              #   client, repositórios Prisma, mappers
    src/storage/             #   R2StorageProvider
    src/cache/               #   HttpRevalidationClient (POST para apps/web)

  ui/     env/     config/   # existentes
```

`core` e `infra` seguem o modelo já estabelecido por
[`packages/env`](../packages/env/): sem build step, `exports` apontando direto
para `./src/*.ts`, `tsconfig` estendendo `@plastlima-app/config/tsconfig.base.json`
e um script `check-types` para o `turbo run check-types` cobrir.

**Regra de dependência (verificável em code review):**

```
apps/admin ─┐
            ├─→ packages/core ──→ (nada)
apps/web  ──┘        ↑
                     │ implementa as interfaces
              packages/infra ──→ prisma, @aws-sdk/client-s3
```

`packages/core` **não pode** importar Prisma, Next, React ou qualquer SDK. Se
precisar, a abstração errada foi feita.

---

## 4. Modelo de dados

### 4.1 Schema Prisma (esboço)

```prisma
model ContentDocument {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  key         String    @unique          // "home" | "about" | "locations" | ...
  schemaVersion Int     @default(1)
  draft       Json
  published   Json?
  publishedAt DateTime?
  publishedBy String?
  updatedAt   DateTime  @updatedAt
  updatedBy   String
  revisions   ContentRevision[]
}

model ContentRevision {                  // snapshot imutável — histórico e rollback
  id         String          @id @default(auto()) @map("_id") @db.ObjectId
  documentId String          @db.ObjectId
  document   ContentDocument @relation(fields: [documentId], references: [id])
  version    Int
  data       Json
  note       String?
  createdBy  String
  createdAt  DateTime        @default(now())

  @@unique([documentId, version])
  @@index([documentId, createdAt])
}

model MediaAsset {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  storageKey String  @unique             // chave no bucket R2
  url       String
  alt       String
  width     Int
  height    Int
  bytes     Int
  mimeType  String
  checksum  String   @unique             // SHA-256 — deduplicação de upload
  createdBy String
  createdAt DateTime @default(now())
}

model Lead {
  id        String     @id @default(auto()) @map("_id") @db.ObjectId
  kind      LeadKind                     // FRANCHISE | CONTACT
  status    LeadStatus @default(NEW)     // NEW | IN_PROGRESS | DONE | SPAM
  name      String
  email     String
  phone     String?
  state     String?
  city      String?
  message   String?
  sourcePath String?
  createdAt DateTime   @default(now())

  @@index([kind, status, createdAt])
}

model AuditLogEntry {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  actorId    String
  actorEmail String
  action     String                       // "content.publish", "media.delete", ...
  entityType String
  entityId   String
  diff       Json?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId, createdAt])
  @@index([createdAt])
}

// + User, Session, Account, Verification (Better Auth), com campo `role`
```

### 4.2 Invariantes de domínio

Cada uma vira um teste unitário nomeado igual à regra:

| # | Invariante |
| --- | --- |
| 1 | Publicar exige que o `draft` passe no schema Zod da respectiva `key` |
| 2 | Publicar **sempre** cria uma `ContentRevision` com `version` incrementada |
| 3 | Rollback **cria uma nova revisão** com o conteúdo antigo — nunca apaga histórico |
| 4 | `version` é estritamente sequencial por documento (`@@unique([documentId, version])`) |
| 5 | Um `MediaAsset` com `checksum` já existente retorna o registro existente em vez de duplicar |
| 6 | Uma imagem só entra em conteúdo publicado se o `MediaAsset` correspondente existe |
| 7 | `alt` é obrigatório e não vazio em todo `MediaAsset` |
| 8 | Transições de `Lead.status` seguem `NEW → IN_PROGRESS → DONE`; `SPAM` é alcançável de qualquer estado |
| 9 | Publicar sem alteração em relação ao `published` atual é rejeitado (evita revisão vazia) |

---

## 5. Camadas

### 5.1 Casos de uso

| Contexto | Caso de uso | Portas que consome |
| --- | --- | --- |
| Conteúdo | `GetDraft` | `ContentRepository` |
| Conteúdo | `SaveDraft` | `ContentRepository`, `Clock`, `AuditLogger` |
| Conteúdo | `PublishDocument` | `ContentRepository`, `CacheInvalidator`, `Clock`, `AuditLogger` |
| Conteúdo | `ListRevisions` | `ContentRepository` |
| Conteúdo | `RollbackToRevision` | `ContentRepository`, `CacheInvalidator`, `AuditLogger` |
| Conteúdo | `GetPublishedContent` | `ContentRepository` |
| Mídia | `UploadAsset` | `MediaRepository`, `StorageProvider`, `AuditLogger` |
| Mídia | `ListAssets` / `DeleteAsset` | `MediaRepository`, `StorageProvider` |
| Leads | `SubmitLead` | `LeadRepository`, `Clock` |
| Leads | `ListLeads` / `UpdateLeadStatus` | `LeadRepository`, `AuditLogger` |

`PublishDocument` é o coração do sistema e concentra as invariantes 1, 2 e 9:
valida o draft, cria a revisão, promove `draft → published`, registra no audit
log e **por último** invalida o cache. A ordem importa — invalidar antes de
persistir serviria conteúdo velho.

### 5.2 Versionamento de shape

O campo `schemaVersion` no `ContentDocument` existe para quando o formato de um
documento mudar (ex.: `MediaItem` ganhar um campo `fit`, conforme a pendência em
[`docs/offers-aspect-ratio.md`](./offers-aspect-ratio.md)). O padrão é uma função
de migração por versão em `packages/core/src/schemas/<key>/migrations.ts`,
aplicada na leitura. Revisões antigas guardam a versão em que foram criadas e são
migradas ao serem restauradas.

---

## 6. UX do dashboard

### 6.1 Princípio de navegação

O menu espelha **as páginas do site**, não as tabelas do banco:

```
Início · Sobre · Franquias · Unidades · Política de Privacidade
Configurações do site · Mídia · Leads
```

O modelo mental de quem vai usar o painel é "quero mudar o banner da home", não
"quero fazer update no documento de key `home`". Nomear as telas pelas páginas
elimina a necessidade de treinamento.

### 6.2 Layout da tela de edição

```
┌──────────────┬────────────────────────────────────────────────────────┐
│              │  Início                          [Rascunho não publicado]│
│  Plastlima   │  ┌──────────────────────────────────────────────────┐  │
│  ──────────  │  │  Salvo às 14:32     [Visualizar]     [Publicar]  │  │ ← barra fixa
│  ▸ Início    │  └──────────────────────────────────────────────────┘  │
│    Sobre     │                                                         │
│    Franquias │   Banners do carrossel                          [+ Novo]│
│    Unidades  │   ┌────────────────────────────────────────────────┐   │
│    Política  │   │ ⠿  [img]  sorteio-dia-dos-pais.png       ✎  🗑 │   │
│  ──────────  │   │ ⠿  [img]  qualidade-embalagem.jpg        ✎  🗑 │   │
│    Config.   │   └────────────────────────────────────────────────┘   │
│    Mídia     │                                                         │
│    Leads     │   Números da empresa                                    │
│              │   ┌──────────┬──────────┬──────────┬──────────┐        │
│  ──────────  │   │  23+     │ 1.500+   │   14     │    3     │        │
│  joão ▾      │   │ anos...  │ produt.. │ unidad.. │ estados  │        │
└──────────────┴────────────────────────────────────────────────────────┘
                                                        [Histórico ▸]  ← drawer
```

**A barra de estado é fixa no topo da área de conteúdo** e carrega o badge de
estado, o botão *Visualizar* (abre o site real em draft mode) e *Publicar*. O
botão *Publicar* fica **desabilitado quando não há diferença** entre `draft` e
`published` — implementa a invariante 9 na própria interface, em vez de deixar o
usuário descobrir por mensagem de erro.

### 6.3 Regras de interação

- **Autosave do rascunho** com debounce de ~1,5 s e indicador textual
  "Salvo às HH:MM". Perda de trabalho por navegação acidental é a falha número um
  de painel feito em casa; salvar rascunho é barato porque nada disso afeta o
  site até publicar.
- **Reordenação por arrastar** (`dnd-kit`) **com alternativa por teclado** — as
  listas precisam ter botões de subir/descer acessíveis por `Tab`, não só o
  drag-and-drop.
- **`alt` obrigatório em toda imagem.** Sem `alt` não se publica. É acessibilidade
  e é SEO, e o site já depende disso hoje.
- **Validação de dimensão no upload, antes de aceitar**: comparar com a
  [spec de banners](./banner-spec.md) (2400 × 1250 px para o carrossel) e avisar
  na hora, com a dimensão detectada e a esperada. Aceitar e quebrar o layout
  depois é o pior resultado possível.
- **Estados completos**: skeleton no carregamento, empty state (o primitivo
  `empty` já existe em `packages/ui`), erro inline em pt-BR junto ao campo, e
  diálogo de confirmação em toda ação destrutiva.
- **Paleta neutra do shadcn no admin**, com o vermelho da marca (`#a0111a`) apenas
  como accent. O painel não deve parecer o site — isso evita que o editor confunda
  a tela de edição com um preview do resultado.

### 6.4 Editor de texto com ênfase

O site modela texto rico como
[`RichTextSegment`](../apps/web/src/types/content.ts) — uma `string` ou
`{ text, emphasis: true }`. É só isso: texto e destaque.

Portanto **não usar um WYSIWYG completo**. Um editor rico geraria HTML com
títulos, links e listas que nenhum componente do site sabe renderizar. A escolha
é **Tiptap com as extensões limitadas a parágrafo + negrito**, serializando de
volta para `RichTextSegment[]` no salvamento. O editor mostra exatamente as duas
coisas que existem, e o dado no banco continua limpo.

Os campos de
[`FRANCHISE_ABOUT_PARAGRAPHS`](../apps/web/src/data/franchise.ts) e da política de
privacidade hoje são `string` pura, sem modelo de ênfase — ficam como textarea
simples, e uniformizar isso é uma decisão em aberto
([seção 11](#11-decisões-em-aberto)).

### 6.5 Histórico e rollback

Drawer lateral listando as revisões: versão, autor, data/hora, nota opcional. Ao
selecionar uma revisão, mostrar **quais campos mudaram** em relação à publicada
(diff por chave, não diff de JSON cru) e um botão *Restaurar* com confirmação.
Restaurar cria uma nova revisão (invariante 3) — o histórico nunca encolhe.

### 6.6 Primitivas de UI a adicionar

`packages/ui` hoje tem 17 primitivas, mas faltam para um painel:
`table`, `dialog`, `sheet`, `select`, `tabs`, `badge`, `sidebar`, `form`,
`avatar`, `alert-dialog`. Adicionar com:

```bash
npx shadcn@latest add table dialog sheet select tabs badge sidebar form avatar alert-dialog -c packages/ui
```

O `apps/admin` precisa do seu próprio `components.json`, espelhando o de
[`apps/web/components.json`](../apps/web/components.json). O `@source` em
[`packages/ui/src/styles/globals.css`](../packages/ui/src/styles/globals.css) já
cobre `apps/**`, então o scan de classes do Tailwind alcança o novo app
automaticamente.

---

## 7. Integração com o site público

### 7.1 Leitura com fallback

Os arquivos de `apps/web/src/data/` **não somem** — passam a
`apps/web/src/data/fallback/` e continuam sendo o conteúdo padrão. Nasce
`apps/web/src/lib/content/` com uma função assíncrona por documento:

```ts
export async function getHomeContent(): Promise<HomeContent> {
	try {
		const doc = await contentRepository.findPublished("home");
		return homeContentSchema.parse(doc);
	} catch (error) {
		console.error("[content] falha ao ler 'home', usando fallback", error);
		return HOME_FALLBACK;
	}
}
```

Cada função é envolvida em cache com a tag `content:<key>`. Em português: **o site
nunca cai por causa do banco.** Se o Mongo estiver fora, ou o documento não
existir, ou o JSON não passar no Zod, a página renderiza o conteúdo do último
deploy e o erro vai para o log.

### 7.2 Propagação dos dados nos componentes

Hoje 40 importações em 29 arquivos pegam os dados direto do módulo. Server
components podem simplesmente chamar `await getHomeContent()`. Mas **três client
components importam dados no topo do módulo** e precisam passar a receber por
props do server component pai:

- [`hero-carousel.tsx`](../apps/web/src/components/home/hero-carousel.tsx) — importa `HERO_BANNERS`
- [`site-header.tsx`](../apps/web/src/components/layout/site-header.tsx) — importa `NAV_ITEMS`, `EXTERNAL_LINKS`, `SITE`
- [`locations-explorer.tsx`](../apps/web/src/components/locations/locations-explorer.tsx) — já recebe por props ✅

O padrão a seguir é o que
[`apps/web/src/app/unidades/page.tsx`](../apps/web/src/app/unidades/page.tsx) já
faz: a página busca, o componente cliente recebe.

### 7.3 Tokens na política de privacidade

A política interpola dados do `SITE` via template literal. Ao virar conteúdo
editável, isso vira substituição de token no momento da renderização:

| Antes (código) | Depois (conteúdo editável) |
| --- | --- |
| `` `...a ${SITE.name}, com sede em ${SITE.address}...` `` | `...a {{site.name}}, com sede em {{site.address}}...` |

Tokens disponíveis: `{{site.name}}`, `{{site.address}}`, `{{site.email}}`,
`{{site.franchiseEmail}}`, `{{contact.support.display}}`. O editor mostra a lista
de tokens válidos e avisa se um token desconhecido for usado. A função de
renderização vive em `packages/core` e é trivialmente testável.

Também vale trocar `updatedAt: "31 de julho de 2026"` (string pré-formatada) por
uma data real, formatada na renderização com `date-fns`.

### 7.4 Novas rotas em `apps/web`

| Rota | Função |
| --- | --- |
| `app/api/revalidate/route.ts` | `POST` autenticado por `REVALIDATE_SECRET`, recebe `{ tags: string[] }` e chama `revalidateTag` |
| `app/api/preview/route.ts` | Ativa o draft mode com token assinado de vida curta e redireciona para a página |
| `app/api/leads/route.ts` | Recebe os formulários, valida com os schemas já existentes em [`lib/schemas/lead.ts`](../apps/web/src/lib/schemas/lead.ts) e chama `SubmitLead` |

Como admin e site são deploys separados, a invalidação é uma chamada HTTP: o
adaptador `HttpRevalidationClient` em `packages/infra` implementa a porta
`CacheInvalidator` fazendo `POST` para essa rota.

Em draft mode, as funções de `lib/content/` checam `(await draftMode()).isEnabled`
e leem `draft` em vez de `published`, sem cache.

### 7.5 Configuração a ajustar

- **`next.config.ts` precisa de `images.remotePatterns`** apontando para o domínio
  público do R2. Hoje não existe bloco `images` — nenhuma imagem remota renderiza.
- **`packages/env/src/web.ts` hoje não valida nada** (`client: {}` e
  `runtimeEnv: {}`), e `NEXT_PUBLIC_SITE_URL` é lido cru em
  [`data/site.ts:10`](../apps/web/src/data/site.ts). Corrigir e declarar as novas
  variáveis com validação.
- **`turbo.json` precisa de uma task `test`** — hoje só existem `build`, `lint`,
  `check-types` e `dev`. A task `lint` está declarada mas nenhum pacote a
  implementa.

---

## 8. Mapa de migração

Toda constante hoje em `apps/web/src/data/` e para onde ela vai. Nada pode ficar
órfão.

| Constante atual | Arquivo | Itens | `key` do documento |
| --- | --- | --- | --- |
| `SITE` | `site.ts:13` | 9 campos | `site` |
| `CONTACT` | `site.ts:27` | 2 telefones | `site` |
| `EXTERNAL_LINKS` | `site.ts:32` | 3 URLs | `site` |
| `SOCIAL_LINKS` | `site.ts:39` | 3 | `site` |
| `SITE_URL` | `site.ts:9` | — | **fica em código** (variável de ambiente) |
| `NAV_ITEMS` | `navigation.ts:3` | 5 | `navigation` (**só o `label`**) |
| `LEGAL_ITEMS` | `navigation.ts:12` | 1 | `navigation` (**só o `label`**) |
| `HERO_BANNERS` | `home.ts:3` | 2 | `home` |
| `COMPANY_STATS` | `home.ts:14` | 4 | `home` |
| `OFFER_HIGHLIGHTS` | `home.ts:21` | 11 | `home` |
| `ABOUT_STORY` | `about.ts:13` | 11 blocos | `about` |
| `ABOUT_SUMMARY` | `about.ts:141` | 1 | `about` |
| `WELCOME_MESSAGE` | `about.ts:144` | 1 | `about` |
| `COMPANY_TIMELINE` | `franchise.ts:3` | 10 | `franchise` |
| `SERVED_SEGMENTS` | `franchise.ts:55` | 15 | `franchise` |
| `FRANCHISE_ABOUT_PARAGRAPHS` | `franchise.ts:73` | 3 | `franchise` |
| `MARKET_DATA_IMAGES` | `franchise.ts:79` | 2 | `franchise` |
| `STORE_LOCATIONS` | `locations.ts:3` | 14 | `locations` |
| `PRIVACY_POLICY` | `privacy-policy.ts:9` | 10 seções | `privacy-policy` |
| `IMAGES` | `images.ts:5` | 6 | migra para `MediaAsset` + referências nos documentos |
| `DOCUMENTS` | `images.ts:18` | 1 PDF | `site` (o PDF do catálogo vira upload) |

### 8.1 Conteúdo hoje preso no JSX

Além dos dados acima, há texto escrito direto no JSX que o cliente vai querer
editar. Precisa ser extraído para os documentos correspondentes:

| Arquivo | O que está fixo |
| --- | --- |
| [`franchise-hero.tsx:15-37`](../apps/web/src/components/franchise/franchise-hero.tsx) | eyebrow, `h1`, parágrafo de apoio, 2 rótulos de botão |
| [`franchise-hero.tsx:48`](../apps/web/src/components/franchise/franchise-hero.tsx) | `src="/seja-um-franqueado.png"` — **única imagem que não passa por `images.ts`** |
| `distribution-center-section.tsx` | `h2` + parágrafo com `<strong>` |
| `franchise-preview-section.tsx`, `about-preview-section.tsx`, `offers-section.tsx`, `market-data-section.tsx` | títulos, eyebrows e chamadas |
| `app/*/page.tsx` | props de `PageHero` e o `metadata` (title/description) de cada rota |

O `metadata` de cada página merece atenção: título e descrição são exatamente o
tipo de coisa que o cliente vai querer ajustar por SEO. Recomendação: cada
documento ganha um bloco `seo: { title, description }` consumido por
[`buildPageMetadata`](../apps/web/src/lib/seo/metadata.ts).

---

## 9. Estratégia de testes

| Camada | Onde | Como |
| --- | --- | --- |
| **Unitário** | `packages/core` | Sem mock de framework. Os test doubles são **repositórios in-memory** (`InMemoryContentRepository`) que implementam as mesmas interfaces que a produção. Cada invariante da [seção 4.2](#42-invariantes-de-domínio) vira um teste nomeado. |
| **Integração** | `packages/infra` | Mongo real via `mongodb-memory-server` com replica set. Valida mappers, índices únicos, sequência de `version` e concorrência de publicação — coisas que o teste unitário por definição não pega. |
| **Server actions** | `apps/admin` | Chamadas diretamente, com casos de uso reais e repositórios in-memory. |
| **Componentes** | `apps/admin` | Testing Library nos formulários: validação, estado de erro, estado desabilitado do botão *Publicar*. |

Meta de cobertura **alta apenas em `packages/core`** — é código puro e
determinístico, onde 100% é realista e barato. Não impor threshold global: força
teste de baixo valor em código de adaptação.

Já existe uma função escrita para ser testável e nunca testada:
[`filterLocations`](../apps/web/src/lib/locations.ts) — bom primeiro teste da
suíte, antes mesmo do CMS.

---

## 10. Segurança, LGPD e variáveis de ambiente

### 10.1 Acesso

- **Sem cadastro público.** Usuários criados por seed ou convite.
- Papéis `owner` (gerencia usuários) e `editor` (edita e publica conteúdo).
- Sessão em cookie `httpOnly`, `secure`, `sameSite=lax`.
- Toda ação de escrita registra `actorId` e `actorEmail` no `AuditLogEntry`.

### 10.2 Upload

- Validar **magic bytes**, não o `mimeType` declarado pelo cliente.
- Limite de tamanho por arquivo e checagem de dimensões antes de aceitar.
- Nome no bucket derivado do checksum, nunca do nome original enviado.
- Servir de domínio separado do app.

### 10.3 Dados pessoais

Os leads contêm nome, e-mail e telefone — **dado pessoal sob a LGPD**. Definir e
documentar prazo de retenção, e conferir se a política de privacidade publicada
cobre o armazenamento em banco próprio (hoje ela descreve o site sem banco).
Exportação e exclusão de lead a pedido do titular devem existir no painel.

Nos formulários públicos: honeypot, tempo mínimo de preenchimento e rate limit
por IP. Sem CAPTCHA.

### 10.4 Variáveis de ambiente

Todas declaradas e validadas em `packages/env`:

| Variável | Onde | Uso |
| --- | --- | --- |
| `DATABASE_URL` | admin + web | Conexão Mongo |
| `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` | admin | Sessão |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | admin | Upload de mídia |
| `REVALIDATE_SECRET` | admin + web | Autenticação da invalidação de cache |
| `PREVIEW_SECRET` | admin + web | Assinatura do token de draft mode |
| `NEXT_PUBLIC_SITE_URL` | web | Já existe — passar a ser validada |

---

## 11. Decisões em aberto

| # | Questão | Impacto |
| --- | --- | --- |
| 1 | Uniformizar `FRANCHISE_ABOUT_PARAGRAPHS` e a política para o modelo `RichTextSegment[]`? | Um editor de texto só, em vez de dois. Exige migrar o conteúdo existente. |
| 2 | `MediaItem` ganha `fit: "cover" \| "contain"`? | Resolveria a pendência de [`offers-aspect-ratio.md`](./offers-aspect-ratio.md) e daria controle de corte ao editor |
| 3 | Adicionar um estado ao [`LOCATION_STATES`](../apps/web/src/types/location.ts) hoje exige mudar código em 2 lugares (o tipo e `STATE_ABBREVIATION` em [`lib/seo/schema.ts`](../apps/web/src/lib/seo/schema.ts)). Virar dado editável? | Expansão para novos estados sem deploy |
| 4 | Agendamento de publicação (publicar em data futura)? | Fora do v1; exigiria um job agendado |
| 5 | `apps/web/tsconfig.json` **não estende** a base de `packages/config` e perde `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`. Alinhar antes de o `apps/admin` copiar essa divergência? | Rigor de tipos consistente no monorepo |
| 6 | Notificação por e-mail ao receber um lead? | Provável necessidade real do negócio; escolher provedor (Resend) |

---

## 12. Roadmap

| Fase | Entrega | Pronto quando |
| --- | --- | --- |
| **0** | `packages/core` + `packages/infra` + Prisma + Vitest + CI | `turbo run check-types test` verde |
| **1** | Domínio, casos de uso e testes unitários — **sem UI** | Invariantes da seção 4.2 todas cobertas; `core` sem nenhum import de infra |
| **2** | Repositórios Prisma, R2 e testes de integração | Suíte contra Mongo em memória verde |
| **3** | `apps/admin`: auth, shell e **um documento piloto (Início / banners)** | Trocar um banner e publicar, ponta a ponta |
| **4** | Site público lendo do banco, com fallback, ISR e revalidate | Publicar no admin reflete no site em segundos; derrubar o banco não derruba o site |
| **5** | Demais documentos, biblioteca de mídia, preview e histórico | Os 7 documentos editáveis |
| **6** | Leads + audit log | Formulários persistem e aparecem no painel |
| **7** | Hardening: rate limit, observabilidade, retenção LGPD | — |

A fase 3 ser **um só documento** é deliberado: valida a arquitetura inteira
(domínio → infra → admin → site) numa fatia vertical fina, antes de replicar o
padrão para os outros seis. Se algo estiver errado na abstração, é ali que
aparece — e ali ainda é barato mudar.

---

## 13. Como verificar

Checklist de aceitação por fase, para não haver ambiguidade sobre o que é "pronto":

1. **Isolamento do domínio** — `grep -r "prisma\|next/\|react" packages/core/src`
   não retorna nada. Se retornar, a inversão de dependência foi quebrada.
2. **Testes** — `pnpm run test` na raiz roda unitários e integração; a task `test`
   existe no `turbo.json`.
3. **Tipos e lint** — `pnpm run check-types` e `pnpm run check` verdes em todos os
   pacotes, incluindo os novos.
4. **Publicação ponta a ponta** — subir `apps/web` (`pnpm run dev:web`, porta
   3001) e `apps/admin` (porta 3002); trocar um banner no admin, publicar, e ver
   a home atualizada sem rebuild.
5. **Resiliência** — derrubar a conexão com o Mongo e recarregar o site: as
   páginas continuam renderizando o conteúdo de fallback, com o erro no log.
6. **Preview** — clicar em *Visualizar* com um rascunho não publicado abre o site
   mostrando o rascunho; abrir a mesma URL sem o token mostra o publicado.
7. **Rollback** — restaurar uma revisão anterior e confirmar que o histórico
   ganhou uma entrada nova em vez de perder uma.
8. **Nenhuma regressão de estrutura** — as 6 rotas continuam as mesmas, o
   `sitemap.xml` continua correto e nada no CMS permite criar ou remover páginas.
