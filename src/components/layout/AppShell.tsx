import Link from "next/link";
import {
  Bell,
  BellRing,
  Boxes,
  Building2,
  ChevronDown,
  ClipboardList,
  Coins,
  Home,
  KeyRound,
  Leaf,
  LayoutDashboard,
  LogOut,
  Map,
  Search,
  Sprout,
  Tractor,
  TrendingUp,
  ScrollText,
  ShieldCheck,
  UserRound,
  UsersRound
} from "lucide-react";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { auth } from "@/server/auth/auth";
import { canUsePagePermission } from "@/server/auth/permissions";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Home, page: "DASHBOARD" },
  { href: "/farms", label: "Farms & Land", icon: Tractor, page: "FARMS" },
  { href: "/land-blocks", label: "Land Blocks", icon: Map, page: "LAND_BLOCKS" },
  { href: "/crop-seasons", label: "Crop Seasons", icon: Sprout, page: "CROP_SEASONS" },
  { href: "/daily-reports", label: "Daily Reports", icon: ClipboardList, page: "DAILY_REPORTS" },
  { href: "/labor", label: "Labor", icon: UsersRound, page: "LABOR" },
  { href: "/expenses", label: "Expenses", icon: Coins, page: "EXPENSES" },
  { href: "/inventory", label: "Inventory", icon: Boxes, page: "INVENTORY" },
  { href: "/harvest-sales", label: "Harvest & Sales", icon: TrendingUp, page: "HARVEST_SALES" },
  { href: "/reports", label: "Reports", icon: Leaf, page: "REPORTS" },
  { href: "/notifications", label: "Notifications", icon: BellRing },
  { href: "/activity-logs", label: "Activity Logs", icon: ScrollText }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userLabel = session?.user?.name ?? session?.user?.email ?? "User";
  const roleLabel = session?.user?.role ? session.user.role.toLowerCase() : "guest";
  const role = session?.user?.role;
  const pagePermissions = session?.user?.pagePermissions ?? [];
  const visibleNavigation =
    role === "SUPER_ADMIN"
      ? [
          { href: "/super-admin", label: "SaaS Dashboard", icon: ShieldCheck },
          { href: "/super-admin/users", label: "Users", icon: UsersRound },
          { href: "/super-admin/farms", label: "Farms", icon: Tractor },
          { href: "/super-admin/inventory", label: "Inventory", icon: Boxes }
        ]
      : [
          ...navigation.filter((item) => !item.page || (role && canUsePagePermission(role, pagePermissions, item.page, "view")))
        ];

  return (
    <div className="min-h-screen bg-[#f7f9f5] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-700 text-white">
            <Leaf className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold leading-5 text-emerald-900">EgriManage</p>
            <p className="text-[11px] font-medium text-slate-500">Farm. Manage. Grow.</p>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {visibleNavigation.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-56">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-700 text-white lg:hidden">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="hidden w-80 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex">
              <Search className="h-4 w-4" />
              <span>Search farms, crops, reports...</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" type="button" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            {!session ? (
              <Link href="/login" className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                Sign in
              </Link>
            ) : (
              <>
                <div className="hidden text-right text-xs md:block">
                  <p className="font-semibold text-slate-800">{userLabel}</p>
                  <p className="capitalize text-slate-500">{roleLabel}</p>
                </div>
                <details className="group relative">
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-slate-200 px-2 py-2 text-emerald-800 hover:bg-emerald-50">
                    <UserRound className="h-4 w-4" />
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500 group-open:rotate-180" />
                    <span className="sr-only">User options</span>
                  </summary>
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg">
                    <Link href="/settings#profile" className="flex items-center gap-2 px-3 py-2 font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">
                      <UserRound className="h-4 w-4" />
                      Profile settings
                    </Link>
                    <Link href="/settings#password" className="flex items-center gap-2 px-3 py-2 font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">
                      <KeyRound className="h-4 w-4" />
                      Change password
                    </Link>
                    {role === "LAND_OWNER" ? (
                      <Link href="/settings#company" className="flex items-center gap-2 px-3 py-2 font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">
                        <Building2 className="h-4 w-4" />
                        Company settings
                      </Link>
                    ) : null}
                    <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">
                      <LayoutDashboard className="h-4 w-4" />
                      Workspace
                    </Link>
                    <Link href="/api/auth/signout" className="flex items-center gap-2 border-t border-slate-100 px-3 py-2 font-medium text-slate-700 hover:bg-red-50 hover:text-red-700">
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Link>
                  </div>
                </details>
              </>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
