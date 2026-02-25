"use client";

import { useEffect, useState } from "react";

function isOpen() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.body.classList.contains("nav-open");
}

export default function MobileMenuToggle() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isOpen());

    const body = document.body;
    if (!body || typeof MutationObserver === "undefined") {
      return undefined;
    }

    const observer = new MutationObserver(() => {
      setOpen(body.classList.contains("nav-open"));
    });

    observer.observe(body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function close() {
      document.body.classList.remove("nav-open");
    }

    function handleKey(event) {
      if (event.key === "Escape") {
        close();
      }
    }

    function handleResize() {
      if (window.matchMedia("(min-width: 1121px)").matches) {
        close();
      }
    }

    window.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function toggle() {
    const next = !isOpen();
    document.body.classList.toggle("nav-open", next);
    setOpen(next);
  }

  return (
    <button
      type="button"
      className="mobile-menu-toggle"
      aria-label={open ? "Cerrar menu" : "Abrir menu"}
      aria-expanded={open ? "true" : "false"}
      onClick={toggle}
    >
      ☰
    </button>
  );
}
