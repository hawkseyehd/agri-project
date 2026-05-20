# Acceptance Criteria

## MVP-Wide Criteria

- MVP scope and exclusions are documented without V1/V2 ambiguity.
- Owner/admin and manager permissions are enforced on the server.
- Managers can access only assigned farms and related records.
- Pages render UI only; business rules live in services, form submissions in server actions, database reads in queries, validation in Zod validators, and persistence in Prisma.
- App works on desktop, tablet, and mobile browser.
- Empty states, loading states, validation errors, and permission errors are handled consistently.
- Production deployment, environment variables, backups, and setup docs are available before first real farm testing.

## Authentication and Permissions

- User can sign in with valid credentials.
- Invalid credentials show a safe error message.
- Protected routes redirect or block unauthenticated users.
- Owner/admin can access all modules.
- Manager cannot access user management or unassigned farm data.
- Permission helpers are used by server actions, services, queries, and upload routes.

## Farms and Land Blocks

- Owner/admin can create and edit farms.
- Owner/admin can assign managers to farms.
- Owner/admin and assigned managers can create and edit land blocks.
- Managers see only assigned farms and related land blocks.
- Farm and land block forms validate required fields before saving.

## Crop Seasons

- Crop seasons can be created for accessible land blocks.
- Crop season status can move through planned, active, harvested, and closed states.
- Crop season detail views show related activity, expense, harvest, sales, and profit/loss summaries.
- Managers cannot create or edit crop seasons for unassigned farms.

## Daily Reports

- Manager can open one end-of-day report flow for an assigned farm/crop season.
- Manager can save a draft report.
- Manager can submit a complete report.
- Draft and submitted statuses work.
- Submitted report creates linked labor, expense, inventory usage, irrigation/input usage, and activity records.
- Submitted report updates dashboard and reports.
- Manager does not need to visit separate labor, expense, and inventory modules to complete the day-end workflow.

## Labor

- Workers can be created and edited.
- Attendance records entered through daily reports appear in the labor module.
- Wage totals, paid amounts, and balances are accurate.
- Labor summaries can be filtered by farm, worker, crop season, and date range where applicable.

## Expenses

- Expenses can be created, edited, and listed.
- Expenses can link to farm, optional land block/crop season, category, and receipt.
- Payment status is visible.
- Expense summaries match stored records.
- Managers cannot view or modify expenses for unassigned farms.

## Inventory

- Inventory items can be created for farms.
- Stock increases on purchase or adjustment.
- Stock decreases after input usage.
- Daily report usage creates inventory movement records.
- Low-stock alerts appear at or below configured thresholds.
- Stock cannot be consumed from farms the user cannot access.

## Harvest and Sales

- Harvest can be recorded against a crop season.
- Sale can be recorded against a crop season and optionally a harvest.
- Revenue and receivable calculations are accurate.
- Harvest and sales summaries appear in dashboard and reports.
- Managers cannot record harvests or sales for unassigned farms.

## Dashboard and Reports

- Dashboard shows live summaries for accessible farms.
- Owner/admin sees portfolio-level totals.
- Manager sees assigned-farm totals only.
- Profit/loss is calculated by crop season, land block, and farm.
- Reports show financial and operational data.
- Filters return correct scoped data.
- CSV export works for supported reports.

## Settings

- Owner/admin can create managers.
- Owner/admin can manage categories and units.
- Profile can be updated.
- Managers cannot access user management.
- Notification preferences can be configured where implemented.

## File Uploads

- JPG, PNG, WEBP, and PDF uploads work.
- Invalid file types are rejected.
- Oversized files are rejected.
- Files are stored under `public/uploads` for MVP.
- Files can be linked to daily reports and expenses.
- Uploaded files can be replaced or deleted by permitted users.

## QA and Documentation

- Core authentication, permissions, CRUD, daily report, inventory deduction, upload, dashboard, and reporting flows are covered by the testing checklist.
- E2E tests cover the owner setup flow and manager daily report flow.
- Setup docs allow a new developer to install, configure, migrate, seed, and run the app.
- Owner and manager guides explain the workflows each role can perform.
