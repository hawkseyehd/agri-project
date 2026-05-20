# Egri Project

Agriculture management system MVP for manager-level farm operations in Pakistan.

## Stack

- Next.js full-stack with TypeScript
- PostgreSQL with Prisma
- Auth.js / NextAuth credentials flow
- Zod, React Hook Form, Tailwind CSS, shadcn/ui
- Recharts and TanStack Table
- Local uploads for MVP

## Structure

Business logic should follow:

`Page -> Component -> Server Action -> Service -> Query -> Validator -> Prisma`

The original planning documents are preserved in `Plan/`.

## Local Development

```bash
pnpm install
pnpm exec prisma generate
pnpm run dev
```

The seeded owner login is `owner@example.com` / `ChangeMe123!`.
