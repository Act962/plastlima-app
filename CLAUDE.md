# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Website and admin panel for **Plastlima**, a Brazilian distributor of disposables and packaging. pnpm + Turborepo monorepo with two Next.js apps:

- `apps/web` — public marketing site plus the raffle ("sorteio") signup, on **:3001**
- `apps/admin` — CMS and raffle panel for the client's team, on **:3002**

They share `packages/core` (domain + use cases, no I/O), `packages/infra` (Prisma/MongoDB, R2, HTTP adapters), `packages/ui` (shadcn primitives), plus `packages/config` (tsconfig/vitest bases) and `packages/env`.

All user-facing content is in **Portuguese (pt-BR)**. Code identifiers and filenames are English; comments are mostly Portuguese (all of `core`/`infra` and the newer app code) — match the surrounding file.

## Commands

Run from the repo root:

```bash
pnpm install            # install (pnpm 10, uses catalog: version pinning)
pnpm run dev            # both apps
pnpm run dev:web        # web only, http://localhost:3001
pnpm run dev:admin      # admin only, http://localhost:3002
pnpm run build          # turbo build
pnpm run check-types    # tsc --noEmit across the workspace
pnpm run check          # biome check --write . (format + lint + organize imports)
pnpm run test           # vitest in core + infra (infra needs the Mongo container up)

pnpm run db:up          # MongoDB replica set via docker-compose, waits for healthy
pnpm run db:down        # stop (data stays in the volume)
pnpm run db:reset       # stop and wipe the volume
pnpm run db:push        # prisma db push (schema lives in packages/infra/prisma)

pnpm run seed:admin -- --email=… --senha=… [--nome=…] [--papel=owner|editor]
pnpm run seed:participants -- --quantidade=50   # fake raffle entries, dev only
```

The gates are **`pnpm run check` (Biome — lint/format), `pnpm run check-types`, and `pnpm run test`**; there is no separate lint script. When previewing a dev server, use the launch configs named `web` and `admin` (`.claude/launch.json`), never a raw Bash `next dev`.

## Local setup

1. `cp` each `.env.example` to `.env`: `apps/web`, `apps/admin`, `packages/infra`. Three values must be **identical across web and admin** or the features silently degrade: `REVALIDATE_SECRET` (publish → site cache invalidation), `PREVIEW_SECRET` (draft-mode preview), `R2_PUBLIC_URL` (so `next/image` accepts panel-uploaded images). Without R2 credentials the Media screen reports upload as unavailable; everything else works.
2. `pnpm run db:up && pnpm run db:push`
3. `pnpm run seed:admin -- …` — there is no public signup (`disableSignUp`), so the seed is the only way to create a panel login.

**On Windows, in a fresh clone:** Git for Windows ships `core.autocrlf=true` in the *system* config and this repo has no `.gitattributes`, so the worktree comes out CRLF while the index is LF, and Biome then fails on ~200 files. With a clean tree: `git config --local core.autocrlf false; git rm --cached -r -q .; git reset --hard HEAD`. Verify with `git ls-files --eol package.json` (expect `i/lf w/lf`).

## Architecture

**Layered, dependency-inverted.** `packages/core` holds the domain (entities, value objects, errors) and use cases that depend only on **ports** (`ContentRepository`, `ParticipantRepository`, `StorageProvider`, `CacheInvalidator`, `Clock`, `AuditLogger`, `ContentValidator`). `packages/infra` implements those ports with Prisma, R2 and HTTP. The apps are the **composition roots** — the only places that wire a use case to a concrete adapter:

- `apps/admin/src/lib/content.ts` (`createSaveDraft`, `createPublishDocument`, `createRollbackToRevision`, …)
- `apps/admin/src/lib/participants.ts`, `apps/admin/src/lib/leads.ts`, `apps/admin/src/lib/media.ts`, `apps/admin/src/lib/auth.ts`
- `apps/web/src/lib/raffle/registration.ts`, `apps/web/src/lib/leads/submission.ts`, `apps/web/src/lib/content/*.ts`

Keep the direction: nothing in `core` imports Prisma, Next or Zod schemas from the apps; nothing in a React component imports Prisma directly. Domain failures are **values, not exceptions** — use cases return `Result` (`ok`/`fail`) and the app maps the error to a message.

**Content: CMS documents with a code fallback.** `CONTENT_KEYS` (`home`, `about`, `franchise`, `locations`, `privacy-policy`, `site`, `navigation`) is a closed list — the panel edits content inside those slots, it never creates new ones. Each key is one `ContentDocument` with a `draft` and a `published` JSON, plus immutable `ContentRevision` snapshots for history/rollback. The **shape of each key is a Zod schema in `@plastlima-app/core/schemas`**, validated at the boundary.

The site reads through `apps/web/src/lib/content/<key>.ts`, and that file is the pattern to copy for a new key:

