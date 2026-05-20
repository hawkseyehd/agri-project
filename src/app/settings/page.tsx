import { AppShell } from "@/components/layout/AppShell";
import { Field, PageHeader, Panel, StatusBadge } from "@/components/ui/dashboard";
import { auth, getSessionUser } from "@/server/auth/auth";
import { getSettingsProfile } from "@/server/queries/settings/settings.queries";
import {
  CompanyNameForm,
  OwnedFarmNameForms,
  PasswordForm,
  ProfileForm
} from "@/app/settings/_components/SettingsForms";

export default async function Page() {
  const session = await auth();
  const user = getSessionUser(session);
  const profile = user?.id ? await getSettingsProfile(user.id) : null;

  return (
    <AppShell>
      <main className="space-y-5 p-6">
        <PageHeader
          eyebrow="10 Settings"
          title="System Settings"
          description="Configure farm defaults, profile, notification defaults, and operating categories."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="General Settings">
            <div className="space-y-3">
              <Field label="Currency" value="PKR - Pakistani Rupee" />
              <Field label="Date Format" value="DD MMM YYYY" />
              <Field label="Area Unit" value="Acres" />
              <Field label="Weight Unit" value="Maund" />
              <p className="text-xs text-slate-500">Defaults are documented for MVP; persistence needs settings tables in a later schema pass.</p>
            </div>
          </Panel>
          <Panel title="Operating Categories">
            <div className="space-y-2 text-sm text-slate-700">
              {["Labor", "Fertilizer", "Pesticide", "Diesel", "Irrigation", "Transport", "Seed", "Harvest"].map((category) => (
                <div key={category} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  {category}
                  <StatusBadge tone="slate">Default</StatusBadge>
                </div>
              ))}
              <p className="text-xs text-slate-500">Expense, inventory, crop, and unit category validators are in place; database-backed category CRUD awaits schema support.</p>
            </div>
          </Panel>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <Panel title="Notifications">
            <div className="grid gap-3 sm:grid-cols-2">
              {["Daily Report Reminder", "Low Stock Alert", "Irrigation Reminder", "Payment Due Reminder", "Weather Alerts"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
                  {item}
                  <StatusBadge>On</StatusBadge>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Profile">
            {profile ? (
              <div className="space-y-5">
                <div id="profile" className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-lg font-bold text-white">
                    {profile.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{profile.name}</p>
                    <p className="text-sm text-slate-500">{profile.role}</p>
                  </div>
                </div>
                <ProfileForm profile={profile} />
                <div id="password" className="border-t border-slate-100 pt-4">
                  <PasswordForm />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Sign in to update your profile.</p>
            )}
          </Panel>
        </div>
        {profile?.role === "LAND_OWNER" ? (
          <div id="company">
            <Panel title="Company & Farm Names">
              <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                <CompanyNameForm companyName={profile.companyName} />
                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-800">Owned farms and areas</p>
                  <OwnedFarmNameForms farms={profile.ownedFarms} />
                </div>
              </div>
            </Panel>
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}
