# Setup

## Requirements

- Node.js 20+ or 22+
- pnpm
- PostgreSQL 15+

## Local Environment

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/egri_project"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-local-secret"
AUTH_URL="http://localhost:3000"
AUTH_SECRET="replace-with-a-local-secret"
UPLOAD_DIR="public/uploads"
```

## Install And Run

```bash
pnpm install
pnpm exec prisma generate
pnpm exec prisma db push
pnpm exec tsx prisma/seed.ts
pnpm exec next dev -p 3000
```

The seeded owner login is:

- Email: `owner@example.com`
- Password: `ChangeMe123!`

## Verification

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm run build
```
