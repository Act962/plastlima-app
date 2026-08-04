# Guia de deploy na Vercel

Como colocar o site e o painel no ar. São **dois projetos Vercel a partir do
mesmo repositório** — `apps/web` (site público) e `apps/admin` (painel) — ligados
a **um único MongoDB Atlas**.

> **Resumo:** crie o cluster Atlas (replica set), gere os segredos, crie dois
> projetos na Vercel apontando para o mesmo repo com _Root Directory_ diferente,
> preencha as variáveis de ambiente de cada um, faça o deploy do site primeiro e
> do painel depois, e crie o usuário do painel pelo seed.

---

## 1. Arquitetura do deploy

```
                     ┌───────────────────────────┐
   www.plastlima…    │  Vercel: projeto "web"     │   Root: apps/web
   (site público) ──▶│  Next.js · ISR + fallback  │
                     └─────────────┬──────────────┘
                                   │ lê o publicado / recebe POST /api/revalidate
                                   ▼
                     ┌───────────────────────────┐
                     │   MongoDB Atlas (replica   │
                     │   set — exigência do CMS)  │
                     ▲   └───────────────────────────┘
                                   │ grava rascunho / publica
   admin.plastlima…  ┌─────────────┴──────────────┐
   (painel) ────────▶│  Vercel: projeto "admin"   │   Root: apps/admin
                     │  Next.js · Better Auth      │
                     └────────────────────────────┘
```

- **Por que replica set:** a publicação grava documento + revisão numa transação
  (`$transaction`), que no MongoDB **exige replica set**. O Atlas já é um por
  padrão (`mongodb+srv://…`). Um Mongo standalone quebra a publicação.
- **Por que dois projetos:** o site é estático/ISR e sem autenticação; o painel
  tem sessão e é privado. Separar mantém o site leve e permite escalar ou derrubar
  o painel sem tocar no site.

---

## 2. Pré-requisitos

1. **MongoDB Atlas** com um cluster criado. Em _Network Access_, libere os IPs da
   Vercel (o mais simples é `0.0.0.0/0`, já que o acesso é protegido por
   usuário/senha) e crie um usuário de banco. Pegue a _connection string_
   (`mongodb+srv://usuario:senha@cluster.xxxx.mongodb.net/plastlima?retryWrites=true&w=majority`).
   - Acrescente o nome do banco no caminho (ex.: `/plastlima`).
2. **Conta na Vercel** com acesso ao repositório `Act962/plastlima-app`.
3. **Domínios** (opcional, mas recomendado): `www.plastlima.com.br` para o site e
   `admin.plastlima.com.br` para o painel.

---

## 3. Gerar os segredos

Rode localmente (Git Bash / WSL / macOS / Linux):

```bash
# Segredo de sessão do Better Auth (painel)
openssl rand -base64 32

# Segredo compartilhado de revalidação (o MESMO valor vai no site e no painel)
openssl rand -base64 32
```

Guarde os dois valores. O de revalidação precisa ser **idêntico** nos dois
projetos.

---

## 4. Projeto `web` (site público)

Na Vercel: **Add New… → Project → importe o repositório**.

| Configuração | Valor |
| --- | --- |
| **Root Directory** | `apps/web` |
| **Framework Preset** | Next.js (detectado) |
| **Build Command** | _padrão_ (usa o script `vercel-build`, que roda `prisma generate` antes do `next build`) |
| **Install Command** | _padrão_ (a Vercel detecta o pnpm pelo `packageManager` e instala o workspace inteiro) |
| **Node.js Version** | 22.x |

> A Vercel, ao detectar o pnpm workspace + Turborepo, instala a partir da raiz do
> repositório mesmo com o _Root Directory_ em `apps/web`. Não é preciso mudar o
> _Install Command_.

### Variáveis de ambiente — `web`

| Variável | Exemplo | Para quê |
| --- | --- | --- |
| `DATABASE_URL` | `mongodb+srv://…/plastlima?retryWrites=true&w=majority` | Ler o conteúdo publicado (e o sorteio) |
| `NEXT_PUBLIC_SITE_URL` | `https://www.plastlima.com.br` | Canonical, OpenGraph, sitemap, robots, JSON-LD |
| `CORS_ORIGIN` | `https://www.plastlima.com.br` | Origem permitida |
| `REVALIDATE_SECRET` | _(o 2º segredo do passo 3)_ | Autentica o `POST /api/revalidate` vindo do painel |

> **Dica de resiliência:** acrescente `&serverSelectionTimeoutMS=5000` ao
> `DATABASE_URL` do site. Se o Atlas ficar inacessível, o driver desiste rápido e
> a página cai no conteúdo de fallback sem pendurar a requisição. (O código já
> tem um teto de 3s por segurança, mas o driver falhar cedo é melhor ainda.)

---

## 5. Projeto `admin` (painel)

