"use client";

export default function MobileMenuBackdrop() {
  function close() {
    document.body.classList.remove("nav-open");
  }

  return (
    <button
      type="button"
      className="mobile-nav-backdrop"
      aria-label="Cerrar menu"
      onClick={close}
    />
  );
}
