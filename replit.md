# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- **api-server** (`/api`) — Express + Postgres + Drizzle. White-label store backend: products, collections, cart, orders, customers, discounts, reviews, store settings, admin metrics.
- **store** (`/`) — React + Vite white-label e-commerce template ("Maison"). Editorial fashion/lifestyle aesthetic. Storefront (home, shop, collections, product, cart, checkout, search, orders, account) + full admin dashboard (dashboard, products, collections, orders, customers, discounts, analytics, settings). Uses Fraunces (serif) + Outfit (sans). Empty of real product data — sellable as plug-and-play.
- **mockup-sandbox** (`/__mockup`) — component preview server.
