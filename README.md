# Inventory Management System

A learning project with a production-minded foundation:

- **Frontend:** React 19 + TypeScript (strict) + Vite 8 + React Router 8
- **Backend:** NestJS 12 + TypeScript (strict) + Prisma ORM 7 + Jest
- **Database:** PostgreSQL 18 (Docker Compose, local development only)
- **Tooling:** npm workspaces, ESLint 10 (flat config, type-aware), Prettier

> This repository contains **infrastructure only**: configuration, database
> schema and migrations, a health endpoint and an empty home page. Business
> features (auth, CRUD, inventory processing, orders, UI) are intentionally not
> implemented.

**Quick reference:** every everyday command is in [COMMANDS.md](COMMANDS.md).

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Project structure](#3-project-structure)
4. [Environment setup](#4-environment-setup)
5. [Docker Compose usage](#5-docker-compose-usage)
6. [PostgreSQL connection](#6-postgresql-connection)
7. [Prisma configuration](#7-prisma-configuration)
8. [Running initial migrations](#8-running-initial-migrations)
9. [Creating future migrations](#9-creating-future-migrations)
10. [Moving the project to another computer](#10-moving-the-project-to-another-computer)
11. [Deploying database migrations](#11-deploying-database-migrations)
12. [Backing up and restoring existing data](#12-backing-up-and-restoring-existing-data)
13. [Starting React and NestJS](#13-starting-react-and-nestjs)
14. [Running lint, type checks, and tests](#14-running-lint-type-checks-and-tests)
15. [Database design notes](#15-database-design-notes)
16. [Architectural decisions](#16-architectural-decisions)
17. [AI agent skills](#17-ai-agent-skills)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Prerequisites

| Tool                                     | Version                 | Why                                  |
| ---------------------------------------- | ----------------------- | ------------------------------------ |
| [Node.js](https://nodejs.org)            | **22.22+** (24 LTS+)    | Runs NestJS, Vite and the Prisma CLI |
| npm                                      | 10+ (ships with Node)   | Package manager, workspaces          |
| [Docker Desktop](https://www.docker.com) | Recent, with Compose v2 | Runs PostgreSQL locally              |
| Git                                      | Any recent              | Version control                      |

Check your versions:

```bash
node -v
npm -v
docker --version
docker compose version
```

> You can also use a PostgreSQL server installed natively instead of Docker.
> Just point `DATABASE_URL` at it (see [section 6](#6-postgresql-connection)).

### Windows notes

- **Docker Desktop needs WSL 2.** WSL 2 needs hardware virtualization (enabled
  in the BIOS/UEFI) and the Windows "Virtual Machine Platform" feature. If
  Docker reports _"Docker Desktop is unable to start"_ or `wsl --status` says
  virtualization is not enabled, run this in an **administrator** PowerShell,
  then restart Windows:

  ```powershell
  wsl --install --no-distribution
  ```

- **Restart VS Code / terminals after installing tools.** A terminal keeps the
  `PATH` it started with. If `git` or `docker` is _"not recognized"_ right after
  installing it, quit VS Code completely (File → Exit) or restart Windows.
- Docker Desktop must be **running** (whale icon in the tray) before any
  `npm run db:*` command.

## 2. Installation

```bash
git clone https://github.com/VeselinVasilev97/inventoryhub.git
cd inventoryhub
npm install
```

`npm install` (run at the repository root) installs the dependencies of **both**
apps. npm workspaces put the shared packages in the root `node_modules/`.
Always run `npm install` from the root, never inside `apps/*`.

> **About `allowScripts` in `package.json`:** npm 11 only runs the install
> scripts of packages you have approved. The Prisma packages are approved
> (they download the Prisma engines). Two native helper packages are
> explicitly denied because they work without their scripts. When you upgrade
> Prisma, approve the new version with
> `npm install-scripts approve prisma @prisma/engines`.

## 3. Project structure

```text
inventoryhub/
├── apps/
│   ├── backend/                      # NestJS REST API
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema (source of truth)
│   │   │   └── migrations/           # Committed SQL migrations
│   │   │       ├── migration_lock.toml
│   │   │       └── 20261019204355_init/migration.sql
│   │   ├── src/
│   │   │   ├── config/               # Env variable validation (Zod)
│   │   │   ├── database/             # PrismaService + global DatabaseModule
│   │   │   ├── generated/prisma/     # Generated Prisma Client (git-ignored)
│   │   │   ├── health/               # GET /api/health
│   │   │   ├── modules/              # Your feature modules (empty for now)
│   │   │   │   ├── auth/  users/  roles/  permissions/
│   │   │   │   ├── products/  categories/  warehouses/  inventory/
│   │   │   │   └── suppliers/  purchase-orders/  sales-orders/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/                     # End-to-end tests (need a database)
│   │   ├── prisma.config.ts          # Prisma CLI configuration
│   │   ├── .env.example
│   │   └── package.json
│   └── frontend/                     # React SPA
│       ├── src/
│       │   ├── config/env.ts         # Typed access to VITE_* variables
│       │   ├── layouts/RootLayout.tsx
│       │   ├── pages/                # HomePage, NotFoundPage, RouteErrorPage
│       │   ├── router.tsx            # Route definitions
│       │   └── main.tsx
│       ├── index.html
│       ├── vite.config.ts
│       ├── .env.example
│       └── package.json
├── docker-compose.yml                # PostgreSQL only
├── .env.example                      # Docker Compose (database) credentials
├── package.json                      # Workspace root + scripts
├── skills-lock.json                  # Pinned AI agent skills (section 17)
├── .agents/skills/                   # Installed skills (git-ignored)
├── .prettierrc.json  .editorconfig  .gitattributes  .gitignore
├── COMMANDS.md                       # Command cheat sheet
└── README.md
```

The `src/modules/*` folders contain only a `.gitkeep` file, so Git keeps the
empty folders. Delete the `.gitkeep` once you add real files.

## 4. Environment setup

There are three `.env` files. Each has a committed `.env.example` template.
The real `.env` files are git-ignored. **Never commit real credentials.**

| File                 | Used by                       | Contains                                          |
| -------------------- | ----------------------------- | ------------------------------------------------- |
| `.env`               | Docker Compose                | `POSTGRES_USER/PASSWORD/DB/PORT`                  |
| `apps/backend/.env`  | NestJS + Prisma CLI           | `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `NODE_ENV` |
| `apps/frontend/.env` | Vite (exposed to the browser) | `VITE_API_BASE_URL`                               |

Create them:

```bash
# macOS / Linux / Git Bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/frontend/.env.example apps/frontend/.env
```

Then edit them. The credentials in the root `.env` and in `DATABASE_URL` must
match:

```text
.env                     POSTGRES_USER=inventory  POSTGRES_PASSWORD=s3cret  POSTGRES_DB=inventory  POSTGRES_PORT=5432
apps/backend/.env        DATABASE_URL=postgresql://inventory:s3cret@localhost:5432/inventory?schema=public
```

> If the password contains special characters (`@ : / ? # %`), URL-encode them
> in `DATABASE_URL` (for example `@` → `%40`).

**Validation:** the backend validates its variables at startup
(`apps/backend/src/config/env.validation.ts`). A missing or invalid value
stops the API with a message like `Config validation error: DATABASE_URL: Invalid URL`.
The frontend checks `VITE_API_BASE_URL` when it starts (`apps/frontend/src/config/env.ts`).

> `VITE_*` variables are compiled into the JavaScript bundle and are visible to
> anyone using the site. Never put secrets in the frontend `.env`.

## 5. Docker Compose usage

Docker Compose runs **only PostgreSQL**. The API and the web app run on your
machine through npm.

| Command           | What it does                                                                    |
| ----------------- | ------------------------------------------------------------------------------- |
| `npm run db:up`   | `docker compose up -d postgres`: creates/starts the container in the background |
| `npm run db:ps`   | Shows container status, including the health check (`healthy`)                  |
| `npm run db:logs` | Follows the PostgreSQL logs (Ctrl+C to stop following)                          |
| `npm run db:stop` | Stops the container. Data is kept.                                              |
| `npm run db:down` | Removes the container and network. **Data is kept** (the named volume stays).   |

### How the data is preserved

The data lives in the named Docker volume `inventory-management_postgres_data`.
It survives `db:stop`, `db:down`, a computer restart and container re-creation.

```bash
docker volume ls                                      # list volumes
docker volume inspect inventory-management_postgres_data
```

### ⚠️ Commands that DELETE all database data

Avoid these unless you really want an empty database:

```bash
docker compose down -v          # -v removes the named volumes!
docker volume rm inventory-management_postgres_data
docker volume prune / docker system prune --volumes
```

Take a backup first ([section 12](#12-backing-up-and-restoring-existing-data)).

### Notes

- The port is bound to `127.0.0.1`, so the database is not reachable from other
  machines on your network.
- `POSTGRES_USER/PASSWORD/DB` are applied **only when the volume is created the
  first time**. Changing them in `.env` later does not change an existing
  database. To change the password, run
  `ALTER USER inventory WITH PASSWORD '...';`, or take a backup and re-create
  the volume.
- If port 5432 is already used (for example by a native PostgreSQL), set
  `POSTGRES_PORT=5433` in `.env` and use `localhost:5433` in `DATABASE_URL`.

## 6. PostgreSQL connection

Both the NestJS app and the Prisma CLI read `DATABASE_URL` from `apps/backend/.env`:

```text
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

Open an interactive SQL shell inside the container:

```bash
docker compose exec postgres psql -U inventory -d inventory
# \dt          list tables
# \d products  describe a table
# \q           quit
```

Or browse the data in a GUI:

```bash
npm run prisma:studio --workspace=@inventory/backend
```

Any client (DBeaver, pgAdmin, DataGrip, TablePlus) can connect to
`localhost:<POSTGRES_PORT>` with the credentials from `.env`.

## 7. Prisma configuration

Prisma 7 splits its configuration into two files:

| File                                | Purpose                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `apps/backend/prisma/schema.prisma` | Models, enums, relations, indexes, and the generator (client output location)       |
| `apps/backend/prisma.config.ts`     | CLI settings: schema path, migrations folder, `DATABASE_URL` (loaded with `dotenv`) |

How the pieces fit together:

- `prisma generate` writes a fully typed client to
  `apps/backend/src/generated/prisma/`. This folder is git-ignored and
  regenerated after each schema change.
- At runtime, `PrismaService` (`src/database/prisma.service.ts`) extends that
  client. It connects through the official `pg` **driver adapter**
  (`@prisma/adapter-pg`), which Prisma 7 requires. The connection string comes
  from the validated `ConfigService`.
- `DatabaseModule` is `@Global()`, so you can inject `PrismaService` in any
  feature module without importing anything extra:

  ```ts
  constructor(private readonly prisma: PrismaService) {}
  ```

- Import model types and enums from the generated client, never from
  hand-written copies:

  ```ts
  import type { Product } from '../../generated/prisma/client';
  import { StockMovementType, Prisma } from '../../generated/prisma/client';
  ```

Prisma scripts (run from the repository root):

| Command                     | What it does                                                                    |
| --------------------------- | ------------------------------------------------------------------------------- |
| `npm run prisma:validate`   | Checks `schema.prisma` for errors (no database needed)                          |
| `npm run prisma:generate`   | Regenerates the TypeScript client (no database needed)                          |
| `npm run db:migrate:dev`    | Creates and applies a migration in **development**, then regenerates the client |
| `npm run db:migrate:create` | Creates a migration file **without applying it**, so you can review it          |
| `npm run db:migrate:deploy` | Applies pending committed migrations (staging/production/new machines)          |
| `npm run db:migrate:status` | Lists applied and pending migrations                                            |
| `npm run db:migrate:diff`   | Prints the SQL needed to bring the database in line with the schema (read-only) |

> **Never use `prisma db push`** in this project. It changes the database
> without creating a migration file, so the change can't be reproduced or
> reviewed.

## 8. Running initial migrations

The initial migration (`20261019204355_init`) is already committed. On a new
database, apply it:

```bash
npm run db:up               # start PostgreSQL
npm run db:ps               # wait until the status is "healthy"
npm run db:migrate:deploy   # create all tables from the committed migrations
npm run prisma:generate     # generate the typed client
npm run db:migrate:status   # should print "Database schema is up to date!"
```

You can also use `npm run db:migrate:dev` locally. It applies pending
migrations and regenerates the client in one step.

## 9. Creating future migrations

Workflow for every schema change:

```bash
# 1. Edit apps/backend/prisma/schema.prisma

# 2. Validate the schema
npm run prisma:validate

# 3. Create the migration WITHOUT applying it
npm run db:migrate:create -- --name add_product_weight

# 4. Review the generated SQL file:
#    apps/backend/prisma/migrations/<timestamp>_add_product_weight/migration.sql
#    Edit it if needed (data backfill, CHECK constraint, rename instead of drop).

# 5. Apply it to your development database (also regenerates the client)
npm run db:migrate:dev

# 6. Commit the schema and the migration together
git add apps/backend/prisma
git commit -m "db: add product weight"
```

To create and apply in one step (when you don't need to review the SQL):
`npm run db:migrate:dev -- --name add_product_weight`.

Name migrations in `snake_case` and describe the change, for example
`add_supplier_tax_id` or `create_stock_transfers`.

### Reviewing SQL before destructive changes

Some changes can lose data: dropping or renaming a column or table, changing a
column type, or making a column required. Prisma prints a warning such as
_"You are about to drop the column…"_. Before you apply one of these:

1. **Always use `db:migrate:create` first** and read `migration.sql`. Look for
   `DROP TABLE`, `DROP COLUMN`, `ALTER COLUMN ... TYPE`, `SET NOT NULL`, `DROP INDEX`.
2. **Renames:** Prisma treats a renamed field as _drop + add_, which loses data.
   Replace it by hand with
   `ALTER TABLE "products" RENAME COLUMN "old_name" TO "new_name";`.
3. **New required column on a table with data:** add it as nullable, backfill
   it with an `UPDATE`, then `SET NOT NULL`. Either do this in the same
   edited migration or split it into two migrations.
4. **Preview what the database still differs by:** `npm run db:migrate:diff`
   prints the SQL needed to bring the database in line with the schema,
   without changing anything.
5. Take a backup before applying anything destructive outside your local machine.

### Rules

- ✅ Commit `schema.prisma`, every `migrations/*/migration.sql`, and `migration_lock.toml`.
- ❌ **Never edit or delete a migration that has already been applied** to any
  shared database (or committed and pulled by someone else). Prisma stores a
  checksum of each applied migration and reports a mismatch. To fix a mistake,
  create a **new** migration.
- ❌ Never use `prisma db push`.
- ⚠️ `prisma migrate reset` **drops the entire database** and re-applies every
  migration. Use it only on a local throwaway database, and never on data you
  care about. If `migrate dev` suggests a reset because of "drift", stop and
  find out what changed the database outside of migrations.

## 10. Moving the project to another computer

**Migrations recreate the schema (tables, indexes, constraints), not the
data.** To move data as well, combine this with a backup and restore
([section 12](#12-backing-up-and-restoring-existing-data)).

On the new machine:

```bash
git clone https://github.com/VeselinVasilev97/inventoryhub.git
cd inventoryhub
npm install
npx skills experimental_install   # optional: restore AI agent skills (section 17)

# Create the three .env files (section 4) and set credentials.
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

npm run db:up               # start PostgreSQL (creates an empty volume)
npm run db:migrate:deploy   # rebuild the complete schema from committed migrations
npm run prisma:generate     # generate the typed client

# Optional: bring your data across (section 12)

npm run dev:backend         # terminal 1
npm run dev:frontend        # terminal 2
```

## 11. Deploying database migrations

In staging and production, **only** use `migrate deploy`:

```bash
DATABASE_URL="postgresql://user:pass@db-host:5432/inventory?schema=public" \
  npm run db:migrate:deploy
```

What `migrate deploy` does and does not do:

- ✅ Applies the committed migrations that haven't been applied yet, in order, and
  records them in the `_prisma_migrations` table.
- ✅ Is safe to run on every deploy. With nothing pending it does nothing.
- ❌ Never creates new migrations, never resets the database, and doesn't need
  a shadow database.

`migrate dev` is for development only. It may ask to reset the database.

Typical deploy order:

1. Back up the production database.
2. Build the app (`npm ci && npm run prisma:generate && npm run build`).
3. Run `npm run db:migrate:deploy` with the production `DATABASE_URL`, either
   in the environment or in `apps/backend/.env` on the server.
4. Start or restart the API: `npm run start:prod --workspace=@inventory/backend`.

> The `prisma` CLI is a dev dependency. Run migrations from a step that has dev
> dependencies installed (CI job or build stage), or install with `npm ci` (not
> `--omit=dev`) on the server.

### Moving to another server

1. Install Node.js 22.22+ and PostgreSQL 14+ on the server, or use a managed
   PostgreSQL. Docker Compose here is for local development only.
2. Create the database and a user. Put the connection string in `DATABASE_URL`.
3. Clone the repository, run `npm ci`, and set `NODE_ENV=production`,
   `PORT`, `CORS_ORIGIN` (your real frontend URL) and `DATABASE_URL`.
4. Run `npm run db:migrate:deploy`, then `npm run prisma:generate` and `npm run build`.
5. To move existing data, restore a backup **instead of** step 4's
   `migrate deploy` (the backup includes the `_prisma_migrations` table).
   Afterwards run `npm run db:migrate:status` to confirm.
6. Build the frontend with the production API URL:
   `VITE_API_BASE_URL=https://api.example.com/api npm run build --workspace=@inventory/frontend`
   and serve `apps/frontend/dist/` with any static web server. Configure it to
   fall back to `index.html` for client-side routes.

## 12. Backing up and restoring existing data

Migrations recreate structure, never rows. Use `pg_dump` / `pg_restore` to
copy data. The commands below run the PostgreSQL tools **inside the
container**, so you don't need them installed locally, and they work the same
in Bash and PowerShell.

Replace `inventory` with your `POSTGRES_USER` / `POSTGRES_DB` values.

### Backup

```bash
mkdir backups   # git-ignored

# 1. Create a compressed dump (custom format) inside the container
docker compose exec postgres pg_dump -U inventory -d inventory -Fc -f /tmp/inventory.dump

# 2. Copy it to your machine
docker compose cp postgres:/tmp/inventory.dump ./backups/inventory-2026-10-19.dump
```

`-Fc` is PostgreSQL's custom format: compressed, and restorable selectively
with `pg_restore`. The dump contains schema, data and the `_prisma_migrations`
history.

### Restore

Restoring **into a new, empty database** is the safest option:

```bash
# 1. Copy the dump into the container
docker compose cp ./backups/inventory-2026-10-19.dump postgres:/tmp/restore.dump

# 2. Create an empty target database
docker compose exec postgres createdb -U inventory inventory_restored

# 3. Restore into it
docker compose exec postgres pg_restore -U inventory -d inventory_restored --no-owner /tmp/restore.dump
```

Then point `DATABASE_URL` at `inventory_restored` and run
`npm run db:migrate:status`. If the backup is older than your code, run
`npm run db:migrate:deploy` to apply newer migrations.

To overwrite an existing database (⚠️ **destructive**: drops the objects
contained in the dump before restoring them):

```bash
docker compose exec postgres pg_restore -U inventory -d inventory --clean --if-exists --no-owner /tmp/restore.dump
```

> Avoid redirecting `pg_dump` output with `>` in Windows PowerShell 5.1, which
> can corrupt binary files. The `-f` + `docker compose cp` approach above avoids that.

## 13. Starting React and NestJS

Use two terminals:

```bash
npm run dev:backend    # NestJS in watch mode → http://localhost:3000/api
npm run dev:frontend   # Vite dev server      → http://localhost:5173
```

Check that everything works:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","database":"up","timestamp":"..."}
```

`/api/health` returns `503` with `"database":"down"` if PostgreSQL can't be
reached.

- **Global prefix:** every API route lives under `/api`.
- **CORS:** only the origins in `CORS_ORIGIN` (default `http://localhost:5173`)
  may call the API from a browser. Separate several origins with commas.
- **API URL in React:** import it from `src/config/env.ts`:

  ```ts
  import { env } from './config/env';
  fetch(`${env.apiBaseUrl}/health`);
  ```

Production builds:

```bash
npm run build                                          # builds both apps
npm run start:prod --workspace=@inventory/backend      # runs apps/backend/dist/main.js
npm run preview --workspace=@inventory/frontend        # serves the built SPA locally
```

## 14. Running lint, type checks, and tests

| Command                | What it does                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm run lint`         | ESLint (type-aware, `strictTypeChecked`) on both apps                                                    |
| `npm run lint:fix`     | Same, auto-fixing what it can                                                                            |
| `npm run typecheck`    | `tsc --noEmit` on both apps (no output files)                                                            |
| `npm run test`         | Backend unit tests (Jest). The database is mocked; PostgreSQL isn't needed.                              |
| `npm run test:e2e`     | Backend end-to-end tests. Boots the real app, so **PostgreSQL must be running** with migrations applied. |
| `npm run format`       | Formats all files with Prettier                                                                          |
| `npm run format:check` | Checks formatting without changing files (useful in CI)                                                  |

More backend test scripts: `test:watch` and `test:cov` (coverage), for example
`npm run test:cov --workspace=@inventory/backend`.

Unit tests live next to the code (`*.spec.ts`). End-to-end tests live in
`apps/backend/test/` (`*.e2e-spec.ts`).

> The frontend has no test runner yet. Vitest + Testing Library is the usual
> choice for Vite projects when you need one.

## 15. Database design notes

### Stock ledger

- `Product` has **no stock quantity**. Stock is stored per warehouse.
- `StockMovement` is an **append-only ledger**. Every change to stock is a new
  row. Rows are never updated or deleted; mistakes are corrected with a new
  `ADJUSTMENT`.
- `InventoryBalance` caches the current quantity per (product, warehouse). It
  must equal the sum of that pair's signed movements. Update the balance and
  insert the movement **in the same transaction** (`prisma.$transaction`).

### Quantity sign convention (enforced by a CHECK constraint)

| Type           | Stored `quantity`    | Effect on stock                                        |
| -------------- | -------------------- | ------------------------------------------------------ |
| `IN`           | positive (`> 0`)     | `+quantity`                                            |
| `OUT`          | positive (`> 0`)     | `−quantity`                                            |
| `TRANSFER_IN`  | positive (`> 0`)     | `+quantity`                                            |
| `TRANSFER_OUT` | positive (`> 0`)     | `−quantity`                                            |
| `ADJUSTMENT`   | **signed**, non-zero | `+quantity` (positive = increase, negative = decrease) |

Example: a stock count finds 3 fewer units than recorded → one `ADJUSTMENT`
row with `quantity = -3`. A transfer is two rows (`TRANSFER_OUT` from the
source, `TRANSFER_IN` to the destination) sharing the same `referenceId`.

### Types and constraints

- **IDs:** UUID v7 (time-ordered), generated by Prisma Client and stored as the
  native `uuid` type.
- **Money:** `Decimal(19,4)`. **Quantities:** `Decimal(18,3)`, so fractional
  units of measure (kg, l) work. Prisma returns these as `Prisma.Decimal`, not
  `number`; never do money math with JavaScript floats.
- **Timestamps:** `timestamptz(3)`, stored in UTC.
- **Naming:** tables and columns are `snake_case` in PostgreSQL (`@@map` /
  `@map`) and camelCase in TypeScript.
- **CHECK constraints** live in the hand-edited part of the init migration,
  because Prisma's schema language can't express them: non-negative prices and
  balances, positive order quantities, and the ledger sign rule above.
- **Unique constraints:** `users.email`, `roles.name`, `permissions.key`,
  `categories.name`, `products.sku`, `products.barcode` (optional; NULLs
  allowed), `warehouses.code`, both `order_number` columns, (product, warehouse)
  on balances, and (order, product) on order lines.

### Delete behaviour

| Relationship                                            | On delete  | Reason                                              |
| ------------------------------------------------------- | ---------- | --------------------------------------------------- |
| Stock movements / balances → product, warehouse, user   | `RESTRICT` | History can't be removed by deleting a parent       |
| Orders → supplier, creator; order lines → product       | `RESTRICT` | Orders keep their references                        |
| Order lines → their order                               | `CASCADE`  | Lines are part of the order (e.g. deleting a draft) |
| `user_roles`, `role_permissions` → user/role/permission | `CASCADE`  | Join rows only, no history                          |
| Product → category                                      | `SET NULL` | Deleting a category leaves products uncategorized   |

Prefer **deactivating** (`isActive = false`) users, products, warehouses and
suppliers over deleting them.

## 16. Architectural decisions

- **Modular monolith, not microservices.** One NestJS app with one module per
  domain area (`src/modules/*`), one database.
- **Prisma 7 with the `prisma-client` generator.** The client is generated
  into `src/generated/prisma` as TypeScript, in CommonJS format to match the
  NestJS build. Prisma 7 connects through a driver adapter (`@prisma/adapter-pg`).
- **NestJS 12 compiled to CommonJS** (the official `nest new` default for Jest
  projects). NestJS 12 packages are ESM; they're loaded via Node's
  `require(esm)`. That's why Jest runs with `--experimental-vm-modules` (you'll
  see a harmless `ExperimentalWarning`).
- **TypeScript 6.0** (not 7.0): typescript-eslint and ts-jest don't support
  TypeScript 7 yet.
- **Zod for environment validation.** `@nestjs/config` 12 accepts any Standard
  Schema validator directly, and `ConfigService<Env, true>` gives typed config access.
- **No shared frontend/backend model package.** The frontend must not import
  database types. Later, API types can be generated from an OpenAPI contract.
- **`strictTypeChecked` ESLint + strict TypeScript** in both apps
  (`noUncheckedIndexedAccess`, `noImplicitOverride`, …). `any` is a lint error.
- **Docker for PostgreSQL only.** The apps run natively for fast reloads and
  easy debugging.

## 17. AI agent skills

The project uses [Matt Pocock's skills](https://github.com/mattpocock/skills)
(instructions for AI coding agents such as Claude Code, e.g. `tdd`,
`code-review`, `domain-modeling`).

| File / folder      | In Git?    | Purpose                                                     |
| ------------------ | ---------- | ----------------------------------------------------------- |
| `skills-lock.json` | ✅ yes     | Which skills are installed, their source and a content hash |
| `.agents/skills/`  | ❌ ignored | The downloaded skill files (re-created from the lock file)  |

| Command                                      | What it does                                        |
| -------------------------------------------- | --------------------------------------------------- |
| `npx skills experimental_install`            | Restore all skills from `skills-lock.json` (new PC) |
| `npx skills list`                            | List installed skills                               |
| `npx skills update`                          | Update skills to their latest versions              |
| `npx skills add mattpocock/skills --skill=x` | Add another skill (updates `skills-lock.json`)      |
| `npx skills remove x`                        | Remove a skill                                      |

Commit `skills-lock.json` after adding, updating or removing skills. The
`skills` CLI needs `git` on your `PATH` (see
[Troubleshooting](#18-troubleshooting)).

## 18. Troubleshooting

| Problem                                                        | Cause                                                | Fix                                                                                                                                                         |
| -------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Port 5173 is already in use` (or 3000)                        | An old dev server is still running                   | `Get-NetTCPConnection -LocalPort 5173` → `Stop-Process -Id <OwningProcess>`                                                                                 |
| `failed to connect to the docker API ... pipe`                 | Docker Desktop is not running                        | Start Docker Desktop and wait until it is ready                                                                                                             |
| `Docker Desktop is unable to start`                            | WSL 2 / Virtual Machine Platform missing             | See [Windows notes](#windows-notes)                                                                                                                         |
| `git` / `docker` _"not recognized"_, or `spawn git ENOENT`     | Terminal started before the tool was installed       | Quit VS Code completely or restart Windows                                                                                                                  |
| `Config validation error: DATABASE_URL ...`                    | `apps/backend/.env` missing or wrong                 | Copy `apps/backend/.env.example` to `.env` and check the values. Run the API through npm scripts, which start it from `apps/backend` so its `.env` is found |
| `/api/health` returns 503 (`"database":"down"`)                | PostgreSQL not running or wrong credentials          | `npm run db:up`, `npm run db:ps`, compare `.env` with `apps/backend/.env`                                                                                   |
| `password authentication failed`                               | `.env` password changed after the volume was created | See [Docker notes](#notes): credentials apply only on first volume creation                                                                                 |
| TypeScript can't find `../generated/prisma/client`             | Prisma Client not generated                          | `npm run prisma:generate`                                                                                                                                   |
| `npm warn install-scripts ... not yet covered by allowScripts` | A new package version wants to run an install script | Review it, then `npm install-scripts approve <pkg>` (see [Installation](#2-installation))                                                                   |
