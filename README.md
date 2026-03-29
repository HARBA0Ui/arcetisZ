# Arcetis

Arcetis is a gamified rewards platform built around quests, XP, points, referrals, sponsor campaigns, reward redemptions, and a separate admin workflow. The repository currently contains both the active consolidated app and the older split architecture that it replaced.

This README is a project review as much as a setup guide: it explains what is active, what is legacy, how the code is organized, how requests move through the system, and where the main implementation tradeoffs are.

## Executive Summary

- The active runtime is `apps/frontend`, a single Next.js 14 app that now serves:
  - the player-facing frontoffice
  - the admin backoffice under `/backoffice/*`
  - the API layer under `/api/*`
  - Google OAuth via NextAuth
  - image uploads
- The repo still includes two older apps:
  - `apps/backend`: standalone Express API
  - `apps/backoffice`: standalone Next.js admin panel
- The database schema is shared across all variants in `prisma/schema.prisma` and uses MongoDB through Prisma.
- Core business logic exists twice:
  - active version in `apps/frontend/src/server/*`
  - legacy version in `apps/backend/src/*`
- Root npm scripts only target the active `frontend` workspace.
- There is no automated test suite or CI configuration in this repository.

## Repository State

The codebase shows a migration in progress, not a clean monorepo from scratch.

### What is current

- `apps/frontend` is the app you should treat as the main product.
- Root scripts in `package.json` only run `apps/frontend`.
- The landing page, frontoffice, backoffice, auth, and API are all implemented there.

### What is legacy but still useful

- `apps/backend` is the previous Express server implementation.
- `apps/backoffice` is the previous standalone admin dashboard that talks to the Express API.
- Both still look runnable, but they are not wired into root scripts or the active workspace.

### Notable repo observations

- The current architecture reduces deployment complexity by collapsing three runtimes into one Next app.
- The main maintenance cost is duplication: services, validations, and domain logic exist in both the active Next server layer and the legacy Express layer.
- The root workspace is partial. It only declares `apps/frontend`, even though two other apps remain in the repo.
- The seed script is destructive for several collections and should be treated as development bootstrap, not production-safe data tooling.

## High-Level Structure

| Path | Role |
| --- | --- |
| `apps/frontend` | Active Next.js application for frontoffice, backoffice, auth, API, and uploads |
| `apps/frontend/src/app` | App Router pages and route handlers |
| `apps/frontend/src/app/api/[[...path]]/route.ts` | Catch-all internal API dispatcher |
| `apps/frontend/src/server` | Active server-side business logic, Prisma access, env parsing, storage |
| `apps/frontend/src/hooks` | Frontoffice React Query hooks |
| `apps/frontend/src/backoffice` | Embedded backoffice client code used by `/backoffice/*` routes |
| `apps/backoffice` | Legacy standalone Next.js admin app |
| `apps/backend` | Legacy standalone Express API |
| `prisma/schema.prisma` | Shared MongoDB schema for all app variants |
| `package.json` | Root workspace config and scripts for the active app |

## Active Architecture

The active application is not "frontend only". It is effectively a full-stack Next.js product.

### Request flow

1. A browser loads a page from `apps/frontend/src/app`.
2. Frontoffice pages use `@/lib/api` and backoffice pages use `@/backoffice/lib/api`.
3. Both axios clients call the same internal base URL: `/api`.
4. JWTs are attached from local storage and mirrored into cookies.
5. `/api/*` requests are handled by `apps/frontend/src/app/api/[[...path]]/route.ts`.
6. That catch-all route dispatches to service modules in `apps/frontend/src/server/services/*`.
7. Services read and write MongoDB via Prisma.
8. Some actions also create notifications, upload images, or enforce platform config rules.

### Auth flow

Arcetis uses two auth layers:

- Arcetis JWT auth for the actual application session
- NextAuth only for Google OAuth session exchange

Email/password flow:

1. User calls `/api/auth/register` or `/api/auth/login`.
2. `auth.service.ts` creates or verifies the account.
3. The server signs a JWT with `userId`, `email`, and `role`.
4. The client stores that token in local storage and cookie.

Google flow:

1. User starts Google sign-in with NextAuth.
2. NextAuth stores a temporary Google session.
3. `/api/auth/google/exchange` reads that session server-side.
4. `loginWithGoogleUser()` creates or links the Arcetis user record.
5. The app then issues the normal Arcetis JWT and stores it like a regular login.

Backoffice auth is intentionally separate at the browser-storage level:

- frontoffice token key: `arcetis_token`
- backoffice token key: `arcetis_backoffice_token`

That keeps player and admin sessions isolated even though they now live in one deployed app.

### Route protection

