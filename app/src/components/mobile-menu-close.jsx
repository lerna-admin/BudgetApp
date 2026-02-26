"use client";

export default function MobileMenuClose() {
  function close() {
    document.body.classList.remove("nav-open");
  }

  return (
    <button
      type="button"
      className="mobile-menu-close"
      aria-label="Cerrar menu"
      onClick={close}
    >
      ✕
    </button>
  );
}