- `unstable_cache` tagged `content:<key>` with `revalidate: 300` (ISR as a safety net)
- a 3s read timeout — with Mongo down the driver would otherwise hang ~30s
- schema validation **outside** the cache, so an invalid published JSON never poisons it
- any failure falls back to `apps/web/src/data/fallback/<key>.ts`, which is assembled from the plain constants in `apps/web/src/data/*.ts`

So: **to change what the live site shows, edit in the panel; `data/*.ts` is the deploy-time default and the last line of defense.** The database being down must never take the site down.

Publishing calls `PublishDocument` → `HttpRevalidationClient` → `POST /api/revalidate` on the site (shared `REVALIDATE_SECRET`), which invalidates the cache tag. Preview uses a signed token (`packages/infra/src/preview/preview-token.ts`) against `/api/preview`, which turns on Next draft mode; in draft mode the content readers serve the `draft` instead of the `published` — except `site` and `navigation`, which are read from the layout and deliberately skip `draftMode()`, since calling it there would opt every page out of static rendering.

**Raffle.** `Participant` + the `PhoneNumber` and `TaxDocument` value objects; `(campaignId, phone)` is a unique index and *the* dedup rule — a repeat signup increments `participationCount` instead of creating a row. The store is stored as a **snapshot** (`storeId`/`storeName`/`city`/`state`), so renaming a store later cannot rewrite where someone actually bought. The campaign id is deliberately duplicated in `apps/web/src/data/raffle.ts` and `apps/admin/src/lib/participants.ts` — the panel does not depend on the public app.

The current campaign gives away **two identical prizes in one campaign**: one drawn among Centro de Distribuição (wholesale) customers, the other among the 14 store customers. That split is the `pool` (`"cd" | "unidades"`), and it is **one campaign, not two** on purpose — the unique index is per campaign, so a single campaign is what makes "one person competes in one pool only" a *database* guarantee instead of an app-level check with a race window. A repeat signup keeps the pool of the first one.

The pool is never sent by the client. The CD is a 15th entry in the raffle's store directory (`apps/web/src/lib/raffle/store-directory.ts`, not in `data/locations.ts` — it is not a retail unit and must not show on `/unidades`), each store carries its own `pool`, and `RegisterParticipation` derives the participant's pool from the chosen store. So there is no way to submit a store and a pool that contradict each other. The radio in the form is only a UI affordance that decides whether the store select appears; what crosses the wire is always a `storeId`.

`DrawWinner` requires a pool — drawing "the whole campaign" would merge two different raffles into one. The panel (`/sorteio?grupo=…`) and `pnpm run draw:winner -- --grupo=…` both draw one pool at a time, and the pool goes into the ata. `pool` is optional in Prisma only for backward compatibility: participants from the previous campaign predate the field, so mapper and queries read a missing pool as `"unidades"`.

**Leads.** The public forms (`/contato`, `/franquias`) write a `Lead` through a Server Action colocated with each route, and the panel reads them at `/leads`. The opposite of the raffle on purpose: **no deduplication** — the same person may send two different messages, and merging them would lose the second. `phone` keeps what the person typed; `phoneDigits` is the derived field that makes the panel's search match an unformatted number. `handledBy` records who took the lead on the row itself, because the question the team asks is "who talked to this person?".

**Media.** `MediaAsset` in Cloudflare R2. `storageKey` derives from the SHA-256 `checksum`, which is unique in the database, so re-uploading the same file returns the existing record; `alt` is required. Uploads go through a Server Action, which is why `apps/admin/next.config.ts` raises `serverActions.bodySizeLimit` to 6mb.

**Data-driven presentation (web).** Content lives in plain TypeScript constants typed by a matching `types/` file, and small components map over that data. `data/site.ts` holds `SITE`, `CONTACT`, `EXTERNAL_LINKS`, `SOCIAL_LINKS`; `data/navigation.ts` holds `NAV_ITEMS` and `LEGAL_ITEMS`. They feed the header, footer, `sitemap.ts` and JSON-LD — extend `LEGAL_ITEMS` and a legal page flows to both automatically. Never hardcode a phone number, email or nav link in a component.

```
apps/web/src/
  app/          # routes + sitemap.ts, robots, api/revalidate, api/preview
  data/         # content constants; data/fallback/ = CMS-shaped defaults built from them
  types/        # shapes for the data files
  components/   # home/ franchise/ locations/ about/ contact/ raffle/ forms/ legal/ layout/ seo/ ui/
  lib/          # content/ (CMS readers), raffle/, seo/, services/, schemas/, image/, whatsapp.ts
  index.css     # brand theme

apps/admin/src/
  app/(painel)/ # one route per content key + midia/, config/
                # (painel)/participantes/ = raffle entries: search, pagination, CSV
                # (painel)/leads/ = form submissions: filters, CSV, mark as handled
  lib/          # composition roots, auth, csv
```

