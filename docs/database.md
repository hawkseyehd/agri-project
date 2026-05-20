# Database

EgriProject uses PostgreSQL with Prisma.

## Current Models

- `User`: owner/admin/manager accounts.
- `Farm`: farm records.
- `FarmManager`: farm-to-manager assignment.
- `LandBlock`: farm land blocks.
- `CropSeason`: crop lifecycle records.
- `DailyReport`: end-of-day manager reports.
- `Expense`: farm and optional crop-season expenses.
- `InventoryItem`: farm stock items.
- `InventoryMovement`: purchase, usage, adjustment, and wastage movements.
- `Harvest`: crop-season harvest records.
- `Sale`: crop-season or harvest sales records.

## Local Commands

```bash
pnpm exec prisma generate
pnpm exec prisma db push
pnpm exec tsx prisma/seed.ts
```

Use migrations before production release:

```bash
pnpm exec prisma migrate dev
```

## Seed Data

`prisma/seed.ts` creates the demo owner:

- `owner@example.com`
- `ChangeMe123!`