Na Vercel: **Add New… → Project → importe o MESMO repositório** de novo.

| Configuração | Valor |
| --- | --- |
| **Root Directory** | `apps/admin` |
| **Framework Preset** | Next.js (detectado) |
| **Build Command** | _padrão_ (`vercel-build`) |
| **Install Command** | _padrão_ |
| **Node.js Version** | 22.x |

### Variáveis de ambiente — `admin`

| Variável | Exemplo | Para quê |
| --- | --- | --- |
| `DATABASE_URL` | _(a mesma do site)_ | Ler/gravar conteúdo, sessões e participantes |
| `BETTER_AUTH_SECRET` | _(o 1º segredo do passo 3)_ | Assinatura das sessões |
| `BETTER_AUTH_URL` | `https://admin.plastlima.com.br` | URL base do painel para o Better Auth |
| `REVALIDATE_SECRET` | _(o MESMO do site)_ | Autentica a chamada de revalidação ao site |
| `PUBLIC_SITE_URL` | `https://www.plastlima.com.br` | Para onde o painel envia o `POST /api/revalidate` ao publicar |

> Sem `REVALIDATE_SECRET`/`PUBLIC_SITE_URL` no painel, publicar **funciona** (grava
> a revisão), mas o site só reflete pelo ISR (renovação periódica), não na hora.

---

## 6. Ordem do primeiro deploy

1. **Deploy do `web`.** Anote a URL de produção (ou configure o domínio).
2. Ajuste `PUBLIC_SITE_URL` no `admin` para essa URL.
3. **Deploy do `admin`.**
4. Configure os domínios (`www` → web, `admin` → admin) e ajuste
   `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL`, `PUBLIC_SITE_URL`, `CORS_ORIGIN`
   para os domínios finais. Um _redeploy_ aplica as mudanças de env.

---

## 7. Criar o usuário do painel

Não há cadastro público (o Better Auth tem `disableSignUp`). O acesso nasce por
seed, rodado **localmente apontando para o Atlas**:

```bash
# na raiz do repositório, com DATABASE_URL do Atlas exportada
DATABASE_URL="mongodb+srv://…/plastlima" \
  pnpm --filter admin seed:admin -- \
  --email=voce@plastlima.com.br --senha='use-uma-senha-forte-de-12+' --nome='Seu Nome' --papel=owner
```

Há também `pnpm run seed:admin:prod`, que lê de um arquivo `.env.atlas` — veja
`apps/admin/.env.atlas.example`.

---

## 8. Verificação pós-deploy

1. Acesse `admin.plastlima.com.br`, entre com o usuário do seed.
2. Em **Início**, troque um `alt`/banner (autosava) e clique **Publicar**.
3. Abra `www.plastlima.com.br` — a mudança aparece em segundos (revalidação).
4. **Teste de resiliência (opcional):** pause o cluster no Atlas e recarregue o
   site; ele continua no ar com o conteúdo de fallback.

---

## 9. Notas e pendências

- **Prisma na Vercel:** o runtime é Amazon Linux (RHEL). O `schema.prisma` já
  declara `binaryTargets = ["native", "rhel-openssl-3.0.x"]` — não mexa nisso, ou
  o build passa e o deploy quebra na primeira query. O `vercel-build` roda
  `prisma generate` antes do `next build`.
- **Imagens remotas (Fase 5):** quando a biblioteca de mídia no Cloudflare R2
  entrar, será preciso um bloco `images.remotePatterns` no `apps/web/next.config.ts`
  apontando para o domínio público do R2, e as variáveis `R2_ACCOUNT_ID`,
  `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` no
  projeto `admin`. Hoje as imagens são servidas de `apps/web/public`.
- **Preview / draft mode (Fase 5):** exigirá `PREVIEW_SECRET` (site + painel).
- **`SKIP_ENV_VALIDATION`:** só é usado no CI. Em produção, deixe as variáveis
  definidas de verdade.

---

## 10. Problemas comuns

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| Build quebra em `prisma generate` | `DATABASE_URL` ausente no build | O `generate` não precisa do banco, mas confira se a env existe no projeto |
| Publicar não reflete no site | `REVALIDATE_SECRET` diferente entre os dois, ou `PUBLIC_SITE_URL` errado | Iguale os segredos e confira a URL do site no painel |
| Erro de transação ao publicar | Banco não é replica set | Use o Atlas (`mongodb+srv://`), não um Mongo standalone |
| Deploy quebra na 1ª query (build passa) | `binaryTargets` sem o alvo RHEL | Mantenha `rhel-openssl-3.0.x` no `schema.prisma` |
| Login não funciona | `BETTER_AUTH_URL` diferente do domínio real | Ajuste para o domínio do painel e faça _redeploy_ |
| Site lento quando o banco cai | Driver esperando o timeout longo | Acrescente `serverSelectionTimeoutMS=5000` ao `DATABASE_URL` do site |
