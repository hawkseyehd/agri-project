import { DataTable, StatusBadge } from "@/components/ui/dashboard";
import { updateUserAccessFormAction } from "@/server/actions/super-admin.actions";

const roles = ["PENDING_USER", "LAND_OWNER", "TENANT_USER", "SUPER_ADMIN"] as const;
const packages = [
  { value: "NONE", label: "Default" },
  { value: "SILVER", label: "Silver" },
  { value: "GOLD", label: "Gold" },
  { value: "PLATINUM", label: "Platinum" }
] as const;

type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  packageTier: string;
  companyName?: string | null;
  subscriptionApprovedAt?: Date | string | null;
  subscriptionExpiresAt?: Date | string | null;
  owner?: {
    name: string;
  } | null;
  ownedFarms: Array<unknown>;
};

function dateTimeInputValue(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toneForRole(role: string) {
  if (role === "SUPER_ADMIN") {
    return "green" as const;
  }

  if (role === "PENDING_USER") {
    return "amber" as const;
  }

  return "blue" as const;
}

function tenantLabel(user: PlatformUser) {
  if (user.owner) {
    return user.owner.name;
  }

  if (user.ownedFarms.length > 0) {
    return `${user.companyName ?? user.name}: ${user.ownedFarms.length} farm(s)`;
  }

  return user.companyName ?? "Not assigned";
}

function packageLabel(value: string) {
  return packages.find((packageTier) => packageTier.value === value)?.label ?? value;
}

function approvalLabel(user: PlatformUser) {
  if (user.subscriptionApprovedAt) {
    return (
      <div key={`${user.id}-approval`} className="text-xs">
        <p className="font-semibold text-emerald-800">Approved</p>
        <p className="text-slate-500">{user.subscriptionExpiresAt ? `Expires ${new Date(user.subscriptionExpiresAt).toLocaleString("en-PK")}` : "No expiry set"}</p>
      </div>
    );
  }

  if (user.role !== "PENDING_USER" && user.packageTier === "NONE") {
    return "Non-premium";
  }

  return "Pending";
}

export function UserAccessTable({ users }: { users: PlatformUser[] }) {
  return (
    <DataTable
      columns={["User", "Role", "Package", "Tenant", "Approval", "Update Access"]}
      rows={users.map((user) => [
        <div key={`${user.id}-profile`}>
          <p className="font-semibold text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>,
        <StatusBadge key={`${user.id}-role`} tone={toneForRole(user.role)}>
          {user.role}
        </StatusBadge>,
        packageLabel(user.packageTier),
        tenantLabel(user),
        approvalLabel(user),
        <form key={`${user.id}-form`} action={updateUserAccessFormAction} className="grid gap-2 md:grid-cols-[1fr_1fr_170px_auto_auto]">
          <input type="hidden" name="userId" value={user.id} />
          <select name="role" defaultValue={user.role} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs">
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select name="packageTier" defaultValue={user.packageTier} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs">
            {packages.map((packageTier) => (
              <option key={packageTier.value} value={packageTier.value}>
                {packageTier.label}
              </option>
            ))}
          </select>
          <input
            name="subscriptionExpiresAt"
            type="datetime-local"
            defaultValue={dateTimeInputValue(user.subscriptionExpiresAt)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
            aria-label="Subscription expiry"
          />
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input name="approved" type="checkbox" defaultChecked={Boolean(user.subscriptionApprovedAt)} className="h-4 w-4 rounded border-slate-300" />
            Approved
          </label>
          <button type="submit" className="rounded-md bg-emerald-700 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-800">
            Save
          </button>
        </form>
      ])}
    />
  );
}
