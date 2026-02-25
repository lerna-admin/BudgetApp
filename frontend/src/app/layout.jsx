import "./globals.css";

export const metadata = {
  title: "BudgetApp",
  description: "Login, registro y perfil en Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
