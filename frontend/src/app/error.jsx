"use client";

export default function Error({ reset }) {
  return (
    <main className="status-page">
      <section className="panel status-card">
        <p className="status-code" style={{ color: "var(--amber)" }}>500</p>
        <h1>Ocurrio un error inesperado</h1>
        <p className="lead">El equipo ya puede revisar este evento. Reintenta ahora o vuelve al inicio.</p>
        <div className="cta-row">
          <button type="button" className="btn btn-primary" onClick={reset}>Reintentar</button>
          <a href="/" className="btn btn-secondary">Volver al inicio</a>
        </div>
      </section>
    </main>
  );
}
