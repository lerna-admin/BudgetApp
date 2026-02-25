"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "../../components/brand-logo";
import AppShell from "../../components/app-shell";
import { login } from "../../lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login({ email, password });
      const search = typeof window !== "undefined" ? window.location.search : "";
      const nextPath = new URLSearchParams(search).get("next") || "/profile";
      router.push(nextPath);
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell className="auth-shell">
      <section className="auth-single">
        <section className="auth-main panel auth-single-card">
          <a href="/" className="brand-lockup brand-inline" style={{ marginBottom: 14 }}>
            <BrandLogo />
            <div>
              <p className="brand-name">BudgetApp</p>
              <p className="brand-sub">Acceso de usuario</p>
            </div>
          </a>

          <h2>Iniciar sesion</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label" htmlFor="login-email">Correo</label>
              <input
                id="login-email"
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="login-password">Contrasena</label>
              <input
                id="login-password"
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimo 8 caracteres"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="row-between">
              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Recordarme</span>
              </label>
              <a href="#" className="helper-link">Recuperar acceso</a>
            </div>

            <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Entrar"}
            </button>

            {error ? <p className="message message-error">{error}</p> : null}

            <p className="form-foot">
              Aun no tienes cuenta? <a href="/register">Crear cuenta</a>
            </p>
          </form>
        </section>
      </section>
    </AppShell>
  );
}
