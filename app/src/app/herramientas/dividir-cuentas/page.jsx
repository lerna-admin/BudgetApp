import { redirect } from "next/navigation";

import AppShell from "../../../components/app-shell";
import DashboardSidebar from "../../../components/dashboard-sidebar";
import MobileMenuBackdrop from "../../../components/mobile-menu-backdrop";
import MobileMenuToggle from "../../../components/mobile-menu-toggle";
import SplitBillManager from "../../../components/split-bill-manager";
import { getSessionUser } from "../../../lib/server/session-user";

export default async function SplitAccountsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/herramientas/dividir-cuentas");
  }

  return (
    <AppShell>
      <section className="dashboard-shell panel">
        <DashboardSidebar activeItem="split" user={user} />

        <main className="dashboard-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <MobileMenuToggle />
              <div className="dashboard-heading">
                <p className="dashboard-path">Herramientas / Dividir cuentas</p>
                <h1 className="dashboard-title">Dividir cuenta compartida</h1>
              </div>
            </div>
          </header>

          <SplitBillManager defaultPayerName={user?.name || "Tu"} />
        </main>

        <MobileMenuBackdrop />
      </section>
    </AppShell>
  );
}
