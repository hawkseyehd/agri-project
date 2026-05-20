# Labour Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the basic worker list with a farm-scoped labour registry that supports individuals, teams, salary attendance, temporary report selection, per-acre team costing, and archive/history behavior.

**Architecture:** Extend the existing `Worker` model into the active labour registry, add `LaborHistory` for archived snapshots, and add richer metadata fields for individual/team costing. Keep existing attendance records linked to `Worker` so old report data remains intact, while active lists exclude archived/expired entries.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/PostgreSQL, Zod, Vitest, Tailwind dashboard components.

---

### Task 1: Labour Domain Tests

**Files:**
- Modify: `tests/unit/labor.service.test.ts`
- Modify: `src/server/services/labor/labor.service.ts`

- [ ] Add tests proving active labour excludes archived records, salary individuals are attendance-eligible, temporary/daily-wage individuals are report-only, teams calculate per-acre cost, and history snapshots retain archived labour details.
- [ ] Run `pnpm exec vitest run tests/unit/labor.service.test.ts` and verify the new tests fail because fields/helpers do not exist yet.
- [ ] Implement the minimal labour service changes to pass.
- [ ] Run the same test and verify it passes.

### Task 2: Worker Validation

**Files:**
- Modify: `src/server/validators/worker.schema.ts`
- Create: `tests/unit/worker.schema.test.ts`

- [ ] Add tests for individual salary, individual daily wage, individual temporary dates, team per-acre rate, and team temporary dates.
- [ ] Run `pnpm exec vitest run tests/unit/worker.schema.test.ts` and verify failure.
- [ ] Implement Zod validation enums and cross-field rules.
- [ ] Run the worker schema tests and verify they pass.

### Task 3: Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] Add enums and fields for `LaborEntityKind`, `LaborEmploymentType`, `LaborCostUnit`, `LaborActivityType`.
- [ ] Add `archivedAt`, `archiveReason`, temporary date fields, salary/per-acre/team fields, and `LaborHistory`.
- [ ] Run `pnpm exec prisma validate`.
- [ ] Run `pnpm exec prisma generate` if validation succeeds.

### Task 4: Actions And Queries

**Files:**
- Modify: `src/server/actions/workers.actions.ts`
- Modify: `src/server/queries/labor.queries.ts`
- Modify: `src/server/services/labor/labor.service.ts`

- [ ] Parse new worker/team form fields in create/update actions.
- [ ] Add archive action that moves active labour into `LaborHistory` and marks it archived instead of deleting data.
- [ ] Before listing active labour, archive expired temporary labour/teams for accessible farms.
- [ ] Keep farm access checks for all mutations.

### Task 5: Labour UI

**Files:**
- Modify: `src/app/labor/page.tsx`

- [ ] Replace static labour rows with live overview data.
- [ ] Show active individuals, active teams, attendance eligibility, report availability, costing basis, start/end dates, and history.
- [ ] Add create forms for individual and team registry entries.
- [ ] Add archive buttons for active records.

### Task 6: Verification

- [ ] Run `pnpm exec vitest run tests/unit/labor.service.test.ts tests/unit/worker.schema.test.ts`.
- [ ] Run `pnpm exec prisma validate`.
- [ ] Run `pnpm exec tsc --noEmit --pretty false`.
- [ ] Smoke check `/labor` in the running dev server if compilation succeeds.

**Note:** `F:\Work\EgriProject` is not currently a Git repository, so this plan cannot be committed from this workspace.
