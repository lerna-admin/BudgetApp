"use client";

import { useEffect, useMemo, useState } from "react";

import AppShell from "../../components/app-shell";
import DashboardSidebar from "../../components/dashboard-sidebar";
import MobileMenuBackdrop from "../../components/mobile-menu-backdrop";
import MobileMenuToggle from "../../components/mobile-menu-toggle";

const THEME_OPTIONS = [
  { id: "light", label: "Light" },
  { id: "mint", label: "Mint" },
  { id: "sunset", label: "Sunset" },
];

function initialsFor(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const first = parts[0].slice(0, 1);
  const second = parts.length > 1 ? parts[1].slice(0, 1) : "";
  return `${first}${second}`.toUpperCase();
}

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const saved = window.localStorage.getItem("budgetapp-theme");
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("budgetapp-theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    async function load() {
      try {
        const [me, acc, card] = await Promise.all([
          fetchJSON("/api/auth/me"),
          fetchJSON("/api/accounts"),
          fetchJSON("/api/cards"),
        ]);
        setUser(me);
        setAccounts(acc.data || []);
        setCards(card.data || []);
        setError("");
      } catch (e) {
        setError("No se pudo cargar el perfil");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const initials = useMemo(() => initialsFor(user?.name), [user]);

  if (loading) {
    return (
      <AppShell>
        <section className="dashboard-shell panel">
          <DashboardSidebar activeItem="profile" />
          <main className="dashboard-main">
            <p className="dashboard-empty">Cargando perfil...</p>
          </main>
        </section>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <section className="dashboard-shell panel">
          <DashboardSidebar activeItem="profile" />
          <main className="dashboard-main">
            <p className="message message-error">No hay sesion activa.</p>
          </main>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="dashboard-shell panel">
        <DashboardSidebar activeItem="profile" user={user} />

        <main className="dashboard-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar-left">
              <MobileMenuToggle />
              <div className="dashboard-heading">
                <p className="dashboard-path">Cuenta / Perfil</p>
                <h1 className="dashboard-title">Perfil</h1>
              </div>
            </div>
          </header>

          {error && <p className="message message-error">{error}</p>}

          <section className="profile-grid">
            <aside className="panel profile-card profile-card-basic">
              <div className="avatar">{initials}</div>
              <p className="user-name">{user.name}</p>
              <p className="user-mail">{user.email}</p>

              <div className="tag-row">
                <span className="tag tag-soft">Rol: {user.role}</span>
                <span className="tag tag-live">Estado: {user.status}</span>
              </div>

              <div className="info-list">
                <div className="info-item"><span>Pais</span><strong>{user.countryCode || "Sin definir"}</strong></div>
                <div className="info-item"><span>Preferencia tema</span><strong>{theme}</strong></div>
                <div className="info-item"><span>Idioma</span><strong>Español</strong></div>
              </div>
            </aside>

            <details className="panel profile-accordion profile-card-security">
              <summary>
                <h2 className="section-title">Seguridad</h2>
                <span className="tag tag-soft">Revision reciente</span>
              </summary>
              <div className="accordion-body">
                <div className="tag-row" style={{ marginBottom: 10 }}>
                  <span className="tag tag-soft">Contrasena actualizada</span>
                  <span className="tag tag-soft">Sesiones web activas</span>
                </div>
                <div className="status status-ok">Alertas de inicio de sesion activas</div>
              </div>
            </details>

            <details className="panel profile-accordion profile-card-preferences">
              <summary>
                <h2 className="section-title">Preferencias</h2>
                <span className="tag tag-soft">Tema e idioma</span>
              </summary>
              <div className="accordion-body">
                <div className="pref-grid" style={{ marginTop: 0 }}>
                  <article className="pref-item">
                    <h3>Tema</h3>
                    <p>Actual: {theme}</p>
                    <div className="tag-row" style={{ gap: 6 }}>
                      {THEME_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`chip ${theme === opt.id ? "expense-filter-chip-active" : "expense-filter-chip"}`}
                          onClick={() => setTheme(opt.id)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </article>
                  <article className="pref-item">
                    <h3>Idioma</h3>
                    <p>Español (ES)</p>
                  </article>
                  <article className="pref-item">
                    <h3>Notificaciones</h3>
                    <p>Email activado</p>
                  </article>
                  <article className="pref-item">
                    <h3>Exportaciones</h3>
                    <p>CSV semanal</p>
                  </article>
                </div>
              </div>
            </details>

            <details className="panel profile-accordion profile-card-banks">
              <summary>
                <h2 className="section-title">Cuentas registradas</h2>
                <span className="tag tag-soft">{accounts.length}</span>
              </summary>
              <div className="accordion-body">
                {accounts.length === 0 ? (
                  <div className="dashboard-empty">Aún no agregas cuentas.</div>
                ) : (
                  <div className="bank-list">
                    {accounts.map((acc) => (
                      <article key={acc.id} className="bank-item">
                        <h3>{acc.accountName}</h3>
                        <p>{acc.accountType} · {acc.currency}</p>
                        <span className="tag tag-soft">Saldo: {acc.balance}</span>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </details>

            <details className="panel profile-accordion profile-card-banks">
              <summary>
                <h2 className="section-title">Tarjetas registradas</h2>
                <span className="tag tag-soft">{cards.length}</span>
              </summary>
              <div className="accordion-body">
                {cards.length === 0 ? (
                  <div className="dashboard-empty">Aún no agregas tarjetas.</div>
                ) : (
                  <div className="bank-list">
                    {cards.map((card) => (
                      <article key={card.id} className="bank-item">
                        <h3>{card.cardName}</h3>
                        <p>{card.cardType} · {card.currency}</p>
                        <span className="tag tag-soft">Cupo: {card.creditLimit ?? "-"}</span>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </details>
          </section>
        </main>

        <MobileMenuBackdrop />
      </section>
    </AppShell>
  );
}
