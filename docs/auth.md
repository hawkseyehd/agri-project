# Authentication

Authentication uses NextAuth credentials with Prisma-backed users. This file is the Documentation Agent deliverable for auth setup; the combined operational reference remains in `auth-and-permissions.md`.

## Local Login

- URL: `/login`
- Seed owner email: `owner@example.com`
- Seed owner password: `ChangeMe123!`

## Session Contract

The credentials provider adds these fields to the session user:

- `id`
- `role`
- `assignedFarmIds`

Server actions, services, and queries must use those fields for authorization. UI-only hiding is not sufficient.

## Role Behavior

- `OWNER` and `ADMIN` can manage users, farms, settings, reports, and financial records.
- `MANAGER` can work only with assigned farms and must not manage users.

## Passwords

Passwords are stored as bcrypt hashes. New manager accounts created from Settings receive a temporary password that should be changed after first login.
