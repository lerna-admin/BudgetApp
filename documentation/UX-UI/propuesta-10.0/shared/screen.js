(function () {
  const frameId = window.name || window.location.pathname || "frame";

  function getDocumentHeight() {
    const doc = document.documentElement;
    const body = document.body;
    return Math.max(
      doc ? doc.scrollHeight : 0,
      doc ? doc.offsetHeight : 0,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0,
    );
  }

  let raf = null;
  function postHeight() {
    if (typeof window === "undefined" || typeof window.parent === "undefined") {
      return;
    }

    if (raf) {
      cancelAnimationFrame(raf);
    }

    raf = requestAnimationFrame(() => {
      raf = null;
      window.parent.postMessage(
        { type: "budgetapp:resize", id: frameId, height: getDocumentHeight() },
        "*",
      );
    });
  }

  window.addEventListener("load", postHeight);
  window.addEventListener("resize", postHeight);

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(postHeight);
    observer.observe(document.documentElement);
    if (document.body) {
      observer.observe(document.body);
    }
  } else {
    window.setInterval(postHeight, 800);
  }

  function setupMobileNav() {
    const sidebar = document.querySelector(".dashboard-sidebar");
    const topbar = document.querySelector(".dashboard-topbar");
    if (!sidebar || !topbar) {
      return;
    }

    const body = document.body;
    if (!body) {
      return;
    }

    // Backdrop (click to close). Created once per page.
    let backdrop = document.querySelector(".mobile-nav-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("button");
      backdrop.type = "button";
      backdrop.className = "mobile-nav-backdrop";
      backdrop.setAttribute("aria-label", "Cerrar menu");
      body.append(backdrop);
    }

    // Close button inside the menu.
    let closeBtn = sidebar.querySelector(".mobile-menu-close");
    if (!closeBtn) {
      closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "mobile-menu-close";
      closeBtn.setAttribute("aria-label", "Cerrar menu");
      closeBtn.textContent = "✕";
      sidebar.prepend(closeBtn);
    }

    // Toggle button in the topbar. We inject it to avoid duplicating markup in every screen.
    const topbarLeft = topbar.firstElementChild;
    if (!topbarLeft || topbarLeft.tagName !== "DIV") {
      return;
    }

    let toggleBtn = topbar.querySelector(".mobile-menu-toggle");
    if (!toggleBtn) {
      toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "mobile-menu-toggle";
      toggleBtn.textContent = "☰";
      toggleBtn.setAttribute("aria-label", "Abrir menu");
      toggleBtn.setAttribute("aria-expanded", "false");
    }

    let heading = topbarLeft.querySelector(".dashboard-heading");
    if (!heading) {
      heading = document.createElement("div");
      heading.className = "dashboard-heading";

      while (topbarLeft.firstChild) {
        heading.append(topbarLeft.firstChild);
      }

      topbarLeft.classList.add("dashboard-topbar-left");
      topbarLeft.append(toggleBtn);
      topbarLeft.append(heading);
    } else if (!toggleBtn.parentElement) {
      topbarLeft.insertBefore(toggleBtn, heading);
      topbarLeft.classList.add("dashboard-topbar-left");
    }

    function setExpanded(next) {
      const expanded = Boolean(next);
      toggleBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
    }

    function openNav() {
      body.classList.add("nav-open");
      setExpanded(true);
    }

    function closeNav() {
      body.classList.remove("nav-open");
      setExpanded(false);
    }

    function toggleNav() {
      if (body.classList.contains("nav-open")) {
        closeNav();
      } else {
        openNav();
      }
    }

    toggleBtn.addEventListener("click", toggleNav);
    closeBtn.addEventListener("click", closeNav);
    backdrop.addEventListener("click", closeNav);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeNav();
      }
    });

    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 1121px)").matches) {
        closeNav();
      }
    });
  }

  window.addEventListener("DOMContentLoaded", setupMobileNav);
})();
