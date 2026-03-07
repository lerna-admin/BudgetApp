"use client";

import { useState } from "react";

import AppShell from "../../components/app-shell";
import BrandLogo from "../../components/brand-logo";
import { forgotPassword } from "../../lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentMessage, setSentMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSentMessage("");

    try {
      const response = await forgotPassword({ email });
      setSentMessage(response?.message || "Si el correo existe, enviamos un enlace de recuperacion.");
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
              <p className="brand-sub">Recuperar acceso</p>
            </div>
          </a>

          <h2>Recuperar contrasena</h2>
          <p className="lead" style={{ marginBottom: 14 }}>
            Escribe tu correo y te enviaremos un enlace para restablecer tu acceso.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label" htmlFor="forgot-email">Correo</label>
              <input
                id="forgot-email"
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                required
              />
            </div>

            <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>

            {sentMessage ? <p className="message message-ok">{sentMessage}</p> : null}
            {error ? <p className="message message-error">{error}</p> : null}

            <p className="form-foot">
              <a href="/login">Volver a iniciar sesion</a>
            </p>
          </form>
        </section>
      </section>
    </AppShell>
  );
}
