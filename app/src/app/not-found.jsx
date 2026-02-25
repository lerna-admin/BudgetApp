export default function NotFound() {
  return (
    <main className="status-page">
      <section className="panel status-card">
        <p className="status-code">404</p>
        <h1>No encontramos esta pagina</h1>
        <p className="lead">La ruta que buscas no existe o fue movida. Puedes volver al inicio y continuar desde alli.</p>
        <div className="cta-row">
          <a href="/" className="btn btn-primary">Volver al inicio</a>
          <a href="/login" className="btn btn-secondary">Iniciar sesion</a>
        </div>
      </section>
    </main>
  );
}