- `src/middleware.ts` handles coarse redirects for auth and backoffice sections.
- `RouteShell` wraps protected frontoffice routes with the shared app shell.
- `ProtectedAdmin` guards embedded backoffice dashboard routes and rejects non-admin users.

## Frontoffice

The player-facing routes live in `apps/frontend/src/app` and are backed by hooks in `apps/frontend/src/hooks`.

### Main screens

- `/login`, `/register`
  - email/password auth
  - Google sign-in entry points
- `/dashboard`
  - level progress
  - daily earned stats
  - top rewards
  - quick access to daily and sponsored tasks
- `/tasks`
  - quest catalog with category and state filters
  - proof submission history
- `/tasks/[id]`
  - detailed quest view
  - link out to task
  - proof submission form when required
- `/spin`
  - weighted daily spin wheel
  - cooldown and level gating
- `/rewards`, `/rewards/[id]`
  - reward catalog
  - redemption entry point
- `/referrals`
  - referral code stats
  - one-time referral code application
- `/profile`
  - account settings
  - sponsor request creation
  - sponsor request history
  - leaderboard view

### Frontoffice behavior

- React Query is the main client-side data layer.
- Notifications are polled every 30 seconds.
- Shared UI uses Tailwind and shadcn-style primitives from `src/components/ui`.
- The shell prefetches the main app routes and core data after sign-in.

## Embedded Backoffice

The new admin experience is embedded inside the active Next app under `/backoffice/*`.

### Main screens

- `/backoffice`
  - admin landing page for the embedded backoffice
- `/backoffice/login`
  - admin login
  - Google admin sign-in
- `/backoffice/dashboard`
  - overview cards and links into admin sections
- `/backoffice/dashboard/quests`
  - create quests
  - upload quest images
  - view quest catalog
- `/backoffice/dashboard/sponsors`
  - review sponsor requests
  - accept and publish sponsored quests
  - reject with review notes
- `/backoffice/dashboard/products`
  - create rewards
  - upload reward images
  - update stock and metadata
  - delete products if there are no pending redemptions
- `/backoffice/dashboard/users`
  - inspect user list
  - open per-user metrics
- `/backoffice/dashboard/admins`
  - create admin accounts
- `/backoffice/dashboard/config`
  - edit global limits
  - edit spin wheel items as JSON

### Backoffice behavior

- Embedded backoffice pages use hooks from `apps/frontend/src/backoffice/hooks`.
- Those hooks still talk to the same internal `/api` surface.
- Admin-only server authorization is enforced by `requireAdmin()` in the API layer, not only by UI routing.

## API Surface

The active API is centralized in `apps/frontend/src/app/api/[[...path]]/route.ts`.

### Public or session-establishing routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/register` | Create account and return JWT |
| `POST` | `/api/auth/login` | Log in and return JWT |
| `POST` | `/api/auth/google/exchange` | Exchange NextAuth Google session for Arcetis JWT |

### Authenticated user routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth/me` | Current user summary |
| `GET` | `/api/user/profile` | Full profile payload |
| `GET` | `/api/user/stats` | Progress, daily totals, leaderboard |
| `PATCH` | `/api/user/settings` | Email, username, password updates |
| `GET` | `/api/quests` | Quest catalog |
| `GET` | `/api/quests/:id` | Quest detail |
| `POST` | `/api/quests/complete` | Complete non-proof quest |
| `POST` | `/api/quests/submit-proof` | Submit proof for manual review |
| `GET` | `/api/quests/submissions` | User proof submission history |
| `GET` | `/api/rewards` | Reward catalog |
| `GET` | `/api/rewards/:id` | Reward detail |
| `POST` | `/api/rewards/redeem` | Create pending redemption |
| `GET` | `/api/referral/stats` | Referral summary |
| `POST` | `/api/referral/use` | Apply one referral code |
| `GET` | `/api/spin/status` | Spin cooldown, requirements, items |
| `POST` | `/api/spin/play` | Execute weighted spin |
| `GET` | `/api/sponsor-requests/me` | User sponsor request history |
| `POST` | `/api/sponsor-requests` | Submit sponsor request |
| `GET` | `/api/notifications` | Latest notifications |
| `PATCH` | `/api/notifications/read-all` | Mark all read |
| `PATCH` | `/api/notifications/:id/read` | Mark one notification read |

