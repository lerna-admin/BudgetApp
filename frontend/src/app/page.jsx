import BrandLogo from "../components/brand-logo";
import AppShell from "../components/app-shell";

const pendingModules = ["Dashboard", "Presupuestos", "Movimientos", "Metas", "Reportes", "Configuracion"];

export default function HomePage() {
  return (
    <AppShell>
      <section className="landing">
        <article className="panel landing-hero">
          <div className="brand-lockup">
            <BrandLogo />
            <div>
              <p className="brand-name">BudgetApp</p>
              <p className="brand-sub">Gestion personal financiera</p>
            </div>
          </div>

          <h1>Controla tus finanzas diarias con una experiencia clara</h1>
          <p className="lead">
            La implementacion activa cubre login, registro y perfil de usuario. Los demas modulos estan visibles como enlaces para
            integrar en la siguiente fase.
          </p>

          <div className="cta-row">
            <a href="/register" className="btn btn-primary">Crear cuenta</a>
            <a href="/login" className="btn btn-secondary">Iniciar sesion</a>
            <a href="/profile" className="btn btn-ghost">Ir a perfil</a>
          </div>

          <div className="chip-row">
            <span className="chip chip-live">Registro</span>
            <span className="chip chip-live">Login</span>
            <span className="chip chip-live">Perfil</span>
          </div>
        </article>

        <article className="panel landing-modules">
          <h2>Mapa de modulos</h2>
          <p className="lead" style={{ marginTop: 0, marginBottom: 14 }}>
            Los modulos en proceso apuntan a <code>#</code> para mantener la navegacion visible desde ahora.
          </p>

          <div className="module-grid">
            <a href="/register" className="module-link module-live">Registro</a>
            <a href="/login" className="module-link module-live">Login</a>
            <a href="/profile" className="module-link module-live">Perfil</a>
            {pendingModules.map((module) => (
              <a key={module} href="#" className="module-link module-pending">
                {module}
              </a>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
