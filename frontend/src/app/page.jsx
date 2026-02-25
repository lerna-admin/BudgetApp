import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import BrandLogo from "../components/brand-logo";
import AppShell from "../components/app-shell";
import SidebarLogoutButton from "../components/sidebar-logout-button";
import { verifyToken } from "../lib/server/auth-server";
import { hasPool } from "../lib/server/db";
import { findUserById } from "../lib/server/users-repository";

const menuSections = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", icon: "🏠", href: "/", active: true },
      { label: "Presupuesto", icon: "📊", href: "#" },
      { label: "Registro de gastos", icon: "✏️", href: "#" },
      { label: "Metas", icon: "🎯", href: "#" },
    ],
  },
  {
    title: "Cuenta",
    items: [
      { label: "Perfil", icon: "👤", href: "/profile" },
      { label: "Configuracion", icon: "⚙️", href: "#" },
      { label: "Reportes", icon: "📈", href: "#" },
    ],
  },
];

async function getSessionUser() {
  if (!hasPool()) {
    return null;
  }

  const token = (await cookies()).get("budgetapp_session")?.value;
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload?.sub) {
    return null;
  }

  try {
    return await findUserById(payload.sub);
  } catch (_error) {
    return null;
  }
}

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/");
  }

  return (
    <AppShell>
      <section className="dashboard-shell panel">
        <aside className="dashboard-sidebar">
          <div className="dashboard-brand">
            <BrandLogo className="menu-logo" />
            <div>
              <p className="brand-name">BudgetApp</p>
              <p className="brand-sub">Menu principal</p>
            </div>
          </div>

          {menuSections.map((section) => (
            <div key={section.title} className="menu-section">
              <p className="menu-title">{section.title}</p>
              <div className="menu-list">
                {section.items.map((item) => (
                  <a key={item.label} href={item.href} className={`menu-item ${item.active ? "active" : ""}`}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}

          <div className="menu-user">
            <p className="menu-user-name">{user.name}</p>
            <p className="menu-user-mail">{user.email}</p>
          </div>

          <SidebarLogoutButton />
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-topbar">
            <div>
              <p className="dashboard-path">Dashboard / Sesion activa</p>
              <h1 className="dashboard-title">Resumen financiero</h1>
            </div>
            <div className="dashboard-actions">
              <a href="#" className="btn btn-secondary">+ Nuevo movimiento</a>
              <a href="#" className="btn btn-primary">Crear presupuesto</a>
            </div>
          </header>

          <section className="dashboard-kpis">
            <article className="kpi-card">
              <p>Usuario</p>
              <strong>{user.name}</strong>
            </article>
            <article className="kpi-card">
              <p>Correo</p>
              <strong className="kpi-value-soft">{user.email}</strong>
            </article>
            <article className="kpi-card">
              <p>Pais</p>
              <strong>{user.countryCode || "Sin definir"}</strong>
            </article>
            <article className="kpi-card">
              <p>Estado</p>
              <strong>{user.status}</strong>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="panel dashboard-card">
              <div className="dashboard-card-head">
                <h2>Presupuesto vs real</h2>
                <a href="#">Ver detalle</a>
              </div>
              <div className="dashboard-empty">
                Aun no hay presupuesto cargado para mostrar resumen financiero.
              </div>
            </article>

            <article className="panel dashboard-card">
              <div className="dashboard-card-head">
                <h2>Movimientos recientes</h2>
                <a href="#">Ir al registro</a>
              </div>
              <div className="dashboard-empty">
                Aun no hay movimientos registrados para este usuario.
              </div>
            </article>
          </section>
        </main>
      </section>
    </AppShell>
  );
}
