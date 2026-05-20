import Link from "next/link";
import { redirect } from "next/navigation";

import { CreatePlatformUserForm } from "@/app/super-admin/_components/CreatePlatformUserForm";
import { UserAccessTable } from "@/app/super-admin/_components/UserAccessTable";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, Panel, StatCard } from "@/components/ui/dashboard";
import { auth } from "@/server/auth/auth";
import { getSuperAdminDashboardData } from "@/server/queries/super-admin.queries";

export default async function SuperAdminUsersPage() {
  const session = await auth();

  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const data = await getSuperAdminDashboardData();
  const metrics = data.metrics;

  return (
    <AppShell>
      <main className="space-y-5 p-6">
        <PageHeader
          eyebrow="Platform Users"
          title="Users Management"
          description="Review all registered users, plan requests, active subscriptions, tenant links, and expiry dates."
          action={
            <Link href="/super-admin" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              SaaS Dashboard
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Registered users" value={String(metrics.totalUsers)} helper={`${data.pendingUsers.length} pending`} />
          <StatCard label="Premium users" value={String(metrics.premiumUsers)} helper={`${metrics.nonPremiumUsers} non-premium`} />
          <StatCard label="Without farms" value={String(metrics.usersWithoutFarms)} helper="Need setup or assignment" />
          <StatCard label="No plan" value={String(metrics.planCounts.NONE)} helper="Free or unselected" />
        </div>

        <Panel title="Create User">
          <CreatePlatformUserForm />
        </Panel>

        <Panel title="All Users">
          <UserAccessTable users={data.users} />
        </Panel>
      </main>
    </AppShell>
  );
}