### Admin routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/users` | List users |
| `GET` | `/api/admin/users/:id/stats` | User metrics |
| `POST` | `/api/admin/users/admin` | Create admin user |
| `GET` | `/api/admin/config` | Read platform config |
| `PATCH` | `/api/admin/config` | Update platform config |
| `POST` | `/api/admin/quest` | Create quest |
| `GET` | `/api/admin/quest-submissions` | Reviewable proof queue |
| `PATCH` | `/api/admin/quest-submission/:id` | Approve or reject proof |
| `GET` | `/api/admin/sponsor-requests` | Sponsor request queue |
| `PATCH` | `/api/admin/sponsor-request/:id` | Accept or reject sponsor request |
| `GET` | `/api/admin/rewards` | List all rewards |
| `GET` | `/api/admin/reward/:id` | Reward detail with admin stats |
| `POST` | `/api/admin/reward` | Create reward |
| `PATCH` | `/api/admin/reward/:id` | Update reward |
| `DELETE` | `/api/admin/reward/:id` | Delete reward |
| `GET` | `/api/admin/redemptions` | Review redemptions |
| `PATCH` | `/api/admin/redemption/:id` | Approve or reject redemption |
| `POST` | `/api/admin/upload/quest-image` | Upload quest image |
| `POST` | `/api/admin/upload/reward-image` | Upload reward image |

