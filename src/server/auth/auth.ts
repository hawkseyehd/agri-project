import type { PackageTier, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Session } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const authRefreshIntervalMs = 60_000;

export function shouldRefreshAuthToken(lastRefreshedAt: number | undefined, now = Date.now()) {
  return lastRefreshedAt === undefined || now - lastRefreshedAt >= authRefreshIntervalMs;
}

const authSecret = process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim();

async function getPrisma() {
  const { prisma } = await import("@/server/db/prisma");
  return prisma;
}

export type AuthenticatedUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  packageTier: PackageTier;
  companyName?: string | null;
  ownerId?: string | null;
  subscriptionApprovedAt?: string | null;
  subscriptionExpiresAt?: string | null;
  pagePermissions: Array<{
    page: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }>;
  assignedFarmIds: string[];
};

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const prisma = await getPrisma();
        const user = await prisma.user.findUnique({
          where: {
            email
          },
          include: {
            assignments: true,
            pagePermissions: true
          }
        });

        if (!user) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          packageTier: user.packageTier,
          companyName: user.companyName,
          ownerId: user.ownerId,
          subscriptionApprovedAt: user.subscriptionApprovedAt,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          pagePermissions: user.pagePermissions.map((permission) => ({
            page: permission.page,
            canView: permission.canView,
            canCreate: permission.canCreate,
            canEdit: permission.canEdit,
            canDelete: permission.canDelete
          })),
          assignedFarmIds: user.assignments.map((assignment) => assignment.farmId)
        };
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.packageTier = user.packageTier;
        token.companyName = user.companyName ?? null;
        token.ownerId = user.ownerId ?? null;
        token.subscriptionApprovedAt = user.subscriptionApprovedAt ? user.subscriptionApprovedAt.toISOString() : null;
        token.subscriptionExpiresAt = user.subscriptionExpiresAt ? user.subscriptionExpiresAt.toISOString() : null;
        token.pagePermissions = user.pagePermissions;
        token.assignedFarmIds = user.assignedFarmIds;
        token.userRefreshedAt = Date.now();
      }

      if (!user && token.id && shouldRefreshAuthToken(token.userRefreshedAt)) {
        const prisma = await getPrisma();
        const currentUser = await prisma.user.findUnique({
          where: {
            id: token.id
          },
          include: {
            assignments: true,
            pagePermissions: true
          }
        });

        if (currentUser) {
          token.role = currentUser.role;
          token.packageTier = currentUser.packageTier;
          token.companyName = currentUser.companyName ?? null;
          token.ownerId = currentUser.ownerId ?? null;
          token.subscriptionApprovedAt = currentUser.subscriptionApprovedAt ? currentUser.subscriptionApprovedAt.toISOString() : null;
          token.subscriptionExpiresAt = currentUser.subscriptionExpiresAt ? currentUser.subscriptionExpiresAt.toISOString() : null;
          token.pagePermissions = currentUser.pagePermissions.map((permission) => ({
            page: permission.page,
            canView: permission.canView,
            canCreate: permission.canCreate,
            canEdit: permission.canEdit,
            canDelete: permission.canDelete
          }));
          token.assignedFarmIds = currentUser.assignments.map((assignment) => assignment.farmId);
        }

        token.userRefreshedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "MANAGER";
        session.user.packageTier = token.packageTier ?? "NONE";
        session.user.companyName = token.companyName ?? null;
        session.user.ownerId = token.ownerId ?? null;
        session.user.subscriptionApprovedAt = token.subscriptionApprovedAt ?? null;
        session.user.subscriptionExpiresAt = token.subscriptionExpiresAt ?? null;
        session.user.pagePermissions = token.pagePermissions ?? [];
        session.user.assignedFarmIds = token.assignedFarmIds ?? [];
      }

      return session;
    }
  }
};

export function auth() {
  return getServerSession(authOptions);
}

export function getSessionUser(session: Session | null): AuthenticatedUser | null {
  const user = session?.user;

  if (!user?.id || !user.role) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    packageTier: user.packageTier ?? "NONE",
    companyName: user.companyName ?? null,
    ownerId: user.ownerId ?? null,
    subscriptionApprovedAt: user.subscriptionApprovedAt ?? null,
    subscriptionExpiresAt: user.subscriptionExpiresAt ?? null,
    pagePermissions: user.pagePermissions ?? [],
    assignedFarmIds: user.assignedFarmIds ?? []
  };
}

export async function requireAuthUser() {
  const user = getSessionUser(await auth());

  if (!user) {
    throw new Error("Sign in to continue.");
  }

  return user;
}
