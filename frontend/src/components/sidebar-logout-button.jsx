"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { logout } from "../lib/auth-client";

export default function SidebarLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) {
      return;
    }

    setLoading(true);
    await logout().catch(() => null);
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      className="menu-item menu-item-logout"
      onClick={handleLogout}
      disabled={loading}
    >
      <span>↩</span>
      <span>{loading ? "Saliendo..." : "Cerrar sesion"}</span>
    </button>
  );
}
