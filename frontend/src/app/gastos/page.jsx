import { redirect } from "next/navigation";

import AppShell from "../../components/app-shell";
import DashboardSidebar from "../../components/dashboard-sidebar";
import MobileMenuBackdrop from "../../components/mobile-menu-backdrop";
import MobileMenuToggle from "../../components/mobile-menu-toggle";
import ExpenseRegister from "../../components/expense-register";
import { getSessionUser } from "../../lib/server/session-user";

export default async function ExpensesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/gastos");
  }

  return (
    <AppShell>
      <section className="dashboard-shell panel">
        <DashboardSidebar activeItem="expenses" user={user} />

        <main className="dashboard-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <MobileMenuToggle />
              <div className="dashboard-heading">
                <p className="dashboard-path">Registro de Gastos / Febrero 2026</p>
                <h1 className="dashboard-title">Historial mensual + registro</h1>
              </div>
            </div>
            <div className="dashboard-actions">
              <a href="#" className="btn btn-secondary">Exportar</a>
              <a href="#" className="btn btn-primary">Importar movimientos</a>
            </div>
          </header>

          <section className="expense-intro panel-soft">
            <p className="expense-intro-title">Registro de movimientos</p>
            <p className="expense-intro-copy">
              Esta vista permite registrar gastos, ahorro, inversion y movimientos entre cuentas
              con flujo guiado por categoria, subcategoria y arista (rubro).
            </p>
          </section>

          <ExpenseRegister />
        </main>

        <MobileMenuBackdrop />
      </section>
    </AppShell>
  );
}
