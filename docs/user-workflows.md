# User Workflows

## Primary MVP Workflow

1. Owner/admin signs in.
2. Owner/admin creates farms.
3. Owner/admin creates manager users.
4. Owner/admin assigns managers to farms.
5. Owner/admin or assigned manager creates land blocks.
6. Owner/admin or assigned manager creates crop seasons for land blocks.
7. Manager opens the daily report flow for an assigned farm and crop season.
8. Manager saves draft or submits the end-of-day report.
9. System creates linked operational records for labor, expenses, inventory usage, irrigation, input usage, and crop activity.
10. Manager records harvests.
11. Manager records sales.
12. Owner/admin reviews dashboard, reports, revenue, expenses, labor, inventory, activity, and profit/loss.

## Authentication Workflow

1. User opens the login page.
2. User submits email and password.
3. Server validates credentials.
4. On success, the session stores user identity and role.
5. Middleware protects private routes.
6. User is routed to dashboard or the first accessible module.
7. On failure, the login page shows a clear error without exposing sensitive details.

## Owner/Admin Setup Workflow

1. Owner/admin creates or edits farms.
2. Owner/admin creates manager users.
3. Owner/admin assigns each manager to one or more farms.
4. Owner/admin configures categories, units, and notification preferences.
5. Owner/admin verifies that manager access is limited to assigned farms.

## Farm and Land Workflow

1. User opens Farms or Land Blocks.
2. System filters visible records by role and farm access.
3. Owner/admin can create or edit any farm and block.
4. Manager can create or edit blocks only for assigned farms.
5. Changes are validated with Zod before database writes.
6. The updated farm/block appears in list, detail, and downstream crop season forms.

## Crop Season Workflow

1. User selects an accessible land block.
2. User creates a crop season with crop name, variety, start date, and status.
3. User updates season status as work progresses.
4. System displays related daily reports, expenses, harvests, sales, and profit/loss summaries.
5. Closed or harvested seasons remain reportable.

## Daily Report Workflow

1. Manager selects assigned farm, land block, and crop season.
2. Manager enters report date and field notes.
3. Manager records crop activities performed during the day.
4. Manager records labor attendance, worker type, wage data, and payment details.
5. Manager records expenses and optional receipt files.
6. Manager records irrigation and input usage.
7. System validates that used inventory is available.
8. Manager saves the report as draft or submits it.
9. Draft reports remain editable by the manager.
10. Submitted reports create linked labor, expense, inventory movement, irrigation/input, and activity records.
11. Submitted report data appears in dashboard, reports, labor, expenses, inventory, crop season, and activity views.

## Labor Workflow

1. User creates workers and worker classifications.
2. Manager records attendance and wage details through daily reports.
3. Labor module lists workers, attendance records, wages, paid amounts, and balances.
4. Owner/admin reviews labor totals by farm, crop season, worker, and date range.

## Expense Workflow

1. User creates expense directly or through a daily report.
2. User selects farm, optional block/crop season, category, amount, payment status, and date.
3. User attaches receipt where available.
4. System validates amount, access, and file requirements.
5. Expense appears in expense list, dashboard, reports, and crop season profit/loss.

## Inventory Workflow

1. User creates inventory items for a farm.
2. User records stock purchases or adjustments.
3. Manager records input usage in daily reports.
4. System creates inventory movement records.
5. Stock decreases on usage and increases on purchase.
6. Low-stock alerts appear when quantity reaches threshold.

## Harvest and Sales Workflow

1. Manager records harvest quantity, unit, date, and notes for a crop season.
2. Manager records sale quantity, buyer, unit price, received amount, and date.
3. System calculates revenue and receivables.
4. Owner/admin reviews revenue by crop season, land block, farm, and date range.

## Dashboard and Reports Workflow

1. User opens dashboard.
2. System loads accessible farms based on role and assignment.
3. User filters by farm, block, crop season, and date range.
4. Dashboard shows KPIs, charts, low-stock alerts, labor totals, expenses, revenue, and profit/loss.
5. User opens reports for deeper tables and CSV export.

## File Upload Workflow

1. User selects a JPG, PNG, WEBP, or PDF file.
2. Server validates type and size.
3. File is stored under `public/uploads`.
4. File path is linked to the relevant daily report or expense.
5. User can replace or delete the attachment if permitted.

## Error and Empty-State Workflow

1. Validation errors are shown near the related form field.
2. Permission errors block the action and show a simple access-denied message.
3. Empty lists show a clear empty state and a permitted next action.
4. Unexpected server errors are logged and shown as safe generic messages.
