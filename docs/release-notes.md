# Release Notes

## MVP Implementation Notes

- Core app shell, authentication, farm/land/crop-season flows, daily reports, inventory services, and documentation are under active MVP development.
- Settings now includes owner/admin manager creation, manager-to-farm assignment, profile update, and password change actions.
- Settings category and unit defaults are documented and validated, but database-backed category/unit CRUD needs schema support before persistence can be completed.
- Local uploads are MVP-only. Production should move receipts/photos to durable object storage before high-volume farm use.

## Remaining Before First Farm Test

- Complete database schema support for configurable categories, units, notification preferences, and durable settings.
- Verify dashboard/report calculations against seeded and real records.
- Run full QA across owner and manager workflows.
- Configure production database backups, domain/SSL, and persistent upload storage.
