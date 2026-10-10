# PRD — Tutoring Business Management App

**Version:** 0.1 (v1 scope)  
**Author:** Sharon Park  
**Last updated:** June 2026

---

## 1. Problem Statement

A small tutoring business (2 owner-operators + <10 tutors, ~50 students) runs entirely on manual processes: Excel timetables, phone messages, verbal handovers, and unrecorded payments. The core pain points are:

- **Missed information:** Dad (tutor + message-receiver) and Mum (admin) work different hours. Messages and enquiries get lost in handover.
- **Payment errors:** Tutor payments are calculated manually and sometimes sent at the wrong amount or not recorded.
- **Tax burden:** Financial records aren't maintained during the year, forcing a painful full-year reconciliation every July.

The goal is a simple, mobile-friendly web app that eliminates these three problems — nothing more for v1.

---

## 2. Users

| User | Role | Primary device |
|---|---|---|
| Dad | Tutor + message handler | Mobile (on the go) |
| Mum | Admin + finances | Desktop/tablet |

**v1 auth:** Single shared login. No tutor-facing access.  
**v2:** Separate parent logins; optional tutor logins (view own schedule).

---

## 3. v1 Modules

### 3.1 Handover Log

**Purpose:** Replace the verbal/written handover between Dad and Mum with a shared, timestamped feed.

**Key behaviours:**
- Add a note in as few taps as possible — home screen on mobile
- Full paste support (copy SMS/WhatsApp message → paste → tag → done)
- Tags: `Enquiry` / `Payment` / `Sick/Absent` / `Tutor` / `General`
- Notes are timestamped and listed newest-first
- Mum can mark a note as "Actioned" to clear it from the active feed
- No threading, no replies — it's a log, not a chat

**What it is not:** A messaging platform. It's a one-way activity feed from the business day.

---

### 3.2 Payment Ledger

**Purpose:** Accurate, real-time record of all money in and out — replacing the end-of-year receipt scramble.

#### Tutor Payments (outgoing)

- Each tutor has a stored **hourly rate**
- To log a payment: select tutor → enter hours worked → app calculates total → Dad/Mum confirms → mark as paid
- Payment periods are **weekly or fortnightly** (configurable per tutor once confirmed)
- A "pending" state shows unpaid periods; a "paid" state closes them
- Running total per tutor per period visible at a glance

#### Student Fees (incoming)

- Log a fee receipt: student name → amount → payment method (cash / bank transfer) → date → payment type tag (`Term` / `Trial` / `Partial`)
- No billing calculation — the system records what was paid, not what is owed
- Trial sessions are just a `Trial`-tagged income entry; no special case needed
- No invoice generation in v1 — just the record

#### Expenses

- Quick log: description → amount → category (Rent / Supplies / Software / Other) → date

#### Reporting

- Monthly summary: total income, total tutor costs, total expenses, net
- **Export to CSV** — one click, handed to accountant in July
- Filter by month or custom date range

---

### 3.3 Timetable

**Purpose:** Single source of truth for the weekly class schedule, replacing the Excel spreadsheet.

**Concepts:**
- **Term:** A named period with a start date and end date (custom, not school-aligned). Creating a term generates all weekly sessions automatically.
- **Class slot:** Day of week + start/end time + subject/class name + type (Group or Private)
- **Session:** A specific instance of a class slot on a given date. Has an assigned tutor and enrolled students.

**v1 behaviour:**
- Enter term dates + class slots → sessions are auto-generated
- View as a weekly grid (Mon–Sat, with Sunday hidden)
- Each session shows: subject, time, tutor name, student count
- Tutor or student on a session can be overridden for that week (without affecting the rest of the term)
- Saturday hours: 9am–12pm. Weekday hours: 4:30pm–7:30pm (used as defaults, editable)

**v1 limitations (intentional):**
- No drag-and-drop rescheduling
- No student attendance tracking
- No automated tutor conflict detection

---

## 4. Data Model (high-level)

```
Tutor
  id, name, phone, hourly_rate, pay_period (weekly | fortnightly)

Student
  id, name, type (group | private), year_level, contact_phone

ClassSlot
  id, subject, type (group | private), day_of_week, start_time, end_time

Term
  id, name, start_date, end_date

Session                          ← generated from Term + ClassSlot
  id, term_id, class_slot_id, date, tutor_id
  SessionStudent: session_id, student_id

Note                             ← Handover Log
  id, content, tag, created_at, actioned (bool)

PaymentRecord
  id, type (income | expense | tutor_payment), amount, date,
  category, tutor_id?, student_id?, notes, status (pending | paid)

TutorPayPeriod
  id, tutor_id, period_start, period_end,
  total_hours, total_amount, status (pending | paid), paid_at?
```

---

## 5. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | Unified FE + BE, React, TypeScript — maps to existing skills |
| Hosting | **Vercel** | Zero-config deploys, free tier, preview URLs on every PR |
| Database | **Neon** (serverless Postgres) | Native Vercel integration, free tier, real SQL |
| ORM | **Prisma** | Type-safe, great TS DX, schema-first |
| Auth | **NextAuth v5 (Auth.js)** | Simple credentials auth for v1; extensible for v2 |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, accessible, mobile-friendly components |
| CSV export | **papaparse** | Lightweight, runs client-side |

**Local dev:** `pnpm` + Neon dev branch (or local Postgres via Docker).

---

## 6. Out of Scope (v1)

| Feature | Reason |
|---|---|
| Tutor-facing login | Adds permissions complexity — not needed yet |
| Banking integration | API complexity + compliance overhead; CSV export is sufficient |
| ATO lodgement | Accountant handles this; categorised CSV is the input they need |
| Student attendance | Not a stated pain point |
| SMS/WhatsApp integration | Paste workflow is fast enough; API adds cost + complexity |
| Invoice generation | Small scale; not requested |
| Drag-and-drop scheduling | Nice to have; out for simplicity |

---

## 7. v2 Ideas (not committed)

- Separate Mum/Dad logins
- Tutor portal: view own schedule
- Recurring expense entries (e.g. rent every month)
- Email digest: daily summary to Mum before she arrives
- Xero/MYOB export (accountant-friendly format)
- Student enrolment management per term

---

## 8. Open Questions

- [x] Pay period: **fortnightly**
- [x] Student payments: **record amount only** — no billing logic. Tag as Term / Trial / Partial.
- [x] Trials = one-session payment, handled as a Trial-tagged income entry
