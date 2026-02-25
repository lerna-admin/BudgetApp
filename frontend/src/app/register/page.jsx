"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/app-shell";
import { register } from "../../lib/auth-client";

const countries = [
  { value: "CO", label: "Colombia (COP)" },
  { value: "MX", label: "Mexico (MXN)" },
  { value: "BR", label: "Brasil (BRL)" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    countryCode: "CO",
    profileTemplate: "mark-tilbury",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const hasNumber = useMemo(() => /\d/.test(formData.password), [formData.password]);
  const hasLength = formData.password.length >= 8;
  const canSubmit = formData.name && formData.email && hasNumber && hasLength && acceptedTerms;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit || loading) {
      if (!acceptedTerms) {
        setError("Debes aceptar terminos y privacidad para continuar");
      }
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        countryCode: formData.countryCode,
      });
      router.push("/profile");
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
            <span className="brand-mark">B</span>
            <div>
              <p className="brand-name">BudgetApp</p>
              <p className="brand-sub">Registro de usuario</p>
            </div>
          </a>

          <h2>Crear cuenta</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label" htmlFor="register-name">Nombre completo</label>
              <input
                id="register-name"
                className="input"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Tu nombre"
                autoComplete="name"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="register-email">Correo</label>
              <input
                id="register-email"
                className="input"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="tu@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="register-password">Contrasena</label>
              <input
                id="register-password"
                className="input"
                type="password"
                minLength={8}
                value={formData.password}
                onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
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
              <label className="form-label" htmlFor="register-country">Pais</label>
              <select
                id="register-country"
                className="input"
                value={formData.countryCode}
                onChange={(event) => setFormData((prev) => ({ ...prev, countryCode: event.target.value }))}
              >
                {countries.map((country) => (
                  <option key={country.value} value={country.value}>{country.label}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="register-template">Perfil sugerido</label>
              <select
                id="register-template"
                className="input"
                value={formData.profileTemplate}
                onChange={(event) => setFormData((prev) => ({ ...prev, profileTemplate: event.target.value }))}
              >
                <option value="mark-tilbury">Tilbury 1% ahorro / inversion</option>
                <option value="growth-journey">Crecimiento patrimonial</option>
                <option value="cashflow-starter">Control de flujo inicial</option>
              </select>
            </div>

            <div className="row-between" style={{ justifyContent: "flex-start" }}>
              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                />
                <span>Acepto terminos y privacidad</span>
              </label>
            </div>

            <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={!canSubmit || loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>

            {error ? <p className="message message-error">{error}</p> : null}

            <p className="form-foot">
              Ya tienes cuenta? <a href="/login">Inicia sesion</a>
            </p>
          </form>
        </section>
      </section>
    </AppShell>
  );
}
