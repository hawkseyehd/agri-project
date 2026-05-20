# SaaS Tenancy Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert EgriProject from a single-owner farm app into a SaaS-ready app with tenant isolation, pending registration, super-admin approval, package tiers, and package-limited user management.

**Architecture:** Add tenant and subscription state to `User`/`Farm`, keep farm assignment as the per-farm access link, and centralize role/package decisions in `src/server/auth/permissions.ts`. Preserve existing pages while gating dashboard access for pending users and adding a super-admin-only dashboard for platform oversight.

**Tech Stack:** Next.js App Router, NextAuth credentials provider, Prisma/PostgreSQL, server actions, Vitest.

---

### Task 1: Schema And Permission Foundation

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/types/next-auth.d.ts`
- Modify: `src/server/auth/auth.ts`
- Modify: `src/server/auth/permissions.ts`
- Test: `tests/unit/permissions.test.ts`

- [ ] Add `SUPER_ADMIN`, `LAND_OWNER`, `PENDING_USER`, and `TENANT_USER` roles.
- [ ] Add `PackageTier` enum with `NONE`, `SILVER`, `GOLD`, `PLATINUM`.
- [ ] Add `subscriptionApprovedAt`, `packageTier`, and `ownerId` tenant fields needed for approval and scoping.
- [ ] Update session/JWT types so role and package travel with the session.
- [ ] Update permission helpers so only `SUPER_ADMIN` can access every tenant, `LAND_OWNER` can manage their own tenant, and pending users cannot open app modules.
- [ ] Update unit tests for super-admin, pending, package, and tenant-user behavior.
- [ ] Run `pnpm exec vitest run tests/unit/permissions.test.ts` and `pnpm exec prisma generate`.

### Task 2: Registration And Pending Flow

**Files:**
- Create: `src/server/validators/auth.schema.ts`
- Create: `src/server/actions/auth.actions.ts`
- Create: `src/app/register/RegisterForm.tsx`
- Create: `src/app/register/page.tsx`
- Create: `src/app/get-started/page.tsx`
- Modify: `src/app/login/LoginForm.tsx`
- Modify: `src/middleware.ts`

- [ ] Write a validator test for registration input.
- [ ] Add a register server action that creates `PENDING_USER` with `PackageTier.NONE`.
- [ ] Add `/register` form linked from login and landing.
- [ ] Add `/get-started` page explaining package selection and approval.
- [ ] Redirect pending users away from app modules to `/get-started`.
- [ ] Run targeted auth/validator tests and `pnpm exec tsc --noEmit --pretty false`.

### Task 3: Super Admin Dashboard And Approval

**Files:**
- Create: `src/server/queries/super-admin.queries.ts`
- Create: `src/server/actions/super-admin.actions.ts`
- Create: `src/app/super-admin/page.tsx`
- Modify: `src/components/layout/AppShell.tsx`

- [ ] Add a super-admin query listing users, package, approval status, farm counts, and role.
- [ ] Add server action for `SUPER_ADMIN` to update a pending user’s package/role/approval.
- [ ] Add `/super-admin` navigation only for `SUPER_ADMIN`.
- [ ] Allow `SUPER_ADMIN` to set pending users to pending, silver/gold/platinum land owner, or tenant user where applicable.
- [ ] Run targeted tests and build.

### Task 4: Tenant User Management

**Files:**
- Modify: `src/server/services/settings/settings.service.ts`
- Modify: `src/server/actions/settings/settings.actions.ts`
- Modify: `src/server/queries/settings/settings.queries.ts`
- Modify: `src/app/settings/page.tsx`
- Modify: `src/app/settings/_components/SettingsForms.tsx`

- [ ] Change current manager creation into tenant user creation for Gold/Platinum land owners.
- [ ] Enforce user caps: Gold 3, Platinum 5, Silver 0.
- [ ] Scope assignable farms to the land owner’s tenant.
- [ ] Hide user management from Silver and pending users.
- [ ] Keep super admin unrestricted.
- [ ] Run settings service tests or add focused unit tests if existing tests do not cover caps.

### Task 5: Tenant Scoping Across Existing Modules

**Files:**
- Modify query/action files under `src/server/queries/**` and `src/server/actions/**` that currently treat `OWNER`/`ADMIN` as global.

- [ ] Replace global `OWNER`/`ADMIN` checks with centralized helpers.
- [ ] Ensure `SUPER_ADMIN` sees all farms.
- [ ] Ensure `LAND_OWNER` sees only farms they own or are assigned.
- [ ] Ensure `TENANT_USER` sees only assigned farms.
- [ ] Ensure `PENDING_USER` sees no app data.
- [ ] Run `pnpm test`, `pnpm exec tsc --noEmit --pretty false`, and `pnpm build`.
