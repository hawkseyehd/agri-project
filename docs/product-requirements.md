# Product Requirements

## Objective

Build a web-based agriculture management system for farm operations in Pakistan. The MVP lets managers record end-of-day farm activity and lets owners/admins review operational performance, expenses, labor, inventory, harvests, sales, and profit/loss.

## Target Users

| User | Purpose |
| --- | --- |
| Owner/Admin | Owns farm setup, manager access, financial review, reporting, settings, exports, and operational oversight. |
| Manager | Records daily field activity for assigned farms and keeps farm-level operational data current. |

## MVP Scope

The MVP includes:

- Credentials-based authentication and role-based access control.
- Owner/admin and manager roles.
- Farm and land block management.
- Crop season lifecycle tracking.
- Daily end-of-day reports.
- Labor workers, attendance, wages, and balances.
- Expenses, categories, payment status, and receipt attachment.
- Inventory items, stock movements, input usage, and low-stock alerts.
- Irrigation and input usage recorded through daily reports.
- Harvest and sales recording.
- Dashboard KPIs, operational summaries, and profit/loss reporting.
- Activity logs and basic notifications.
- Local file uploads for receipts and photos.
- Settings for users, categories, units, profile, and notification preferences.
- Documentation, testing checklist, deployment guidance, and first-farm handoff material.

## Explicit V1 Exclusions

The MVP does not include:

- Native mobile app.
- Farmer or laborer login.
- AI recommendations.
- Disease detection.
- IoT sensor integration.
- GPS mapping.
- Marketplace features.
- Mandi price integration.
- Offline mode.
- WhatsApp bot.
- Cloud object storage as the primary implementation. Local uploads are used for MVP; S3 or Cloudflare R2 is a future migration.

## Functional Requirements

### Authentication and Access

- Users can sign in with email/password credentials.
- Sessions expose the user's role and identity.
- Protected routes reject unauthenticated access.
- Owner/admin users can manage users and all farm data.
- Manager users can access only assigned farms and records connected to those farms.

### Farms and Land

- Owner/admin can create, edit, and review farms.
- Owner/admin can assign managers to farms.
- Owner/admin and assigned managers can create and edit land blocks for accessible farms.
- Land blocks store farm relationship, name, and area.

### Crop Seasons

- Owner/admin and assigned managers can create crop seasons for accessible land blocks.
- Crop seasons track crop, variety, start date, optional end date, and lifecycle status.
- Crop season views summarize related expenses, harvests, and activity.

### Daily Reports

- Managers can save a draft daily report for assigned farms/crop seasons.
- Managers can submit a completed end-of-day report.
- Submitted reports create or update linked labor, expense, inventory usage, irrigation, input usage, and crop activity records.
- Submitted reports are visible to owner/admin in dashboards and reports.

### Labor

- Workers can be created and edited.
- Attendance entered through daily reports appears in the labor module.
- Wage totals, paid amounts, and balances are calculated consistently.

### Expenses

- Expenses can be recorded against farm, land block, and/or crop season where applicable.
- Expenses support category, amount, date, payment status, notes, and receipt attachment.
- Owner/admin can review expense summaries by farm, block, crop season, and date range.

### Inventory

- Inventory items can be created for farms.
- Stock increases on purchase or adjustment.
- Stock decreases when inputs are used.
- Low-stock alerts appear when stock reaches configured thresholds.
- Daily report input usage creates inventory movement records.

### Harvest and Sales

- Harvests can be recorded against crop seasons.
- Sales can be recorded against harvests or crop seasons.
- Sales store buyer details, quantity, unit price, sale date, received amount, and receivable balance.
- Revenue summaries are available by farm, block, crop season, and date range.

### Dashboard and Reports

- Dashboard shows live summaries for accessible farms.
- Owner/admin can see whole-operation summaries.
- Managers see assigned-farm summaries only.
- Reports support filters and CSV export for core financial and operational views.
- Profit/loss is calculated by crop season, land block, and farm.

### Settings and Files

- Owner/admin can manage managers, categories, units, and notification preferences.
- Users can update their own profile where permitted.
- JPG, PNG, WEBP, and PDF uploads are accepted.
- Invalid file types and oversized files are rejected.
- Uploaded files can be linked to daily reports and expenses.

## Non-Functional Requirements

- Use Next.js, TypeScript, PostgreSQL, Prisma, Auth.js/NextAuth, Zod, React Hook Form, Tailwind CSS, shadcn/ui, Recharts, and TanStack Table.
- Keep business logic out of page components:
  - Page renders route UI.
  - Component handles reusable UI.
  - Server Action handles form submission.
  - Service handles business rules.
  - Query handles database fetching.
  - Validator handles Zod validation.
  - Prisma handles database access.
- UI must be responsive on desktop, tablet, and mobile browser.
- Data access must enforce role and farm assignment rules on the server.
- MVP file storage uses `public/uploads`; future storage should be documented for S3 or Cloudflare R2.

## MVP Success Criteria

- Owner/admin can set up users, farms, land blocks, and crop seasons.
- Manager can submit a complete end-of-day report without visiting multiple modules.
- Daily reports update dependent operational records.
- Owner/admin can review accurate dashboards, reports, revenue, expenses, labor, inventory, activity, and profit/loss.
- Managers cannot view or modify unassigned farm data.
- The app can be deployed with database configuration, backups, and basic operational documentation.
