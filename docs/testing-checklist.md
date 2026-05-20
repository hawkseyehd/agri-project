# Testing Checklist

## Automated Checks

Run before handoff:

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm run build
```

## Covered Now

- Crop season validation.
- Daily report validation.
- Farm and land validation.
- Permission helper behavior.
- Inventory quantity calculation.
- Upload validation and safe storage naming.

## Manual Smoke Tests

- Open `http://localhost:3000`.
- Login with `owner@example.com` / `ChangeMe123!`.
- Confirm dashboard redirects correctly after login.
- Visit farms, land blocks, crop seasons, reports, settings, uploads, activity logs, and notifications pages.
- POST a valid JPG, PNG, WEBP, or PDF to `/api/uploads`.
- Confirm invalid upload types are rejected.

## Still Needed

- E2E owner setup flow.
- E2E manager daily report flow.
- Role-restricted manager access tests.
- File upload UI integration tests.
