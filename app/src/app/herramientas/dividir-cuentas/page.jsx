import { redirect } from "next/navigation";

import AppShell from "../../../components/app-shell";
import DashboardSidebar from "../../../components/dashboard-sidebar";
import MobileMenuBackdrop from "../../../components/mobile-menu-backdrop";
import MobileMenuToggle from "../../../components/mobile-menu-toggle";
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
            <div className="dashboard-actions">
              <a href="#" className="btn btn-secondary">Ver historial</a>
              <a href="#" className="btn btn-primary">+ Nueva division</a>
            </div>
          </header>

          <section className="expense-intro panel-soft">
            <p className="expense-intro-title">Herramienta</p>
            <p className="expense-intro-copy">
              Registra compras compartidas, agrega participantes (con o sin app) y define el reparto por ítem.
              El resumen calcula cuánto debe pagar cada persona.
            </p>
          </section>

          <section className="dashboard-grid">
            <article className="panel dashboard-card">
              <div className="dashboard-card-head">
                <h2>Divisiones recientes</h2>
                <a href="#">Exportar</a>
              </div>
              <div className="dashboard-empty">
                Aun no hay divisiones registradas. Crea una nueva para comenzar.
              </div>
            </article>

            <aside className="panel dashboard-card">
              <div className="dashboard-card-head">
                <h2>Reglas</h2>
                <a href="#">Ver UC</a>
              </div>
              <div className="bar-listing">
                <div className="info-item">
                  <span>El reparto se calcula por ítem según participantes.</span>
                  <strong>Por defecto</strong>
                </div>
                <div className="info-item">
                  <span>Puedes invitar participantes con o sin app y seguir.</span>
                  <strong>Flexible</strong>
                </div>
                <div className="info-item">
                  <span>Si el total de ítems no coincide, se alerta pero permite guardar.</span>
                  <strong>No bloquea</strong>
                </div>
              </div>
            </aside>
          </section>
        </main>

        <MobileMenuBackdrop />
      </section>
    </AppShell>
  );
}
