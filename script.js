(() => {
  if (!window.location.hash || !history.replaceState) {
    return;
  }

  const { pathname, search, hash } = window.location;
  window.__initialHash = hash;
  history.replaceState(null, "", `${pathname}${search}`);
})();

(() => {
  const highlightClass = "is-anchor-target";
  const highlightDurationMs = 1800;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let highlightStartTimerId = null;
  let highlightEndTimerId = null;

  function getTargetFromHash(hash) {
    if (!hash || hash === "#") {
      return null;
    }

    return document.getElementById(hash.slice(1));
  }

  function updateHash(hash, replace = false) {
    if (!history.pushState || !history.replaceState) {
      return;
    }

    const url = `${window.location.pathname}${window.location.search}${hash}`;

    if (replace) {
      history.replaceState(null, "", url);
      return;
    }

    history.pushState(null, "", url);
  }

  function clearHighlight() {
    window.clearTimeout(highlightStartTimerId);
    window.clearTimeout(highlightEndTimerId);
    document.querySelectorAll(`.${highlightClass}`).forEach((element) => {
      element.classList.remove(highlightClass);
    });
  }

  function getHighlightElement(target) {
    if (target.classList.contains("proj-thumbnail")) {
      return target.closest(".project-item") || target;
    }

    return target;
  }

  function getHighlightDelayMs(target) {
    if (prefersReducedMotion.matches) {
      return 0;
    }

    const rect = target.getBoundingClientRect();
    const targetCenter = rect.top + (rect.height / 2);
    const viewportCenter = window.innerHeight / 2;
    const distanceFromCenter = Math.abs(targetCenter - viewportCenter);

    return Math.min(950, 220 + (distanceFromCenter * 0.18));
  }

  function triggerHighlight(target) {
    target.classList.remove(highlightClass);
    void target.offsetWidth;
    target.classList.add(highlightClass);

    highlightEndTimerId = window.setTimeout(() => {
      target.classList.remove(highlightClass);
    }, highlightDurationMs);
  }

  function scrollToHashTarget(hash, restoreHash = false) {
    const target = getTargetFromHash(hash);

    if (!target) {
      if (restoreHash && hash) {
        updateHash(hash, true);
      }
      return;
    }

    const isProjectTarget = target.classList.contains("proj-thumbnail");
    const highlightTarget = getHighlightElement(target);
    const highlightDelayMs = isProjectTarget ? getHighlightDelayMs(target) : 0;
    clearHighlight();

    target.scrollIntoView({
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      block: isProjectTarget ? "center" : "start"
    });

    if (restoreHash) {
      updateHash(hash, true);
    }

    if (!isProjectTarget) {
      return;
    }

    highlightStartTimerId = window.setTimeout(() => {
      triggerHighlight(highlightTarget);
    }, highlightDelayMs);
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');

    if (!link) {
      return;
    }

    const hash = link.getAttribute("href");
    const target = getTargetFromHash(hash);

    if (!target) {
      return;
    }

    event.preventDefault();
    window.__initialHash = "";
    updateHash(hash, window.location.hash === hash);
    scrollToHashTarget(hash);
  });

  window.addEventListener("hashchange", () => {
    window.__initialHash = "";
    scrollToHashTarget(window.location.hash);
  });

  window.addEventListener("load", () => {
    if (window.__initialHash) {
      scrollToHashTarget(window.__initialHash, true);
      window.__initialHash = "";
    }
  });
})();
