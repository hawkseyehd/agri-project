import { redirect } from "next/navigation";

import { auth } from "@/server/auth/auth";

export default async function YieldsPage() {
  const session = await auth();

  if (session?.user?.role === "SUPER_ADMIN") {
    redirect("/super-admin/yields");
  }

  redirect("/dashboard");
}
