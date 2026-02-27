import { redirect } from "next/navigation";

import AppShell from "../../components/app-shell";
import BudgetWizard from "../../components/budget-wizard";
import DashboardSidebar from "../../components/dashboard-sidebar";
import MobileMenuBackdrop from "../../components/mobile-menu-backdrop";
import MobileMenuToggle from "../../components/mobile-menu-toggle";
import { getSessionUser } from "../../lib/server/session-user";

export default async function BudgetPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/presupuesto");
  }

  const hasActiveBudget = false;

  return (
    <AppShell>
      <section className="dashboard-shell panel">
        <DashboardSidebar activeItem="budget" user={user} />

        <main className="dashboard-main budget-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <MobileMenuToggle />
              <div className="dashboard-heading">
                <p className="dashboard-path">Presupuesto / Febrero 2026</p>
                <h1 className="dashboard-title">Plan mensual</h1>
              </div>
            </div>
            <div className="dashboard-actions">
              <a href="#" className="btn btn-secondary">Exportar</a>
              <a href="#" className="btn btn-primary">Crear presupuesto</a>
            </div>
          </header>

          <section className="panel-soft budget-intro">
            <div>
              <strong>Objetivo de este mes</strong>
              <p>Define metas realistas y revisa el avance por categoria.</p>
            </div>
            <div className="chip-row">
              <span className="chip chip-live">Mes actual</span>
              <span className="chip">Revision semanal</span>
              <span className="chip">Alertas activas</span>
            </div>
          </section>

          <section className="budget-grid">
            <BudgetWizard />
          </section>

          <section className="panel budget-table-panel">
            <div className="budget-table-head">
              <h2>Presupuesto por categoria</h2>
              <div className="chip-row">
                <span className="chip chip-live">Febrero</span>
                <span className="chip">COP</span>
                <span className="chip">Auto-ajuste</span>
              </div>
            </div>

            {hasActiveBudget ? (
              <>
                <table className="budget-table">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Planificado</th>
                      <th>Real</th>
                      <th>Balance</th>
                      <th>Avance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="budget-cat">
                          <span className="budget-dot" style={{ background: "var(--violet)" }}></span>
                          <div>
                            <div className="budget-cat-name">Alimentacion</div>
                            <div className="budget-cat-note">6 subcategorias</div>
                          </div>
                        </div>
                      </td>
                      <td>$ 0</td>
                      <td>$ 0</td>
                      <td><span className="budget-pill ok">$ 0</span></td>
                      <td>
                        <div className="budget-progress"><span style={{ width: "0%" }}></span></div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="budget-cat">
                          <span className="budget-dot" style={{ background: "var(--amber)" }}></span>
                          <div>
                            <div className="budget-cat-name">Transporte</div>
                            <div className="budget-cat-note">Gasolina + apps</div>
                          </div>
                        </div>
                      </td>
                      <td>$ 0</td>
                      <td>$ 0</td>
                      <td><span className="budget-pill warn">$ 0</span></td>
                      <td>
                        <div className="budget-progress"><span style={{ width: "0%", background: "var(--amber)" }}></span></div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="budget-cat">
                          <span className="budget-dot" style={{ background: "var(--mint)" }}></span>
                          <div>
                            <div className="budget-cat-name">Servicios</div>
                            <div className="budget-cat-note">Internet + energia</div>
                          </div>
                        </div>
                      </td>
                      <td>$ 0</td>
                      <td>$ 0</td>
                      <td><span className="budget-pill ok">$ 0</span></td>
                      <td>
                        <div className="budget-progress"><span style={{ width: "0%", background: "var(--mint)" }}></span></div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="budget-cat">
                          <span className="budget-dot" style={{ background: "#ec4899" }}></span>
                          <div>
                            <div className="budget-cat-name">Entretenimiento</div>
                            <div className="budget-cat-note">Salidas + streaming</div>
                          </div>
                        </div>
                      </td>
                      <td>$ 0</td>
                      <td>$ 0</td>
                      <td><span className="budget-pill ok">$ 0</span></td>
                      <td>
                        <div className="budget-progress"><span style={{ width: "0%", background: "#ec4899" }}></span></div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="budget-footer">
                  <p className="lead">Ultima actualizacion: hoy 09:32 AM</p>
                  <div className="dashboard-actions">
                    <button className="btn btn-secondary" type="button">Recalcular</button>
                    <button className="btn btn-primary" type="button">Guardar cambios</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="dashboard-empty">Por ahora no tienes un presupuesto activo para mostrar</div>
            )}
          </section>
        </main>

        <MobileMenuBackdrop />
      </section>
    </AppShell>
  );
}