**SEO is centralized, not per-page ad hoc.** Every route's `metadata` comes from `buildPageMetadata({ title, description, path })` (`lib/seo/metadata.ts`), which handles canonical/OpenGraph/Twitter consistently. `metadataBase` is set once in `app/layout.tsx`, so image and canonical paths stay relative. Structured data comes from `lib/seo/schema.ts` rendered via `<JsonLd>`. `DEFAULT_OG_IMAGE` points at `/og-image.jpg` (1200×630).

**Shared UI package.** `@plastlima-app/ui` holds shadcn primitives (**base-maia** style, `@base-ui/react` — not radix) and the base `globals.css`. The admin's chrome is composed from these: `Sidebar` (+ `SidebarProvider`/`SidebarInset`/rail), `Table`, `Select`, `Badge`, `Button`, `Input`, `Dialog`, `Sheet`, `Tooltip`, `Breadcrumb`. To wrap a Next `<Link>` in a base-ui `Button`/`SidebarMenuButton`, pass `render={<Link … />}` (not `asChild`); for a link styled as a button prefer `<a className={buttonVariants(…)}>` — base-ui `Button` warns when it renders a non-`<button>`. Biome ignores `packages/ui`, so components stay as shadcn ships them. New shared components must be generated from the **main checkout** (`shadcn add -c packages/ui`), never a worktree — the CLI misresolves the workspace alias inside a worktree and writes to the repo root. Import as `@plastlima-app/ui/components/button` and `import { cn } from "@plastlima-app/ui/lib/utils"`. App-local presentational wrappers live in `apps/web/src/components/ui/` (`Container`, `Section`, `Eyebrow`, `ContentImage`) — prefer them over raw markup.

## Conventions that will trip you up

- **Path aliases:** `@/*` resolves per app (`apps/web/src/*` *or* `apps/admin/src/*`); `@plastlima-app/ui/*` → the shared package. Cross-app imports do not exist — share through `packages/`.
- **Typed routes are on** in both apps. Every `href` is checked against real routes at build time, and nav data is typed as `Route`.
- **React Compiler is on in `apps/web` only** — do not hand-add `useMemo`/`useCallback` there for micro-optimization.
- **Two palettes on purpose.** The site uses custom Tailwind v4 `@theme` brand tokens (`ink`, `brand`, `yellow`, `canvas`, `surface`, `line`, …) — `text-ink`, `bg-brand`. The panel uses the **shadcn tokens** in `packages/ui/src/styles/globals.css` (an **amber/gold** `--primary` from the applied preset; `bg-background`, `text-muted-foreground`), with brand red kept only for the logo mark, so an editor never mistakes the editing screen for a preview of the site. The site is unaffected by this theme because it renders its own brand tokens and only borrows the shared `Toaster`. The panel shell lives in `apps/admin/src/components/painel/` (`app-sidebar`, `panel-topbar`, `page-shell`, `nav-items`); every panel route is under the `(painel)` group so it inherits the sidebar + top bar. Content editors keep their own sticky toolbar (offset `top-12` to clear the top bar).
- **Custom `type-*` typography utilities** (`type-display`, `type-heading`, `type-heading-sm`, `type-body-lg`, `type-lead`, `type-eyebrow`) live in `apps/web/src/index.css`, deliberately **outside** the `text-*` namespace so `cn()`/tailwind-merge doesn't confuse a font size with a text color. Site only.
- **Biome, not Prettier/ESLint:** tab indentation, class sorting for `clsx`/`cva`/`cn`.
- **Prisma + MongoDB:** the schema lives in `packages/infra/prisma/schema.prisma`; a **replica set is required** (both Atlas and the docker-compose single node qualify). Both apps list `@prisma/client` and `@plastlima-app/infra` in `serverExternalPackages` — importing infra from a client component breaks the build.
- **Images:** local assets in `apps/web/public/`, always `next/image`; panel-uploaded images come from the R2 domain, allowed via `images.remotePatterns` built from `R2_PUBLIC_URL`. For fluid editorial images use `ContentImage` (width/height are aspect hints, `h-auto` keeps real proportions). Hero banner sizing rules: `docs/banner-spec.md`.

## Tests

Vitest, in two flavors:

- `packages/core` — pure unit tests, fast, parallel, no setup. This is where coverage is expected to be high.
- `packages/infra` — integration tests against the **real MongoDB** from docker-compose. `src/testing/global-setup.ts` runs `prisma db push` against `plastlima_test` (override with `TEST_DATABASE_URL`) because the unique index is what the duplicate test actually exercises; `fileParallelism` is off since all files share one database. Run `pnpm run db:up` first or they fail with instructions.

The apps have no tests — behavior worth testing belongs in `core`.

## Specs

`docs/` carries the written specs, and they are the source of truth for decisions and open questions: `spec-sorteio.md` (raffle), `spec-dashboard-cms.md` (panel/CMS, sections are referenced from code comments as "spec §N"), `deploy-vercel.md`, `banner-spec.md`, `offers-aspect-ratio.md`.

## Git

- HTTPS remote `github.com/Act962/plastlima-app`, default branch `main`.
- **Commit and push only when the user explicitly says so** (e.g. "commite e suba"). End commit messages with:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
