# Permissions

## Roles

| Role | Summary |
| --- | --- |
| Owner/Admin | Full access to farms, managers, reports, financials, settings, exports, and all records. |
| Manager | Access only to assigned farms. Can create and update operational records for those farms. Cannot manage users or unrelated farms. |

## Access Principles

- All protected pages require authentication.
- Authorization must be checked in server actions, services, and queries, not only in the UI.
- Owner/admin can access all farms and records.
- Manager access is limited to farms assigned through the farm-manager relationship.
- Managers cannot manage users, global settings, or records for unassigned farms.
- UI navigation should hide actions the user cannot perform, but hidden UI is not a substitute for server checks.

## Module Permissions

| Module | Owner/Admin | Manager |
| --- | --- | --- |
| Authentication | Sign in, sign out, update own profile. | Sign in, sign out, update own profile. |
| Users | Create, edit, deactivate, and assign managers. | No access to user management. |
| Farms | Create, view, edit, and review all farms. | View assigned farms only. |
| Land Blocks | Create, view, edit, and review blocks for all farms. | Create, view, and edit blocks for assigned farms only. |
| Crop Seasons | Create, view, edit, and review all crop seasons. | Create, view, and edit crop seasons for assigned farms only. |
| Daily Reports | View, edit, submit, and review reports for all farms. | Create, save draft, edit draft, and submit reports for assigned farms only. |
| Labor | Create workers, review attendance, wages, and balances across all farms. | Create/update operational labor entries for assigned farms; view assigned-farm labor data. |
| Expenses | Create, edit, review, and report on expenses across all farms. | Create/update expenses for assigned farms only. |
| Inventory | Create items, adjust stock, review all inventory, and see alerts. | Use inventory and view stock for assigned farms only. |
| Irrigation/Input Usage | Review all usage and related activity. | Record usage through daily reports for assigned farms only. |
| Harvest and Sales | Create, edit, review, and report across all farms. | Create/update harvests and sales for assigned farms only. |
| Dashboard | View all farms and portfolio-level KPIs. | View assigned-farm KPIs only. |
| Reports | View and export all reports. | View/export assigned-farm reports only, if export is enabled for managers. |
| Settings | Manage users, categories, units, notification preferences, and own profile. | Manage own profile and permitted personal preferences only. |
| File Uploads | Upload, replace, delete, and review files for all records. | Upload, replace, and delete files for assigned-farm records they can edit. |
| Activity Logs | View all activity logs. | View activity logs for assigned farms only, if exposed. |
| Notifications | Configure and receive all relevant alerts. | Receive alerts for assigned farms only. |

## Action Rules

| Action | Owner/Admin | Manager |
| --- | --- | --- |
| Create farm | Yes | No |
| Assign manager to farm | Yes | No |
| Create land block | Yes | Assigned farms only |
| Create crop season | Yes | Assigned farms only |
| Save daily report draft | Yes | Assigned farms only |
| Submit daily report | Yes | Assigned farms only |
| Edit submitted daily report | Yes | No by default unless explicitly allowed later |
| Record expense | Yes | Assigned farms only |
| Record inventory purchase/adjustment | Yes | Assigned farms only if permitted by owner/admin policy |
| Record inventory usage | Yes | Assigned farms only |
| Record harvest | Yes | Assigned farms only |
| Record sale | Yes | Assigned farms only |
| Export reports | Yes | Assigned farms only if enabled |
| Manage categories and units | Yes | No |

## Route Protection Expectations

- Public routes: login and static assets.
- Protected routes: dashboard, farms, land blocks, crop seasons, daily reports, labor, expenses, inventory, harvest-sales, reports, settings, and upload APIs.
- Upload API must validate both authentication and record-level access before accepting or deleting files.
- Middleware should prevent unauthenticated navigation into protected app routes.
- Server-side permission helpers should enforce role and farm assignment for data operations.

## Data Filtering Expectations

- Owner/admin queries can return all records.
- Manager queries must filter by assigned farm IDs.
- Records related through land block, crop season, daily report, expense, inventory item, harvest, or sale must be traced back to farm access before read or write.
- Direct object IDs from requests must never be trusted without resolving access.
