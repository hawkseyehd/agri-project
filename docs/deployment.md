# Deployment

## Required Environment Variables

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_URL="https://your-domain.example"
NEXTAUTH_SECRET="replace-with-a-secure-secret"
AUTH_URL="https://your-domain.example"
AUTH_SECRET="replace-with-a-secure-secret"
UPLOAD_DIR="public/uploads"
```

## Build Commands

```bash
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm run build
```

## Database

Use managed PostgreSQL or a VPS-hosted PostgreSQL instance. Run Prisma migrations before production deployment.

```bash
pnpm exec prisma migrate deploy
```

## File Storage

The MVP stores files locally under `public/uploads`. For production, plan a migration to S3 or Cloudflare R2 before high-volume real usage.

## Current Readiness

The app has passed a local production build. Production still needs hosted database credentials, backup policy, SSL/domain setup, and persistent upload storage.
