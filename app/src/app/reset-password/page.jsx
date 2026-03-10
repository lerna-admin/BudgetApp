"use client";

import { useEffect, useState } from "react";

import AppShell from "../../components/app-shell";
import BrandLogo from "../../components/brand-logo";
import { resetPassword } from "../../lib/auth-client";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = new URLSearchParams(window.location.search);
    setToken(query.get("token") || "");
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!token) {
      setError("El enlace no tiene token de recuperacion.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }
    if (!hasLength) {
      setError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword({ token, password });
      setSuccessMessage(response?.message || "Contrasena actualizada. Ya puedes iniciar sesion.");
      setPassword("");
      setConfirmPassword("");
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
              <p className="brand-sub">Restablecer contrasena</p>
            </div>
          </a>

          <h2>Nueva contrasena</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label" htmlFor="reset-password">Contrasena nueva</label>
              <input
                id="reset-password"
                className="input"
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimo 8 caracteres"
                autoComplete="new-password"
                required
              />
              <div className="password-rules">
                <span className={`rule ${hasLength ? "rule-ok" : ""}`}>8+ caracteres</span>
                <span className={`rule ${hasNumber ? "rule-ok" : ""}`}>Incluye al menos un numero</span>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="reset-password-confirm">Confirmar contrasena</label>
              <input
                id="reset-password-confirm"
                className="input"
                type="password"
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite la contrasena"
                autoComplete="new-password"
                required
              />
            </div>

            <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={loading}>
              {loading ? "Actualizando..." : "Restablecer contrasena"}
            </button>

            {successMessage ? <p className="message message-ok">{successMessage}</p> : null}
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
