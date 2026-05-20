# Daily Report Workflow

The daily report is the central manager workflow for end-of-day farm activity.

## Planned Flow

1. Manager selects an assigned farm, land block, and crop season.
2. Manager records the report date and daily notes.
3. Manager records activity, labor, expenses, inventory usage, irrigation, inputs, issues, photos, and tomorrow's plan.
4. Manager saves a draft or submits the report.
5. Submitted reports update connected labor, expense, inventory, irrigation, activity log, and notification records.

## Current Implementation Status

- Daily report pages and form exist.
- Daily report validation exists and has unit coverage.
- Server action and service files exist.
- Full dependent-record creation still needs deeper workflow verification.

## Coordination Notes

Daily reports depend on Labor, Expenses, Inventory, File Uploads, Activity Logs, Notifications, Dashboard, and Reports. Changes to daily report submission should be tested against all dependent modules.
