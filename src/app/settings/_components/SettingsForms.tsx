"use client";

import { useFormState, useFormStatus } from "react-dom";

import type { SettingsActionState } from "@/server/actions/settings/settings.actions";
import {
  assignManagerAction,
  changePasswordAction,
  createManagerAction,
  updateCompanyNameAction,
  updateOwnedFarmNameAction,
  updateUserPermissionsAction,
  updateProfileAction
} from "@/server/actions/settings/settings.actions";

const permissionPages = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "FARMS", label: "Farms" },
  { key: "LAND_BLOCKS", label: "Land Blocks" },
  { key: "CROP_SEASONS", label: "Crop Seasons" },
  { key: "DAILY_REPORTS", label: "Daily Reports" },
  { key: "LABOR", label: "Labor" },
  { key: "EXPENSES", label: "Expenses" },
  { key: "INVENTORY", label: "Inventory" },
  { key: "HARVEST_SALES", label: "Harvest & Sales" },
  { key: "YIELDS", label: "Yields" },
  { key: "REPORTS", label: "Reports" },
  { key: "SETTINGS", label: "Settings" }
] as const;

type FarmOption = {
  id: string;
  name: string;
};

type ManagerOption = {
  id: string;
  name: string;
  email: string;
  assignments: Array<{
    farmId: string;
  }>;
  pagePermissions?: Array<{
    page: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }>;
};

type Profile = {
  name: string;
  companyName?: string | null;
  email: string;
};

type OwnedFarm = {
  id: string;
  name: string;
};

function fieldError(state: SettingsActionState, key: string) {
  return state.errors?.[key]?.[0];
}

function ActionMessage({ state }: { state: SettingsActionState }) {
  if (!state.message) {
    return null;
  }

  const className = state.ok
    ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
    : "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900";

  return <div className={className}>{state.message}</div>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

function FarmCheckboxes({
  farms,
  defaultFarmIds = [],
  state
}: {
  farms: FarmOption[];
  defaultFarmIds?: string[];
  state: SettingsActionState;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase text-slate-500">Assigned farms</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {farms.map((farm) => (
          <label key={farm.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input name="farmIds" type="checkbox" value={farm.id} defaultChecked={defaultFarmIds.includes(farm.id)} className="h-4 w-4 rounded border-slate-300" />
            {farm.name}
          </label>
        ))}
      </div>
      {farms.length === 0 ? <p className="text-sm text-slate-600">Create a farm before assigning users.</p> : null}
      {fieldError(state, "farmIds") ? <p className="text-xs text-red-600">{fieldError(state, "farmIds")}</p> : null}
    </div>
  );
}

export function CreateManagerForm({ farms }: { farms: FarmOption[] }) {
  const [state, formAction] = useFormState(createManagerAction, { ok: false });

  return (
    <form action={formAction} className="space-y-4">
      <ActionMessage state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          Name
          <input name="name" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {fieldError(state, "name") ? <span className="block text-xs text-red-600">{fieldError(state, "name")}</span> : null}
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          Email
          <input name="email" type="email" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {fieldError(state, "email") ? <span className="block text-xs text-red-600">{fieldError(state, "email")}</span> : null}
        </label>
      </div>
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        Temporary password
        <input name="password" type="password" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        {fieldError(state, "password") ? <span className="block text-xs text-red-600">{fieldError(state, "password")}</span> : null}
      </label>
      <FarmCheckboxes farms={farms} state={state} />
      <div className="flex justify-end">
        <SubmitButton label="Create user" />
      </div>
    </form>
  );
}

export function AssignManagerForm({ farms, managers }: { farms: FarmOption[]; managers: ManagerOption[] }) {
  const [state, formAction] = useFormState(assignManagerAction, { ok: false });

  return (
    <form action={formAction} className="space-y-4">
      <ActionMessage state={state} />
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        User
        <select name="managerId" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">Choose user</option>
          {managers.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {manager.name} ({manager.email})
            </option>
          ))}
        </select>
        {fieldError(state, "managerId") ? <span className="block text-xs text-red-600">{fieldError(state, "managerId")}</span> : null}
      </label>
      <FarmCheckboxes farms={farms} state={state} />
      <p className="text-xs text-slate-500">Selecting farms replaces the manager's current farm assignments.</p>
      <div className="flex justify-end">
        <SubmitButton label="Update assignments" />
      </div>
    </form>
  );
}

function hasPermission(manager: ManagerOption, page: string, action: "canView" | "canCreate" | "canEdit" | "canDelete") {
  return Boolean(manager.pagePermissions?.find((permission) => permission.page === page)?.[action]);
}

