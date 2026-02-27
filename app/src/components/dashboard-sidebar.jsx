import BrandLogo from "./brand-logo";
import MobileMenuClose from "./mobile-menu-close";
import SidebarLogoutButton from "./sidebar-logout-button";

const menuSections = [
  {
    title: "Principal",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "🏠", href: "/" },
      { id: "budget", label: "Presupuesto", icon: "📊", href: "#" },
      { id: "expenses", label: "Registro de movimientos", icon: "✏️", href: "/gastos" },
      { id: "goals", label: "Metas", icon: "🎯", href: "#" },
    ],
  },
  {
    title: "Herramientas",
    items: [{ id: "split", label: "Dividir cuentas", icon: "🧰", href: "/herramientas/dividir-cuentas" }],
  },
  {
    title: "Config.",
    items: [
      { id: "banks", label: "Bancos", icon: "🏦", href: "/bancos" },
      { id: "debts", label: "Deudas", icon: "💳", href: "/deudas" },
      { id: "categories", label: "Categorias", icon: "🗂️", href: "#" },
      { id: "edges", label: "Aristas", icon: "🔺", href: "#" },
      { id: "rules", label: "Reglas", icon: "🤖", href: "#" },
      { id: "alerts", label: "Alertas", icon: "🔔", href: "#" },
      { id: "import", label: "Importar", icon: "📤", href: "#" },
      { id: "theme", label: "Tema", icon: "🎨", href: "#" },
    ],
  },
  {
    title: "Cuenta",
    items: [
      { id: "profile", label: "Perfil", icon: "👤", href: "/profile" },
      { id: "reports", label: "Reportes", icon: "📈", href: "#" },
    ],
  },
];

export default function DashboardSidebar({ activeItem, user }) {
  const safeUser = user || { name: "Usuario", email: "usuario@budgetapp.co" };

  return (
    <aside className="dashboard-sidebar">
      <MobileMenuClose />
      <div className="dashboard-brand">
        <BrandLogo className="menu-logo" />
        <div>
          <p className="brand-name">BudgetApp</p>
          <p className="brand-sub">Menu principal</p>
        </div>
      </div>

      {menuSections.map((section) => (
        <div key={section.title} className="menu-section">
          <p className="menu-title">{section.title}</p>
          <div className="menu-list">
            {section.items.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={`menu-item ${item.id === activeItem ? "active" : ""}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      ))}

      <div className="menu-user">
        <p className="menu-user-name">{safeUser.name}</p>
        <p className="menu-user-mail">{safeUser.email}</p>
      </div>

      <SidebarLogoutButton />
    </aside>
  );
}
