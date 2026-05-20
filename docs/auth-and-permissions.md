# Auth And Permissions

Authentication uses NextAuth credentials with Prisma-backed users.

## Login

Users sign in at `/login` with email and password. Passwords are stored as bcrypt hashes.

The seeded local owner account is:

- Email: `owner@example.com`
- Password: `ChangeMe123!`

## Session Data

Sessions include:

- `id`
- `role`
- `assignedFarmIds`

## Roles

- `OWNER`: full operational access.
- `ADMIN`: full operational access.
- `MANAGER`: limited to assigned farm records.

## Server-Side Rule

Permission checks must happen in server actions, queries, and services. Pages may render UI, but they should not be the only access-control boundary.