### Webhook route

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/webhooks/sponsored/verify` | External approve/reject of sponsored proof submissions |

## Core Domain Rules

These rules live mostly in `apps/frontend/src/server/services/*` and `platformConfig.service.ts`.

### Progression

- Users earn both XP and points.
- Level is derived from XP.
- Level thresholds are hard-coded up to level 6, then scale by formula.
- Daily login updates streak and awards bonus XP and points.

Current level table:

| Level | Required XP |
| --- | --- |
| 1 | 0 |
| 2 | 150 |
| 3 | 350 |
| 4 | 650 |
| 5 | 1100 |
| 6 | 1700 |

From level 7 onward the code adds `floor(100 * level^1.5)` per level.

### Quest system

Quest categories:

- `DAILY`
- `SOCIAL`
- `SPONSORED`

Important behaviors:

- social quests are capped per day
- non-sponsored quests can only be completed once per day
- sponsored quests can only be completed once ever
- some quests require manual proof
- Instagram social quests require two proofs
- sponsored and proof-required quests create `QuestSubmission` records and wait for review

### Sponsor workflow

1. A user submits a sponsor request from `/profile`.
2. The request is stored as `pending`.
3. Admins receive notifications.
4. Backoffice accepts or rejects the request.
5. On acceptance, a real `Quest` is created automatically with category `SPONSORED`.
6. The request stores the published quest ID for traceability.

### Reward workflow

1. User requests a reward redemption.
2. Points are deducted immediately and stock is decremented immediately.
3. Redemption is stored as `pending`.
4. Admin reviews it.
5. If rejected, points are refunded and stock is restored.

### Referral workflow

- A user can apply one referral code once.
- Self-referral is blocked.
- Per-referrer daily referral usage is capped.
- The referrer reward is delayed until the referred user reaches the configured level threshold.

### Spin wheel

- Spin is weighted, not evenly random.
- Default spin items live in `platformConfig.service.ts`.
- Admins can replace spin items through backoffice config JSON.
- Cooldown and minimum level are configurable.

### Notifications

Notifications are stored in the database and power:

- proof submission review feedback
- admin review queues
- redemption review feedback
- sponsor request review feedback
- system messages

## Data Model

The schema in `prisma/schema.prisma` uses MongoDB and centers around these models:

| Model | Purpose |
| --- | --- |
| `User` | Accounts, auth identity, points, XP, level, referrals, admin role |
| `Quest` | Task definition and reward values |
| `QuestCompletion` | Final quest completion record |
| `QuestSubmission` | Manual proof review queue |
| `SponsorRequest` | User-submitted campaign proposal that may become a sponsored quest |
| `Reward` | Redeemable product or digital reward |
| `Redemption` | Reward redemption review state |
| `Referral` | Referrer-to-referred relationship and payout status |
| `Notification` | In-app notifications |
| `PlatformConfig` | Global caps, cooldowns, referral tuning, spin setup |
| `PointsTransaction` | Auditable points movement |
| `XPTransaction` | Auditable XP movement |

The most important relationships are:

- `User` -> many `QuestCompletion`, `QuestSubmission`, `Redemption`, `Notification`
- `User` -> self-relation for `referredBy` and `referrals`
- `SponsorRequest` -> optional published `Quest`
- `Reward` -> many `Redemption`

## Storage and Assets

The active app supports two image storage modes:

- production-friendly mode: Vercel Blob via `BLOB_READ_WRITE_TOKEN`
- local development fallback: `public/uploads/*`

That logic lives in `apps/frontend/src/server/storage.ts`.

The legacy Express app instead serves uploads from `apps/backend/uploads` via static middleware.

## Environment Variables

The repo currently uses more than one env location.

### Active app env files

- `apps/frontend/.env.local`
  - used by Next.js runtime
  - example file exists at `apps/frontend/.env.local.example`
- `.env` at repo root
  - used by Prisma CLI commands because the frontend workspace scripts call `dotenv -e ../../.env`

In practice, shared values like `DATABASE_URL` and `JWT_SECRET` should be kept aligned in both places.

### Active app variables

| Variable | Required | Used for |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Prisma MongoDB connection |
| `JWT_SECRET` | Yes | Arcetis JWT signing |
| `AUTH_SECRET` | Yes for Google flow | NextAuth session signing |
| `NEXTAUTH_URL` | Yes for Google flow | NextAuth callback base |
| `AUTH_GOOGLE_ID` | Optional unless using Google login | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Optional unless using Google login | Google OAuth client secret |
| `ADMIN_EMAILS` | Optional but important | Auto-assign admin role during registration or Google sync |
| `WEBHOOK_SHARED_SECRET` | Optional unless using webhook | Shared secret for sponsored verification webhook |
| `BLOB_READ_WRITE_TOKEN` | Optional | Persistent uploads on Vercel |

### Legacy app variables

Standalone backoffice:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_FRONTOFFICE_URL`

Standalone backend:

- `PORT`
- `CLIENT_URL`
- plus the shared database and JWT variables

## Local Development

### Recommended path: active consolidated app

Run from the repo root.

1. Install dependencies.

```powershell
npm install
```

2. Create the frontend runtime env file.

```powershell
Copy-Item apps/frontend/.env.local.example apps/frontend/.env.local
```

3. Create the root Prisma env file.

```powershell
Copy-Item apps/frontend/.env.local.example .env
```

4. Fill in real values, especially:

- `DATABASE_URL`
- `JWT_SECRET`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- optional Google OAuth credentials

5. Generate Prisma client.

```powershell
npm run prisma:generate
```

6. Push the schema to MongoDB.

```powershell
npm run prisma:migrate
```

7. Seed sample data.

```powershell
npm run prisma:seed
```

8. Start the app.

```powershell
npm run dev
```

### Active app URLs

- frontoffice: `http://localhost:3000`
- embedded backoffice: `http://localhost:3000/backoffice`
- health: `http://localhost:3000/api/health`
- NextAuth Google callback base: `http://localhost:3000/api/next-auth`

### Optional path: run the legacy split apps

### Legacy backend

```powershell
Set-Location apps/backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Default URL: `http://localhost:4000`

### Legacy backoffice

```powershell
Set-Location apps/backoffice
npm install
Copy-Item .env.example .env.local
npm run dev
```

Default URL: `http://localhost:3002`

That legacy backoffice expects the legacy Express API to be running.

## Seed Data

The active seed script lives at `apps/frontend/src/server/seed.ts`.

It currently:

- ensures `PlatformConfig` exists
- creates or updates a fixed admin account
- clears and recreates quests
- clears and recreates rewards
- clears related submissions, completions, sponsor requests, and redemptions

Because it deletes existing quest- and reward-related data, treat it as a reset/bootstrap tool.

## Where To Start Reading The Code

If you want the fastest path to understanding the system, start here:

1. `apps/frontend/src/app/api/[[...path]]/route.ts`
   - shows the entire active API surface in one file
2. `apps/frontend/src/server/services/*.ts`
   - contains the real business rules
3. `prisma/schema.prisma`
   - shows the persistent model
4. `apps/frontend/src/hooks/usePlatform.ts`
   - shows what the frontoffice actually calls
5. `apps/frontend/src/backoffice/hooks/useAdmin.ts`
   - shows what the embedded admin UI actually calls
6. `apps/frontend/src/app/*`
   - shows the player and admin page flows
7. `apps/backend/src/app.ts`
   - useful only if you need to understand the older Express implementation

## Known Caveats

These are important if you plan to keep evolving the project.

- The active app and legacy backend duplicate a lot of business logic.
- Root workspace scripts do not manage the legacy apps.
- There are no automated tests guarding the migration.
- Middleware currently treats `/` as a protected frontoffice route even though `src/app/page.tsx` is written like a public landing page.
- The current Next API does not carry over the Express rate limiter that exists in `apps/backend`.
- The repo contains committed build output and legacy upload assets under `apps/backend/dist` and `apps/backend/uploads`.

## Bottom Line

This repository is best understood as "Arcetis after a consolidation pass." The real product now lives in one Next.js app, but the old Express API and old standalone admin still remain as reference implementations. If you are extending the platform today, start in `apps/frontend`, treat `prisma/schema.prisma` as the shared contract, and use the legacy folders only when you need migration context or want to compare behavior.
