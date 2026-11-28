document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "equiwork_settings";

  const DEFAULT_SETTINGS = {
    displayName: "EquiWork HR",
    roleTitle: "Verified Employer",
    accountEmail: "hr@equiwork.ph",
    accountPhone: "+63 917 555 0142",
    accountBio: "Hiring fair and inclusive talent across the Philippines.",
    companyName: "EquiWork Philippines",
    companyIndustry: "Technology",
    companyLocation: "Metro Manila, Philippines",
    defaultCurrency: "PHP",
    timezone: "Asia/Manila",
    notifApplicants: true,
    notifMessages: true,
    notifDigest: false,
    notifMarketing: false,
    twoFactorEnabled: false,
    publicVisibility: true,
  };

  const form = document.getElementById("settingsForm");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".settings-panel");
  const saveBadge = document.getElementById("saveBadge");
  const discardBtn = document.getElementById("discardBtn");
  const avatarInitials = document.getElementById("avatarInitials");
  const summaryName = document.getElementById("summaryName");
  const summaryEmail = document.getElementById("summaryEmail");

  const emailInput = document.getElementById("accountEmail");
  const emailError = document.getElementById("emailError");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const passwordError = document.getElementById("passwordError");
  const strengthFill = document.getElementById("strengthFill");

  const exportDataBtn = document.getElementById("exportDataBtn");
  const resetDefaultsBtn = document.getElementById("resetDefaultsBtn");
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");

  const confirmModal = document.getElementById("confirmModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalConfirmBtn = document.getElementById("modalConfirmBtn");
  const toastEl = document.getElementById("toast");

  let toastTimer = 0;
  let pendingModalAction = null;

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("is-visible");
    }, 3000);
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function getInitials(name) {
    const parts = (name || "EW").trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function updateSummary(name, email) {
    const cleanName = name.trim() || DEFAULT_SETTINGS.displayName;
    const cleanEmail = email.trim() || DEFAULT_SETTINGS.accountEmail;
    summaryName.textContent = cleanName;
    summaryEmail.textContent = cleanEmail;
    avatarInitials.textContent = getInitials(cleanName);
  }

  function populateForm(data) {
    Object.entries(data).forEach(([key, value]) => {
      const el = form.elements.namedItem(key);
      if (!el) return;
      if (el.type === "checkbox") {
        el.checked = Boolean(value);
      } else {
        el.value = value;
      }
    });
    updateSummary(data.displayName, data.accountEmail);
    saveBadge.hidden = true;
  }

  function collectFormData() {
    const data = {};
    Object.keys(DEFAULT_SETTINGS).forEach((key) => {
      const el = form.elements.namedItem(key);
      if (!el) return;
      data[key] = el.type === "checkbox" ? el.checked : el.value.trim();
    });
    return data;
  }

  /* TABS */
  function activateTab(tabName) {
    tabButtons.forEach((btn) => {
      const isMatch = btn.dataset.tab === tabName;
      btn.classList.toggle("is-active", isMatch);
      btn.setAttribute("aria-selected", String(isMatch));
    });

    panels.forEach((panel) => {
      const isMatch = panel.id === `panel-${tabName}`;
      panel.classList.toggle("is-active", isMatch);
      panel.hidden = !isMatch;
    });

    if (history.replaceState) {
      history.replaceState(null, "", `#${tabName}`);
    }
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  const initialHash = window.location.hash.replace("#", "");
  if (["account", "company", "notifications", "security", "danger"].includes(initialHash)) {
    activateTab(initialHash);
  }

  /* DIRTY STATE & LIVE SUMMARY */
  form.addEventListener("input", () => {
    saveBadge.hidden = false;
    updateSummary(
      form.elements.namedItem("displayName").value,
      form.elements.namedItem("accountEmail").value,
    );
  });

  form.addEventListener("change", () => {
    saveBadge.hidden = false;
  });

  /* PASSWORD SHOW/HIDE & STRENGTH */
  document.querySelectorAll(".eye-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const show = target.type === "password";
      target.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  newPassword.addEventListener("input", () => {
    const val = newPassword.value;
    let score = 0;
    if (val.length >= 8) score += 1;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score += 1;
    if (/[0-9]/.test(val)) score += 1;
    if (/[^A-Za-z0-9]/.test(val)) score += 1;

    const widths = ["0%", "25%", "50%", "75%", "100%"];
    const colors = ["#e2e8f0", "#ef4444", "#f59e0b", "#10b981", "#15803d"];
    strengthFill.style.width = val ? widths[score] : "0%";
    strengthFill.style.background = colors[score];
    passwordError.textContent = "";
  });

  confirmPassword.addEventListener("input", () => {
    passwordError.textContent = "";
  });

  emailInput.addEventListener("input", () => {
    emailInput.classList.remove("is-invalid");
    emailError.textContent = "";
  });

  /* SAVE & DISCARD */
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const emailVal = emailInput.value.trim();
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      activateTab("account");
      emailInput.classList.add("is-invalid");
      emailError.textContent = "Please enter a valid email address.";
      emailInput.focus();
      return;
    }

    if (newPassword.value || confirmPassword.value) {
      if (newPassword.value.length < 8) {
        activateTab("security");
        passwordError.textContent = "Password must be at least 8 characters.";
        newPassword.focus();
        return;
      }
      if (newPassword.value !== confirmPassword.value) {
        activateTab("security");
        passwordError.textContent = "Passwords do not match.";
        confirmPassword.focus();
        return;
      }
    }

    const updated = collectFormData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    newPassword.value = "";
    confirmPassword.value = "";
    strengthFill.style.width = "0%";
    saveBadge.hidden = true;
    showToast("Settings saved successfully.");
  });

  discardBtn.addEventListener("click", () => {
    populateForm(loadSettings());
    newPassword.value = "";
    confirmPassword.value = "";
    strengthFill.style.width = "0%";
    emailError.textContent = "";
    passwordError.textContent = "";
    showToast("Unsaved changes discarded.");
  });

  /* MODAL HELPERS */
  function openModal(title, desc, onConfirm) {
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    pendingModalAction = onConfirm;
    confirmModal.hidden = false;
    modalConfirmBtn.focus();
  }

  function closeModal() {
    confirmModal.hidden = true;
    pendingModalAction = null;
  }

  modalCancelBtn.addEventListener("click", closeModal);
  confirmModal.addEventListener("click", (e) => {
    if (e.target === confirmModal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !confirmModal.hidden) closeModal();
  });

  modalConfirmBtn.addEventListener("click", () => {
    if (typeof pendingModalAction === "function") {
      pendingModalAction();
    }
    closeModal();
  });

  /* DANGER ZONE ACTIONS */
  exportDataBtn.addEventListener("click", () => {
    const data = collectFormData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "equiwork-settings.json";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Settings exported as JSON.");
  });

  resetDefaultsBtn.addEventListener("click", () => {
    openModal(
      "Reset all preferences?",
      "This will restore every setting back to its default value.",
      () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        populateForm(DEFAULT_SETTINGS);
        showToast("Settings restored to defaults.");
      },
    );
  });

  deleteAccountBtn.addEventListener("click", () => {
    openModal(
      "Delete account?",
      "This will clear your saved local profile and return you to the sign-in page.",
      () => {
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "signIn.html";
      },
    );
  });

  /* INIT */
  populateForm(loadSettings());
});
