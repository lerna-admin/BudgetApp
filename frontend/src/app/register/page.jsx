"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "../../components/brand-logo";
import AppShell from "../../components/app-shell";
import { register } from "../../lib/auth-client";

const countries = [
  { value: "CO", label: "Colombia (COP)" },
  { value: "MX", label: "Mexico (MXN)" },
  { value: "BR", label: "Brasil (BRL)" },
];

const profileTemplates = [
  {
    value: "mark-tilbury",
    label: "Tilbury 1% (ahorro/inversion)",
    name: "Tilbury (1%)",
    purpose: "Equilibra ahorro e inversion desde el primer mes.",
    idealFor: "Quieres crecer sin descuidar liquidez.",
  },
  {
    value: "savings-boost",
    label: "Ahorro acelerado",
    name: "Ahorro acelerado",
    purpose: "Sube tu ahorro mensual recortando gastos variables.",
    idealFor: "Tu prioridad es crear colchon rapido.",
  },
  {
    value: "investment-priority",
    label: "Inversion prioritaria",
    name: "Inversion prioritaria",
    purpose: "Aumenta aportes de inversion de forma constante.",
    idealFor: "Aceptas menor gasto libre para invertir mas.",
  },
  {
    value: "debt-focus",
    label: "Pago de deudas",
    name: "Pago de deudas",
    purpose: "Dirige mas flujo a bajar deudas e intereses.",
    idealFor: "Necesitas ordenar caja y reducir cuotas.",
  },
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
  const canSubmit = Boolean(
    formData.name &&
      formData.email &&
      formData.profileTemplate &&
      hasNumber &&
      hasLength &&
      acceptedTerms,
  );

  const selectedProfile = useMemo(
    () => profileTemplates.find((item) => item.value === formData.profileTemplate) || profileTemplates[0],
    [formData.profileTemplate],
  );

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
        profileTemplate: formData.profileTemplate,
      });
      router.push("/");
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
              <p className="brand-sub">Registro de usuario</p>
            </div>
          </a>

          <h2>Crear cuenta</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label" htmlFor="register-name">
                Nombre completo <span className="required">*</span>
              </label>
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
              <label className="form-label" htmlFor="register-email">
                Correo <span className="required">*</span>
              </label>
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
              <label className="form-label" htmlFor="register-password">
                Contrasena <span className="required">*</span>
              </label>
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
              <label className="form-label" htmlFor="register-country">
                Pais <span className="required">*</span>
              </label>
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
              <div className="form-label-row">
                <label className="form-label" htmlFor="register-template" style={{ marginBottom: 0 }}>
                  Perfil sugerido <span className="required">*</span>
                </label>
                <span className="info-dot" title="Define una guia inicial para arrancar tu primer presupuesto">i</span>
              </div>
              <select
                id="register-template"
                className="input"
                value={formData.profileTemplate}
                onChange={(event) => setFormData((prev) => ({ ...prev, profileTemplate: event.target.value }))}
                required
              >
                {profileTemplates.map((profile) => (
                  <option key={profile.value} value={profile.value}>{profile.label}</option>
                ))}
              </select>

              <div className="profile-info-box">
                <div className="profile-alert-head">
                  <p className="profile-alert-title">Alerta de lectura</p>
                  <span className="profile-alert-badge">Importante</span>
                </div>
                <p className="profile-alert-name">{selectedProfile.name}</p>
                <p className="profile-alert-text">
                  <strong>Sirve para:</strong> {selectedProfile.purpose}
                </p>
                <p className="profile-alert-text">
                  <strong>Ideal si:</strong> {selectedProfile.idealFor}
                </p>
                <p className="profile-alert-note">
                  Puedes cambiar estos porcentajes cuando crees tu presupuesto.
                </p>
              </div>
            </div>

            <div className="row-between" style={{ justifyContent: "flex-start" }}>
              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                />
                <span>Acepto terminos y privacidad <span className="required">*</span></span>
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
