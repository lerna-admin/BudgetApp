import { redirect } from "next/navigation";

import AppShell from "../../components/app-shell";
import DashboardSidebar from "../../components/dashboard-sidebar";
import DebtsManager from "../../components/debts-manager";
import MobileMenuBackdrop from "../../components/mobile-menu-backdrop";
import MobileMenuToggle from "../../components/mobile-menu-toggle";
import { getSessionUser } from "../../lib/server/session-user";

export default async function DebtsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/deudas");
  }

  return (
    <AppShell>
      <section className="dashboard-shell panel">
        <DashboardSidebar activeItem="debts" user={user} />

        <main className="dashboard-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <MobileMenuToggle />
              <div className="dashboard-heading">
                <p className="dashboard-path">Deudas / Gestion</p>
                <h1 className="dashboard-title">Control de deudas</h1>
              </div>
            </div>
          </header>

          <section className="expense-intro panel-soft">
            <p className="expense-intro-title">Modulo de deudas</p>
            <p className="expense-intro-copy">
              Registra tus deudas con interes EA, pagos minimos, estado y vinculo a cuenta/tarjeta.
              Cada deuda se sincroniza automaticamente con el presupuesto del periodo.
            </p>
          </section>

          <DebtsManager />
        </main>

        <MobileMenuBackdrop />
      </section>
    </AppShell>
  );
}
