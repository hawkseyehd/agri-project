import { redirect } from "next/navigation";

import { FirstFarmSetupForm } from "@/app/setup-farm/FirstFarmSetupForm";
import { PublicPageShell } from "@/components/layout/PublicLayout";
import { auth, getSessionUser } from "@/server/auth/auth";

export default async function SetupFarmPage() {
  const user = getSessionUser(await auth());

  if (!user) {
    redirect("/login?callbackUrl=/setup-farm");
  }

  if (user.role !== "LAND_OWNER") {
    redirect(user.role === "PENDING_USER" ? "/get-started" : "/dashboard");
  }

  if (user.companyName) {
    redirect("/dashboard");
  }

  return (
    <PublicPageShell>
      <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-6 py-12">
        <div className="w-full">
          <p className="text-sm font-bold uppercase text-emerald-700">Company Setup</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Name your company.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your company can hold multiple farms or areas. Add farms later from the Farms & Land area.
          </p>
          <div className="mt-6">
            <FirstFarmSetupForm defaultCompanyName={user.companyName ?? ""} />
          </div>
        </div>
      </main>
    </PublicPageShell>
  );
}
