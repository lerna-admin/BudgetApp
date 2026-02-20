export default function HomePage() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      background: "linear-gradient(135deg, #0f172a, #1d4ed8)",
      color: "#fff",
    }}>
      <h1 style={{ margin: 0, fontSize: "2.75rem", letterSpacing: "0.08em" }}>BudgetApp Frontend</h1>
      <p style={{ marginTop: "1rem", fontSize: "1.125rem" }}>
        Primer prototipo para consumir la API MVC y demostrar el nuevo flujo de perfiles y objetivos.
      </p>
      <p style={{ marginTop: "2rem", fontSize: "1rem", color: "rgba(255,255,255,0.75)" }}>
        Ejecuta `npm run dev` dentro de `frontend/` para iniciar Next.js en el puerto 3000.
      </p>
    </main>
  );
}
