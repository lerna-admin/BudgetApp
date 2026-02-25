"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "../../components/brand-logo";
import AppShell from "../../components/app-shell";
import { logout, me } from "../../lib/auth-client";

const moduleLinks = ["Dashboard", "Presupuestos", "Movimientos", "Metas", "Reportes", "Configuracion"];

const connectedBanks = [
  { name: "Bancolombia", detail: "Sincronizacion cada 6h", state: "Activo" },
  { name: "Nequi", detail: "Pendiente primer sincronizado", state: "Pendiente" },
  { name: "Davivienda", detail: "Disponible para conectar", state: "Nuevo" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    me()
      .then((data) => setProfile(data))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const initials = useMemo(() => {
    if (!profile?.name) {
      return "U";
    }

    const parts = profile.name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return "U";
    }

    const first = parts[0].slice(0, 1);
    const second = parts.length > 1 ? parts[1].slice(0, 1) : "";
    return `${first}${second}`.toUpperCase();
  }, [profile]);

  async function handleLogout() {
    await logout().catch(() => null);
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <AppShell>
        <section className="profile-shell">
          <div className="panel loading-box">Cargando perfil...</div>
        </section>
      </AppShell>
    );
  }

  if (error || !profile) {
    return (
      <AppShell>
        <section className="profile-shell">
          <article className="panel error-panel">
            <p className="error-code">401</p>
            <h1>Sesion invalida</h1>
            <p>Necesitas iniciar sesion para ver esta pantalla.</p>
            <div className="cta-row">
              <a href="/login" className="btn btn-primary">Iniciar sesion</a>
              <a href="/" className="btn btn-secondary">Volver al inicio</a>
            </div>
          </article>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="profile-shell">
        <header className="panel profile-topbar">
          <a href="/" className="brand-lockup brand-inline">
            <BrandLogo />
            <div>
              <p className="brand-name">BudgetApp</p>
              <p className="brand-sub">Cuenta de usuario</p>
            </div>
          </a>

          <div className="cta-row">
            <a href="#" className="btn btn-secondary">Editar perfil</a>
            <button type="button" onClick={handleLogout} className="btn btn-primary">Cerrar sesion</button>
          </div>
        </header>

        <div className="profile-grid">
          <aside className="panel side-card">
            <div className="avatar">{initials}</div>
            <p className="user-name">{profile.name}</p>
            <p className="user-mail">{profile.email}</p>

            <div className="tag-row">
              <span className="tag tag-soft">Rol: {profile.role}</span>
              <span className="tag tag-live">Estado: {profile.status}</span>
            </div>

            <div className="info-list">
              <div className="info-item"><span>Pais</span><strong>{profile.countryCode || "Sin definir"}</strong></div>
              <div className="info-item"><span>Preferencia tema</span><strong>Light</strong></div>
              <div className="info-item"><span>Idioma</span><strong>Espanol</strong></div>
            </div>
          </aside>

          <section className="panel">
            <div className="section-head">
              <h2 className="section-title">Seguridad</h2>
              <span className="tag tag-soft">Revision reciente</span>
            </div>

            <div className="tag-row" style={{ marginBottom: 10 }}>
              <span className="tag tag-soft">Contrasena actualizada</span>
              <span className="tag tag-soft">Sesiones web activas</span>
            </div>

            <div className="status status-ok">Alertas de inicio de sesion activas</div>
            <div className="status status-warn">Hay sesiones abiertas en mas de un dispositivo</div>

            <div className="cta-row" style={{ marginTop: 12, marginBottom: 18 }}>
              <a href="#" className="btn btn-primary">Cambiar contrasena</a>
              <a href="#" className="btn btn-secondary">Gestionar sesiones</a>
            </div>

            <h2 className="section-title">Preferencias</h2>
            <div className="pref-grid">
              <article className="pref-item">
                <h3>Tema</h3>
                <p>Light activo</p>
                <a href="#" className="tag tag-soft">Cambiar</a>
              </article>
              <article className="pref-item">
                <h3>Idioma</h3>
                <p>Espanol (ES)</p>
                <a href="#" className="tag tag-soft">ES / EN</a>
              </article>
              <article className="pref-item">
                <h3>Notificaciones</h3>
                <p>Email activado</p>
                <a href="#" className="tag tag-soft">Configurar</a>
              </article>
              <article className="pref-item">
                <h3>Exportaciones</h3>
                <p>CSV semanal</p>
                <a href="#" className="tag tag-soft">Editar</a>
              </article>
            </div>
          </section>

          <aside className="panel right-card">
            <h2 className="section-title">Bancos conectados</h2>
            <div className="bank-list">
              {connectedBanks.map((bank) => (
                <article key={bank.name} className="bank-item">
                  <h3>{bank.name}</h3>
                  <p>{bank.detail}</p>
                  <span className="tag tag-soft">{bank.state}</span>
                </article>
              ))}
            </div>

            <h2 className="section-title" style={{ marginTop: 10 }}>Modulos</h2>
            <div className="module-list">
              {moduleLinks.map((module) => (
                <a key={module} href="#">{module}</a>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
