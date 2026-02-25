import "./globals.css";

export const metadata = {
  title: "BudgetApp",
  description: "Login, registro y perfil en Next.js",
  icons: {
    icon: "/assets/images/logo_9_transparent.png",
    shortcut: "/assets/images/logo_9_transparent.png",
    apple: "/assets/images/logo_9_transparent.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
