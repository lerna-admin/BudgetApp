import nodemailer from "nodemailer";

let transporter;

function hasSmtpUrl() {
  return Boolean(process.env.SMTP_URL);
}

function hasHostConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

export function isMailerConfigured() {
  return hasSmtpUrl() || hasHostConfig();
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (process.env.SMTP_URL) {
    transporter = nodemailer.createTransport(process.env.SMTP_URL);
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

function getSenderAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@budgetapp.local";
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  if (!isMailerConfigured()) {
    throw new Error("mailer_not_configured");
  }

  const mail = {
    from: getSenderAddress(),
    to,
    replyTo: process.env.SMTP_REPLY_TO || undefined,
    subject: "Recupera tu acceso a BudgetApp",
    text: [
      `Hola ${name || ""},`,
      "",
      "Recibimos una solicitud para restablecer tu contrasena.",
      "Usa este enlace para crear una nueva contrasena:",
      resetUrl,
      "",
      "Este enlace vence pronto y solo se puede usar una vez.",
      "Si no solicitaste este cambio, puedes ignorar este correo.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f1224; line-height: 1.5;">
        <h2 style="margin-bottom: 8px;">Recupera tu acceso a BudgetApp</h2>
        <p>Hola ${name || ""},</p>
        <p>Recibimos una solicitud para restablecer tu contrasena.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 14px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
            Restablecer contrasena
          </a>
        </p>
        <p>Si el boton no abre, copia y pega este enlace en tu navegador:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Este enlace vence pronto y solo se puede usar una vez.</p>
        <p>Si no solicitaste este cambio, ignora este correo.</p>
      </div>
    `,
  };

  await getTransporter().sendMail(mail);
}
