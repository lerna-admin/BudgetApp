import { redirect } from "next/navigation";

import AppShell from "../components/app-shell";
import DashboardSidebar from "../components/dashboard-sidebar";
import MobileMenuBackdrop from "../components/mobile-menu-backdrop";
import DashboardHome from "../components/dashboard-home";
import { getSessionUser } from "../lib/server/session-user";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/");
  }

  return (
    <AppShell>
      <section className="dashboard-shell panel">
        <DashboardSidebar activeItem="dashboard" user={user} />
        <DashboardHome user={user} />

        <MobileMenuBackdrop />
      </section>
    </AppShell>
  );
}
