# Tutor App — Project Structure & Setup

## 1. Bootstrap

```bash
pnpm create next-app@latest tutor-app \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd tutor-app

# UI components
pnpm dlx shadcn@latest init

# Database
pnpm add prisma @prisma/client
pnpm add -D prisma
npx prisma init

# Auth
pnpm add next-auth@beta @auth/prisma-adapter

# CSV export
pnpm add papaparse
pnpm add -D @types/papaparse
```

---

## 2. Environment variables

```bash
# .env.local
DATABASE_URL="postgresql://..."        # from Neon dashboard
AUTH_SECRET="run: npx auth secret"    # NextAuth session secret
AUTH_URL="http://localhost:3000"
```

Neon: create a project at neon.tech → copy the connection string → paste as DATABASE_URL.

---

## 3. Folder structure

```
tutor-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx          # Login form
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx            # Nav sidebar + mobile bottom bar
│   │   │   ├── page.tsx              # Redirects to /log
│   │   │   │
│   │   │   ├── log/
│   │   │   │   └── page.tsx          # Handover log — home screen
│   │   │   │
│   │   │   ├── ledger/
│   │   │   │   ├── page.tsx          # Monthly summary + export
│   │   │   │   ├── income/
│   │   │   │   │   └── page.tsx      # Log student income
│   │   │   │   ├── expenses/
│   │   │   │   │   └── page.tsx      # Log expenses
│   │   │   │   └── tutors/
│   │   │   │       ├── page.tsx      # All tutor pay periods
│   │   │   │       └── [tutorId]/
│   │   │   │           └── page.tsx  # Single tutor pay history
│   │   │   │
│   │   │   └── timetable/
│   │   │       ├── page.tsx          # Weekly grid view
│   │   │       ├── terms/
│   │   │       │   ├── page.tsx      # List/create terms
│   │   │       │   └── [termId]/
│   │   │       │       └── page.tsx  # Edit term + class slots
│   │   │       └── sessions/
│   │   │           └── [sessionId]/
│   │   │               └── page.tsx  # Session detail + attendance
│   │   │
│   │   └── api/
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts      # NextAuth handler
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn auto-generated components
│   │   │
│   │   ├── log/
│   │   │   ├── NoteForm.tsx          # Add note (paste-friendly textarea + tag picker)
│   │   │   └── NoteList.tsx          # Feed of notes, action button per item
│   │   │
│   │   ├── ledger/
│   │   │   ├── IncomeForm.tsx
│   │   │   ├── ExpenseForm.tsx
│   │   │   ├── TutorPayCard.tsx      # Shows period, hours, total, mark-paid button
│   │   │   └── ExportButton.tsx      # CSV export for accountant
│   │   │
│   │   └── timetable/
│   │       ├── WeekGrid.tsx          # Mon–Sat columns
│   │       ├── SessionCard.tsx       # Single session in the grid
│   │       └── AttendanceRow.tsx     # p / x / p/x / CR per student
│   │
│   ├── actions/                      # Server Actions (no separate API needed)
│   │   ├── log.ts                    # createNote, actionNote
│   │   ├── ledger.ts                 # createIncome, createExpense, createPayPeriod, markPaid
│   │   └── timetable.ts             # createTerm, generateSessions, updateAttendance
│   │
│   └── lib/
│       ├── prisma.ts                 # Prisma client singleton
│       ├── auth.ts                   # NextAuth config (credentials provider)
│       ├── pay.ts                    # Tutor pay calculation logic
│       └── utils.ts                  # cn(), date helpers, slot duration calc
│
├── prisma/
│   └── schema.prisma
│
├── .env.local
├── next.config.ts
└── tailwind.config.ts
```

---

## 4. Key patterns to know

### Prisma singleton (`src/lib/prisma.ts`)
Next.js hot-reloads in dev, which creates multiple Prisma instances and exhausts DB connections. This pattern fixes it:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["query"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Server Actions (`src/actions/log.ts`)
No need for separate API routes for mutations — call server functions directly from forms:

```typescript
"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createNote(formData: FormData) {
  const content = formData.get("content") as string;
  const tag = formData.get("tag") as NoteTag;

  await prisma.note.create({ data: { content, tag } });
  revalidatePath("/log"); // re-fetches the note list server-side
}
```

### Server Components (fetch data, no useEffect)
Pages that just display data should be async Server Components:

```typescript
// src/app/(dashboard)/log/page.tsx
import { prisma } from "@/lib/prisma";

export default async function LogPage() {
  const notes = await prisma.note.findMany({
    where: { actioned: false },
    orderBy: { createdAt: "desc" },
  });
  return <NoteList notes={notes} />;
}
```

### Auth (`src/lib/auth.ts`)
Single shared login — one hardcoded user in env vars for v1:

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { password: { label: "Password", type: "password" } },
      authorize(credentials) {
        if (credentials.password === process.env.APP_PASSWORD) {
          return { id: "1", name: "Admin" };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: "/login" },
});
```

Add `APP_PASSWORD` to `.env.local`. No user table needed for v1.

---

## 5. Run it

```bash
# Push schema to Neon
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start dev server
pnpm dev
```

Open `http://localhost:3000` — you'll be redirected to `/login`.

---

## 6. Build order (suggested)

1. **Auth** — login page + middleware to protect routes. Nothing else is useful without this.
2. **Handover Log** — simplest module. Teaches you Server Actions + revalidatePath + Server Components in one go.
3. **Tutors & Students** — CRUD pages (just forms + lists). Foundation for everything else.
4. **Payment Ledger** — income, expenses, tutor pay periods + CSV export.
5. **Timetable** — terms → generate sessions → weekly grid → attendance marking.
