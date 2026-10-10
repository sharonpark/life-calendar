# Life Calendar — Project Structure & Setup

PRD: `/Users/spark/Downloads/life-calendar-prd.md`
Code: `/Users/spark/Desktop/repos/life-calendar-app`

Scaffolded and verified (typecheck + lint + `next build` all pass): Next.js 16 (App Router, `src/`), Tailwind v4, shadcn/ui, Prisma 7, NextAuth v5 (beta), R2 client. No database or third-party keys are wired up yet — see §5.

---

## 1. What's already built

- **Schema** (`prisma/schema.prisma`) — full data model from the PRD, with two deltas from the PRD's draft:
  - `visibility` moved from `Photo` to `DayEntry` (one choice per upload batch, per §3.3 of the PRD)
  - Added `Account`, `Session`, `VerificationToken`, `User.emailVerified` — required by `@auth/prisma-adapter` for magic-link (database session) auth
- **Auth** (`src/lib/auth.ts`, `src/actions/invites.ts`, `src/actions/accept-invite.ts`) — invite-gated magic link flow:
  1. Owner calls `createInvite(email, circles)` → creates an `Invite` row + emails a token link via Resend
  2. Invitee visits `/invite/[token]` → `acceptInvite` creates their `User` + `CircleMembership` rows, marks the invite used, signs them in
  3. Return visits go through `/login` → NextAuth's Resend/Email provider — **but** `sendVerificationRequest` is overridden to silently no-op if the email isn't already a `User` (this is what makes it invite-only rather than open sign-up)
- **Route protection** — `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`) does an optimistic cookie-presence check; `(dashboard)/layout.tsx` does the real `await auth()` check against the database. Split this way because database sessions require Prisma/`pg`, which can't run in the Edge runtime the proxy executes in.
- **Calendar route stub** — `(dashboard)/calendar/[[...date]]/page.tsx`, empty grid, ready for Phase 2 below.

## 2. Folder structure

```
life-calendar-app/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── invite/[token]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                     # auth gate + header
│   │   ├── calendar/[[...date]]/page.tsx  # month grid; add @modal/(.)day/[date] for Day Detail (Phase 2)
│   │   ├── availability/page.tsx          # not yet created (Phase 6)
│   │   └── settings/circles/page.tsx      # not yet created — owner invite/revoke UI (Phase 1, still open)
│   └── api/auth/[...nextauth]/route.ts
├── actions/
│   ├── invites.ts          # createInvite, revokeAccess (owner-only)
│   ├── accept-invite.ts
│   └── entries.ts          # not yet created (Phase 3) — createDayEntry, addPhotos
├── components/
│   ├── ui/                 # shadcn
│   └── {calendar,upload,availability,reactions,invites}/  # empty, ready for Phase 2+
├── lib/
│   ├── prisma.ts           # singleton, Prisma 7 driver-adapter pattern (see §4)
│   ├── auth.ts
│   └── r2.ts                # getPresignedUploadUrl, publicUrlFor
├── types/next-auth.d.ts    # session.user.id / isOwner augmentation
└── proxy.ts                 # renamed from middleware.ts (Next 16)
```

## 3. Environment variables

Copy `.env.local.example` → `.env.local` and fill in:

| Var | Source |
|---|---|
| `DATABASE_URL` | Neon dashboard, pooled connection string |
| `AUTH_SECRET` | `npx auth secret` |
| `NEXTAUTH_URL` | `http://localhost:3000` locally |
| `AUTH_RESEND_KEY`, `AUTH_EMAIL_FROM` | Resend dashboard — needs a verified sending domain |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL` | Cloudflare R2 dashboard — create bucket, API token, and a public bucket URL (or custom domain) |

None of these are provisioned yet — that's the next concrete step, see §5.

## 4. Key patterns to know

### Prisma 7 uses driver adapters, not a bundled engine binary
Prisma 7's TS client generator (`provider = "prisma-client"`, output `src/generated/prisma`) requires an explicit adapter — plain `new PrismaClient()` no longer works:

```typescript
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
```

Import models/enums from `@/generated/prisma/client`, not `@/generated/prisma` (no root barrel file in this generator).

### Invite-only magic link (`src/lib/auth.ts`)
Auth.js's Email/Resend provider normally creates a `User` on first click (sign-in doubles as sign-up). That's wrong for a closed app, so `sendVerificationRequest` is overridden to check `prisma.user.findUnique` first and no-op if the user doesn't exist yet. The only way to become a `User` is through `/invite/[token]`.

### Proxy (`src/proxy.ts`) can't touch the database
Auth.js database sessions need Prisma → `pg` → Node runtime. The proxy runs on the Edge runtime and can only do a cheap cookie-presence check. Real enforcement is `await auth()` in `(dashboard)/layout.tsx`, which does hit the database. Don't try to move the real check into the proxy — it'll break the build the same way the first draft did (`node:url` not supported in Edge Runtime).

### Server Actions, no separate API routes
Same pattern as tutor-app — `"use server"` functions in `src/actions/`, called directly from form `action` props, `revalidatePath` after writes.

## 5. Next steps, in order

1. **Provision services** — Neon project, R2 bucket + CORS policy (browser needs direct `PUT` access) + public bucket URL, Resend domain verification, Vercel project.
2. `npx prisma migrate dev --name init` once `DATABASE_URL` is real.
3. Seed the first owner user directly in the DB (`isOwner: true`) — there's no UI for creating the very first user, since everyone else comes through an invite that only an owner can send.
4. Build `(dashboard)/settings/circles/page.tsx` — the owner-only invite form (calls `createInvite`) and member list (calls `revokeAccess`). This is the last missing piece of Phase 1.
5. **Phase 2 — Calendar view**: month grid component, `DayEntry`/`Photo` fetch per visible month, Day Detail as an intercepting route (`@modal/(.)day/[date]/page.tsx`) per the plan discussed.
6. **Phase 3 — Photo upload**: presigned PUT via `getPresignedUploadUrl`, thumbnail generation — decide client-side canvas resize vs. server-side `sharp` (installed, unused so far) before writing this.
7. Then notes → circles filtering on read queries → availability → reactions → PWA manifest, per PRD §7.

## 6. Run it

```bash
cd life-calendar-app
pnpm install
npx prisma generate       # already run once; re-run after schema changes
npx prisma migrate dev    # once DATABASE_URL is real
pnpm dev
```
