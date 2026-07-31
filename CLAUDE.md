# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Marketing website for **Plastlima**, a Brazilian distributor of disposables and packaging. Single Next.js app (`apps/web`) in a pnpm + Turborepo monorepo. All user-facing content is in **Portuguese (pt-BR)**; code identifiers, filenames, and comments are English (some inline comments are Portuguese — match the surrounding file).

## Commands

Run from the repo root:

```bash
pnpm install            # install (pnpm 10, uses catalog: version pinning)
pnpm run dev            # all apps (web on :3001)
pnpm run dev:web        # web only, http://localhost:3001
pnpm run build          # turbo build
pnpm run check-types    # tsc --noEmit across the workspace
pnpm run check          # biome check --write . (format + lint + organize imports)
```

There is **no test suite** and no separate lint script — `pnpm run check` (Biome) is the lint/format gate, `check-types` is the type gate. When previewing the dev server, use the launch config named `web` (`.claude/launch.json`), never a raw Bash `next dev`.

## Architecture

**Data-driven content, thin presentation.** The core pattern across the whole app: content lives in plain TypeScript constants, typed by a matching `types/` file, and small presentation components just map over that data. To change copy, offers, banners, locations, timeline, or the privacy policy, edit the `data/` file — not JSX.

```
apps/web/src/
  app/          # App Router routes (page.tsx per route) + sitemap.ts, robots
  data/         # content constants: site.ts, home.ts, navigation.ts, locations.ts,
                #   franchise.ts, about.ts, privacy-policy.ts, images.ts
  types/        # shapes for the data files: content, navigation, location, legal
  components/   # feature-grouped: home/ franchise/ locations/ about/ contact/
                #   forms/ legal/ layout/ seo/ sections/ ui/
  lib/          # seo/ (metadata, schema), services/, schemas/ (zod), whatsapp.ts
  hooks/        # use-carousel, use-form-submission, use-location-filters
  index.css     # brand theme (imported by app/layout.tsx)
```

**Single source of truth for site-wide facts.** `data/site.ts` holds `SITE` (name, url, address, emails, copyright), `CONTACT` (WhatsApp phone numbers), `EXTERNAL_LINKS`, and `SOCIAL_LINKS`. `data/navigation.ts` holds `NAV_ITEMS` and `LEGAL_ITEMS`. These feed the header, footer, sitemap, and JSON-LD — add a legal page by extending `LEGAL_ITEMS` and it flows to both the footer and `sitemap.ts` automatically. Never hardcode a phone number, email, or nav link in a component.

**SEO is centralized, not per-page ad hoc.** Every route's `metadata` is built with `buildPageMetadata({ title, description, path })` from `lib/seo/metadata.ts` (handles canonical, OpenGraph, Twitter consistently). `metadataBase` is set once in `app/layout.tsx`, so all image/canonical paths are relative. Structured data comes from `lib/seo/schema.ts` (`organizationSchema`, `websiteSchema`, `breadcrumbSchema`) rendered via the `<JsonLd>` / `JsonLd` component. `DEFAULT_OG_IMAGE` points at `/og-image.jpg` (1200×630).

**Shared UI package.** `@plastlima-app/ui` (`packages/ui`) holds shadcn/ui primitives and the base `globals.css`. Import primitives as `@plastlima-app/ui/components/button` and the class merger as `import { cn } from "@plastlima-app/ui/lib/utils"`. App-local presentational wrappers live in `apps/web/src/components/ui/` (e.g. `Container`, `Section`, `Eyebrow`, `ContentImage`) — prefer these over raw markup for layout consistency.

## Conventions that will trip you up

- **Path aliases:** `@/*` → `apps/web/src/*`; `@plastlima-app/ui/*` → the shared package. Both are configured in `tsconfig.json`.
- **Typed routes are on** (`typedRoutes: true` in `next.config.ts`). Every `href` is checked against real routes at build time — a typo'd path is a type error, and nav data is typed as `Route`.
- **React Compiler is on** (`reactCompiler: true`) — do not hand-add `useMemo`/`useCallback` for micro-optimization; the compiler handles memoization.
- **Custom `type-*` typography utilities** (`type-display`, `type-heading`, `type-heading-sm`, `type-body-lg`, `type-lead`, `type-eyebrow`) live in `index.css`, deliberately **outside** the `text-*` namespace so `cn()`/tailwind-merge doesn't confuse a font-size with a text color. Use these for headings/body scale, not raw `text-[..]`.
- **Brand color tokens** are custom Tailwind v4 `@theme` variables (`ink`, `brand`, `yellow`, `canvas`, `surface`, `line`, …) named away from shadcn tokens on purpose. Use `text-ink`, `bg-brand`, etc. — not shadcn's `foreground`/`muted`.
- **Biome, not Prettier/ESLint:** tab indentation, class sorting enabled for `clsx`/`cva`/`cn` (keep class strings sorted or let `pnpm run check` fix them).
- **Images:** local assets in `apps/web/public/`; always `next/image`. For fluid editorial images use the `ContentImage` wrapper (width/height are only aspect hints, `h-auto` preserves real proportions). Hero carousel banner sizing/cropping rules are documented in `docs/banner-spec.md`.

## Git

- HTTPS remote `github.com/Act962/plastlima-app`, default branch `main`.
- **Commit and push only when the user explicitly says so** (e.g. "commite e suba"). End commit messages with:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