export function UserPermissionsForms({ managers }: { managers: ManagerOption[] }) {
  if (managers.length === 0) {
    return <p className="text-sm text-slate-600">Create a user before configuring page permissions.</p>;
  }

  return (
    <div className="space-y-4">
      {managers.map((manager) => (
        <UserPermissionForm key={manager.id} manager={manager} />
      ))}
    </div>
  );
}

function UserPermissionForm({ manager }: { manager: ManagerOption }) {
  const [state, formAction] = useFormState(updateUserPermissionsAction, { ok: false });

  return (
    <form action={formAction} className="rounded-md border border-slate-200 bg-white p-4">
      <input type="hidden" name="userId" value={manager.id} />
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold text-slate-900">{manager.name}</p>
          <p className="text-xs text-slate-500">{manager.email}</p>
        </div>
        <SubmitButton label="Save permissions" />
      </div>
      <div className="mt-3">
        <ActionMessage state={state} />
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-3">Page</th>
              <th className="px-3 py-2">View</th>
              <th className="px-3 py-2">Create</th>
              <th className="px-3 py-2">Edit</th>
              <th className="px-3 py-2">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {permissionPages.map((page) => (
              <tr key={page.key}>
                <td className="py-2 pr-3 font-medium text-slate-800">{page.label}</td>
                {[
                  ["view", "canView"],
                  ["create", "canCreate"],
                  ["edit", "canEdit"],
                  ["delete", "canDelete"]
                ].map(([field, action]) => (
                  <td key={`${page.key}-${field}`} className="px-3 py-2">
                    <input
                      name={`${page.key}:${field}`}
                      type="checkbox"
                      defaultChecked={hasPermission(manager, page.key, action as "canView" | "canCreate" | "canEdit" | "canDelete")}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useFormState(updateProfileAction, { ok: false });

  return (
    <form action={formAction} className="space-y-3">
      <ActionMessage state={state} />
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        Name
        <input name="name" defaultValue={profile.name} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        {fieldError(state, "name") ? <span className="block text-xs text-red-600">{fieldError(state, "name")}</span> : null}
      </label>
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        Email
        <input name="email" type="email" defaultValue={profile.email} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        {fieldError(state, "email") ? <span className="block text-xs text-red-600">{fieldError(state, "email")}</span> : null}
      </label>
      <div className="flex justify-end">
        <SubmitButton label="Update profile" />
      </div>
    </form>
  );
}

export function CompanyNameForm({ companyName }: { companyName?: string | null }) {
  const [state, formAction] = useFormState(updateCompanyNameAction, { ok: false });

  return (
    <form action={formAction} className="space-y-3">
      <ActionMessage state={state} />
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        Company name
        <input name="companyName" defaultValue={companyName ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        {fieldError(state, "companyName") ? <span className="block text-xs text-red-600">{fieldError(state, "companyName")}</span> : null}
      </label>
      <div className="flex justify-end">
        <SubmitButton label="Update company" />
      </div>
    </form>
  );
}

export function OwnedFarmNameForms({ farms }: { farms: OwnedFarm[] }) {
  if (farms.length === 0) {
    return <p className="text-sm text-slate-600">No farms are attached to this company yet.</p>;
  }

  return (
    <div className="space-y-3">
      {farms.map((farm) => (
        <OwnedFarmNameForm key={farm.id} farm={farm} />
      ))}
    </div>
  );
}

function OwnedFarmNameForm({ farm }: { farm: OwnedFarm }) {
  const [state, formAction] = useFormState(updateOwnedFarmNameAction, { ok: false });

  return (
    <form action={formAction} className="rounded-md border border-slate-200 p-3">
      <input type="hidden" name="farmId" value={farm.id} />
      <ActionMessage state={state} />
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          Farm or area name
          <input name="farmName" defaultValue={farm.name} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          {fieldError(state, "farmName") ? <span className="block text-xs text-red-600">{fieldError(state, "farmName")}</span> : null}
        </label>
        <div className="flex items-end">
          <SubmitButton label="Rename" />
        </div>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useFormState(changePasswordAction, { ok: false });

  return (
    <form action={formAction} className="space-y-3">
      <ActionMessage state={state} />
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        Current password
        <input name="currentPassword" type="password" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        {fieldError(state, "currentPassword") ? <span className="block text-xs text-red-600">{fieldError(state, "currentPassword")}</span> : null}
      </label>
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        New password
        <input name="newPassword" type="password" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        {fieldError(state, "newPassword") ? <span className="block text-xs text-red-600">{fieldError(state, "newPassword")}</span> : null}
      </label>
      <label className="block space-y-1 text-sm font-medium text-slate-700">
        Confirm password
        <input name="confirmPassword" type="password" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        {fieldError(state, "confirmPassword") ? <span className="block text-xs text-red-600">{fieldError(state, "confirmPassword")}</span> : null}
      </label>
      <div className="flex justify-end">
        <SubmitButton label="Change password" />
      </div>
    </form>
  );
}
