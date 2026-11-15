document.addEventListener("DOMContentLoaded", () => {
  /* =========================================
       SIDEBAR: ELEMENTS
    ========================================= */
  const sidebar = document.getElementById("leftSidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const sidebarBubble = document.getElementById("sidebarBubble");
  const navLinks = document.querySelectorAll(".side-nav__link");

  /* =========================================
       SIDEBAR: LIQUID NOTCH + ACTIVE BUBBLE
    ========================================= */
  const SHAPE = { top: 0, bottom: 0, left: 0, item: 54, ready: false };
  const CORNER = 26;
  const FILLET = 22;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let glide = null;
  let glideRaf = 0;

  function clamp01(v) { return Math.min(1, Math.max(0, v)); }
  function lerp(a, b, k) { return a + (b - a) * k; }

  function easeOutBack(x) {
    const c1 = 1.05, c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function measureActive() {
    const active = sidebar.querySelector(".side-nav__link.is-active");
    if (!active) return null;

    const sb = sidebar.getBoundingClientRect();
    const tab = active.getBoundingClientRect();

    if (sb.width === 0 || tab.height === 0) return null;

    return {
      link: active,
      top: tab.top - sb.top,
      bottom: tab.bottom - sb.top,
      left: tab.left - sb.left,
    };
  }

  function buildPath(W, H, top, bottom, left) {
    const h = bottom - top;
    const r = Math.min(h / 2, 27);
    const f = Math.max(0, Math.min(FILLET, top - CORNER, H - CORNER - bottom));
    const n = (v) => v.toFixed(2);

    return (
      "M0 0 H" + n(W - CORNER) +
      " A" + CORNER + " " + CORNER + " 0 0 1 " + n(W) + " " + CORNER +
      " V" + n(top - f) + " A" + n(f) + " " + n(f) + " 0 0 1 " + n(W - f) + " " + n(top) +
      " H" + n(left + r) + " A" + n(r) + " " + n(r) + " 0 0 0 " + n(left) + " " + n(top + r) +
      " V" + n(bottom - r) + " A" + n(r) + " " + n(r) + " 0 0 0 " + n(left + r) + " " + n(bottom) +
      " H" + n(W - f) + " A" + n(f) + " " + n(f) + " 0 0 1 " + n(W) + " " + n(bottom + f) +
      " V" + n(H - CORNER) + " A" + CORNER + " " + CORNER + " 0 0 1 " + n(W - CORNER) + " " + n(H) + " H0 Z"
    );
  }

  function renderShape() {
    const W = sidebar.offsetWidth;
    const H = sidebar.offsetHeight;
    const size = sidebarBubble.offsetWidth || 44;

    sidebar.style.setProperty("--sidebar-clip", "path('" + buildPath(W, H, SHAPE.top, SHAPE.bottom, SHAPE.left) + "')");

    const x = SHAPE.left + (SHAPE.item - size) / 2;
    const y = (SHAPE.top + SHAPE.bottom) / 2 - size / 2;

    sidebarBubble.style.transform = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0)";
    sidebar.classList.add("is-shaped");
  }

  function glideStep(now) {
    glideRaf = 0;
    if (!glide) return;

    const to = measureActive();
    if (!to) { glide = null; return; }

    const t = now - glide.t0;
    const LEAD = 380, TRAIL = 580;
    const dTop = glide.down ? TRAIL : LEAD;
    const dBottom = glide.down ? LEAD : TRAIL;

    const kTop = glide.down ? easeInOutCubic(clamp01(t / dTop)) : easeOutBack(clamp01(t / dTop));
    const kBottom = glide.down ? easeOutBack(clamp01(t / dBottom)) : easeInOutCubic(clamp01(t / dBottom));
    const kLeft = easeOutBack(clamp01(t / LEAD));

    SHAPE.top = lerp(glide.from.top, to.top, kTop);
    SHAPE.bottom = lerp(glide.from.bottom, to.bottom, kBottom);
    SHAPE.left = lerp(glide.from.left, to.left, kLeft);
    SHAPE.item = to.bottom - to.top;
    renderShape();

    if (t < TRAIL) {
      glideRaf = requestAnimationFrame(glideStep);
    } else {
      glide = null;
      SHAPE.top = to.top;
      SHAPE.bottom = to.bottom;
      SHAPE.left = to.left;
      renderShape();
    }
  }

  function updateSidebarShape(opts) {
    const m = measureActive();
    if (!m) {
      sidebar.style.removeProperty("--sidebar-clip");
      sidebar.classList.remove("is-shaped");
      return;
    }

    const accent = getComputedStyle(m.link).getPropertyValue("--accent").trim();
    if (accent) sidebar.style.setProperty("--bubble-color", accent);

    if (opts && opts.animate && SHAPE.ready && !reduceMotion.matches) {
      glide = {
        t0: performance.now(),
        from: { top: SHAPE.top, bottom: SHAPE.bottom, left: SHAPE.left },
        down: m.top >= SHAPE.top,
      };
      if (!glideRaf) glideRaf = requestAnimationFrame(glideStep);
      return;
    }

    if (glide) return;

    SHAPE.top = m.top;
    SHAPE.bottom = m.bottom;
    SHAPE.left = m.left;
    SHAPE.item = m.bottom - m.top;
    SHAPE.ready = true;
    renderShape();
  }

  let trackRaf = 0;
  function trackShape(ms) {
    cancelAnimationFrame(trackRaf);
    const end = performance.now() + ms;
    (function loop() {
      updateSidebarShape();
      if (performance.now() < end) trackRaf = requestAnimationFrame(loop);
    })();
  }

  if (window.ResizeObserver) {
    new ResizeObserver(() => updateSidebarShape()).observe(sidebar);
  }
  window.addEventListener("resize", () => updateSidebarShape());

  /* =========================================
       SIDEBAR: NAVIGATION + MOBILE DRAWER
    ========================================= */
  function closeSidebar() {
    sidebar.classList.remove("is-open");
    sidebarBackdrop.classList.remove("is-visible");
    sidebarToggle.setAttribute("aria-expanded", "false");
  }

  sidebarToggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("is-open");
    sidebarBackdrop.classList.toggle("is-visible", isOpen);
    sidebarToggle.setAttribute("aria-expanded", String(isOpen));
  });

  sidebarBackdrop.addEventListener("click", closeSidebar);

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      if (link.dataset.placeholder === "true") e.preventDefault();

      if (!link.classList.contains("is-active")) {
        navLinks.forEach((item) => {
          item.classList.remove("is-active");
          item.removeAttribute("aria-current");
        });
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
        updateSidebarShape({ animate: true });
      }
      closeSidebar();
    });
  });

  /* =========================================
       SIDEBAR: DESKTOP MINIMIZE / MAXIMIZE
    ========================================= */
  const sidebarCollapse = document.getElementById("sidebarCollapse");
  const SIDEBAR_KEY = "equiwork.sidebar.collapsed";
  const narrowDesktop = window.matchMedia("(min-width: 851px) and (max-width: 1100px)");
  let userToggledNarrow = false;

  function readSavedCollapsed() {
    try { return localStorage.getItem(SIDEBAR_KEY) === "1"; } catch (err) { return false; }
  }

  function setSidebarCollapsed(collapsed, persist) {
    sidebar.classList.toggle("is-collapsed", collapsed);
    sidebarCollapse.setAttribute("aria-expanded", String(!collapsed));
    const label = collapsed ? "Maximize sidebar" : "Minimize sidebar";
    sidebarCollapse.setAttribute("aria-label", label);
    sidebarCollapse.setAttribute("title", label);

    if (persist) {
      try { localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0"); } catch (err) {}
    }
    trackShape(460);
  }

  sidebarCollapse.addEventListener("click", () => {
    const next = !sidebar.classList.contains("is-collapsed");
    userToggledNarrow = narrowDesktop.matches;
    setSidebarCollapsed(next, !narrowDesktop.matches);
  });

  narrowDesktop.addEventListener("change", () => {
    if (narrowDesktop.matches) {
      if (!userToggledNarrow) setSidebarCollapsed(true, false);
    } else {
      userToggledNarrow = false;
      setSidebarCollapsed(readSavedCollapsed(), false);
    }
  });

  sidebar.classList.add("no-anim");
  setSidebarCollapsed(narrowDesktop.matches ? true : readSavedCollapsed(), false);
  updateSidebarShape();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      sidebar.classList.remove("no-anim");
      updateSidebarShape();
    });
  });

  /* =========================================
       JOB ELEMENTS & SEARCH / FILTERS
    ========================================= */
  const jobListings = document.getElementById("jobListings");
  const jobSearch = document.getElementById("jobSearch");
  const clearJobSearch = document.getElementById("clearJobSearch");
  const locationInput = document.getElementById("locationInput");
  const clearLocation = document.getElementById("clearLocation");
  const resultsCount = document.getElementById("resultsCount");
  const noResults = document.getElementById("noResults");
  const filterBadge = document.getElementById("filterBadge");
  const cards = Array.from(document.querySelectorAll(".job-card"));

  function syncClearButtons() {
    clearLocation.hidden = locationInput.value.length === 0;
    clearJobSearch.hidden = jobSearch.value.length === 0;
  }

  clearJobSearch.addEventListener("click", () => {
    jobSearch.value = "";
    syncClearButtons();
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-on"));
    jobSearch.focus();
    filterJobs();
  });

  document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    filterJobs();
  });

  /* =========================================
       FILTER POPOVER & DROPDOWNS
    ========================================= */
  const filterBtn = document.getElementById("filterBtn");
  const filterPanel = document.getElementById("filterPanel");

  function setFilterPanel(open) {
    filterPanel.classList.toggle("is-open", open);
    filterBtn.classList.toggle("is-on", open);
    filterBtn.setAttribute("aria-expanded", String(open));
    if (!open) closeAllDropdowns(null);
  }

  filterBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeLocations();
    closeAllDropdowns(null);
    setFilterPanel(!filterPanel.classList.contains("is-open"));
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".filter-wrap")) setFilterPanel(false);
  });

  document.getElementById("clearFilters").addEventListener("click", () => {
    resetFilterDropdowns();
    filterJobs();
  });

  function closeAllDropdowns(except) {
    document.querySelectorAll(".dd.is-open").forEach((dd) => {
      if (dd !== except) {
        dd.classList.remove("is-open");
        const btn = dd.querySelector(".dd__btn");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  function updateActiveFilterBadge() {
    let activeCount = 0;
    document.querySelectorAll(".filters .dd").forEach((dd) => {
      if (dd.dataset.value && dd.dataset.value !== "all") activeCount++;
    });
    if (activeCount > 0) {
      filterBadge.textContent = String(activeCount);
      filterBadge.hidden = false;
    } else {
      filterBadge.hidden = true;
    }
  }

  document.querySelectorAll(".dd").forEach((dd) => {
    const button = dd.querySelector(".dd__btn");
    const label = dd.querySelector(".dd__label");
    const items = dd.querySelectorAll(".dd__menu li");
    const isSort = dd.classList.contains("dd--sort");

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      closeLocations();
      closeAllDropdowns(dd);
      const isOpen = dd.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
    });

    items.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        items.forEach((li) => {
          li.classList.remove("is-selected");
          li.setAttribute("aria-selected", "false");
        });
        item.classList.add("is-selected");
        item.setAttribute("aria-selected", "true");

        label.textContent = item.textContent;
        dd.dataset.value = item.dataset.value;
        dd.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");

        if (isSort) {
          applySorting(item.dataset.value);
        } else {
          dd.classList.toggle("has-value", item.dataset.value !== "all");
          updateActiveFilterBadge();
          filterJobs();
        }
      });
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dd")) closeAllDropdowns(null);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllDropdowns(null);
      closeLocations();
      setFilterPanel(false);
      account.classList.remove("is-open");
      accountBtn.setAttribute("aria-expanded", "false");
    }
  });

  function getFilterValue(name) {
    for (const dd of document.querySelectorAll(".filters .dd")) {
      if (dd.dataset.filter === name) return dd.dataset.value || "all";
    }
    return "all";
  }

  function filterJobs() {
    const searchValue = jobSearch.value.toLowerCase().trim();
    const locationValue = locationInput.value.toLowerCase().trim();
    const payFilter = getFilterValue("Pay");
    const typeFilter = getFilterValue("Type");
    const remoteFilter = getFilterValue("Remote");
    const classificationFilter = getFilterValue("Classification");

    let visibleCount = 0;

    cards.forEach((card) => {
      const title = card.dataset.title.toLowerCase();
      const company = card.dataset.company.toLowerCase();
      const location = card.dataset.location.toLowerCase();
      const description = card.querySelector(".job-card__description").textContent.toLowerCase();

      const cardPay = Number(card.dataset.pay);
      const cardType = card.dataset.type;
      const cardWork = card.dataset.work;
      const cardClassification = card.dataset.classification;

      const searchableText = title + " " + company + " " + location + " " + description;
      const matchesSearch = searchableText.includes(searchValue);
      const matchesLocation = !locationValue || location.includes(locationValue);
      const matchesType = typeFilter === "all" || cardType === typeFilter;
      const matchesRemote = remoteFilter === "all" || cardWork === remoteFilter;

      let matchesPay = true;
      if (payFilter === "under20") matchesPay = cardPay < 20000;
      else if (payFilter === "20to40") matchesPay = cardPay >= 20000 && cardPay <= 40000;
      else if (payFilter === "over40") matchesPay = cardPay > 40000;

      const matchesClassification = classificationFilter === "all" || cardClassification === classificationFilter;

      const showCard = matchesSearch && matchesLocation && matchesType && matchesRemote && matchesPay && matchesClassification;
      card.classList.toggle("is-hidden", !showCard);

      if (showCard) visibleCount++;
    });

    resultsCount.textContent = "Showing " + visibleCount + (visibleCount === 1 ? " Job Result" : " Job Results");
    noResults.hidden = visibleCount !== 0;
  }

  jobSearch.addEventListener("input", () => {
    syncClearButtons();
    filterJobs();
  });

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const wasActive = chip.classList.contains("is-on");
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-on"));
      if (wasActive) {
        jobSearch.value = "";
      } else {
        chip.classList.add("is-on");
        const keyword = chip.textContent.trim();
        jobSearch.value = keyword !== "Your skill" ? keyword : "";
      }
      syncClearButtons();
      filterJobs();
    });
  });

  /* =========================================
       LOCATION AUTOCOMPLETE
    ========================================= */
  const LOCATIONS = [
    "Batangas City", "Lipa City", "Tanauan City", "Santo Tomas", "Manila",
    "Quezon City", "Makati", "Taguig", "Pasig", "Cebu City", "Davao City",
    "Baguio", "Iloilo City", "Cagayan de Oro", "Remote / Work from home"
  ];
  const locationMenu = document.getElementById("locationMenu");
  const locationWrapper = document.querySelector(".search__loc");

  function renderLocations() {
    const query = locationInput.value.toLowerCase().trim();
    const filtered = LOCATIONS.filter((loc) => loc.toLowerCase().includes(query));
    locationMenu.innerHTML = "";

    if (!query) {
      const heading = document.createElement("li");
      heading.className = "loc__head";
      heading.textContent = "Popular locations";
      locationMenu.appendChild(heading);
    }

    filtered.forEach((location) => {
      const item = document.createElement("li");
      item.textContent = location;
      item.setAttribute("role", "option");
      item.addEventListener("click", () => {
        locationInput.value = location;
        syncClearButtons();
        closeLocations();
        filterJobs();
      });
      locationMenu.appendChild(item);
    });

    if (filtered.length === 0) {
      const empty = document.createElement("li");
      empty.className = "loc__empty";
      empty.textContent = "Use your entered location";
      locationMenu.appendChild(empty);
    }
  }

  function openLocations() {
    renderLocations();
    locationWrapper.classList.add("is-open");
  }

  function closeLocations() {
    locationWrapper.classList.remove("is-open");
  }

  locationInput.addEventListener("focus", () => {
    setFilterPanel(false);
    openLocations();
  });

  locationInput.addEventListener("input", () => {
    syncClearButtons();
    openLocations();
    filterJobs();
  });

  clearLocation.addEventListener("click", () => {
    locationInput.value = "";
    syncClearButtons();
    locationInput.focus();
    openLocations();
    filterJobs();
  });

  document.addEventListener("click", (e) => {
    if (!locationWrapper.contains(e.target)) closeLocations();
  });

  /* =========================================
       SORT, VIEWS & SAVE
    ========================================= */
  const sortDropdown = document.getElementById("sortDropdown");
  const sortLabel = document.getElementById("sortLabel");

  function applySorting(sortValue) {
    const sortedCards = [...cards];
    if (sortValue === "newest") {
      sortedCards.sort((a, b) => Number(b.dataset.date) - Number(a.dataset.date));
    } else if (sortValue === "oldest") {
      sortedCards.sort((a, b) => Number(a.dataset.date) - Number(b.dataset.date));
    } else if (sortValue === "title") {
      sortedCards.sort((a, b) => a.dataset.title.localeCompare(b.dataset.title));
    }
    sortedCards.forEach((card) => jobListings.appendChild(card));
    filterJobs();
  }

  const gridView = document.getElementById("gridView");
  const listView = document.getElementById("listView");

  gridView.addEventListener("click", () => {
    jobListings.classList.remove("list-view");
    gridView.classList.add("is-on");
    listView.classList.remove("is-on");
    gridView.setAttribute("aria-pressed", "true");
    listView.setAttribute("aria-pressed", "false");
  });

  listView.addEventListener("click", () => {
    jobListings.classList.add("list-view");
    listView.classList.add("is-on");
    gridView.classList.remove("is-on");
    listView.setAttribute("aria-pressed", "true");
    gridView.setAttribute("aria-pressed", "false");
  });

  document.querySelectorAll(".save-job-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const saved = button.classList.toggle("is-saved");
      button.textContent = saved ? "★ Saved" : "☆ Save Job";
      button.setAttribute("aria-pressed", String(saved));
    });
  });

  function resetFilterDropdowns() {
    document.querySelectorAll(".filters .dd").forEach((dd) => {
      dd.dataset.value = "all";
      const label = dd.querySelector(".dd__label");
      label.textContent = label.dataset.default;
      dd.classList.remove("has-value", "is-open");
      dd.querySelector(".dd__btn").setAttribute("aria-expanded", "false");
      dd.querySelectorAll("li").forEach((li) => {
        const isDefault = li.dataset.value === "all";
        li.classList.toggle("is-selected", isDefault);
        li.setAttribute("aria-selected", String(isDefault));
      });
    });
    updateActiveFilterBadge();
  }

  document.getElementById("resetFilters").addEventListener("click", () => {
    jobSearch.value = "";
    locationInput.value = "";
    syncClearButtons();
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-on"));
    resetFilterDropdowns();
    sortDropdown.dataset.value = "newest";
    sortLabel.textContent = "Newest";
    sortDropdown.querySelectorAll("li").forEach((li) => {
      const isNewest = li.dataset.value === "newest";
      li.classList.toggle("is-selected", isNewest);
      li.setAttribute("aria-selected", String(isNewest));
    });
    applySorting("newest");
  });

  const account = document.querySelector(".account");
  const accountBtn = document.getElementById("accountBtn");

  accountBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = account.classList.toggle("is-open");
    accountBtn.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (e) => {
    if (!account.contains(e.target)) {
      account.classList.remove("is-open");
      accountBtn.setAttribute("aria-expanded", "false");
    }
  });

  syncClearButtons();
  applySorting("newest");

  /* =========================================
       SLIDING DRAWER INTERACTION
    ========================================= */
  const overlay = document.getElementById("overlay");
  const closeBtn = document.getElementById("close");
  let lastFocus;

  function openPanel(cardElement) {
    lastFocus = document.activeElement;
    const applicantName = cardElement.dataset.company || "Applicant Name";
    const appliedRole = cardElement.dataset.title || "Worker Role";
    const location = cardElement.dataset.location || "Location";
    const type = cardElement.dataset.type || "Full-time";
    const pay = cardElement.querySelector(".job-card__salary")?.textContent || "₱15,000 / month";
    const aboutText = cardElement.querySelector(".job-card__description")?.textContent || "Experienced local worker ready to start.";
    const dateApplied = cardElement.dataset.date + " days ago";

    const initials = applicantName.split(" ").map((w) => w[0]).join("").slice(0, 2);

    document.getElementById("p-init").textContent = initials;
    document.getElementById("p-name").textContent = applicantName;
    document.getElementById("p-role").textContent = "Applied for " + appliedRole;
    document.getElementById("p-loc").textContent = location;
    document.getElementById("p-type").textContent = type;
    document.getElementById("p-pay").textContent = pay;
    document.getElementById("p-date").textContent = dateApplied;
    document.getElementById("p-about").textContent = aboutText;

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    if (closeBtn) closeBtn.focus();
  }

  function closePanel() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    if (lastFocus) lastFocus.focus();
  }

  if (jobListings) {
    jobListings.addEventListener("click", (e) => {
      if (e.target.closest(".save-job-btn")) return;
      const card = e.target.closest(".job-card");
      if (card) openPanel(card);
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", closePanel);
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePanel();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });
});