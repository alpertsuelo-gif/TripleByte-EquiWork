document.addEventListener("DOMContentLoaded", () => {
  const SETTINGS_KEY = "equiwork_settings";
  const PROFILE_EXTRA_KEY = "equiwork_profile_extra";

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
    publicVisibility: true,
  };

  const DEFAULT_EXTRA = {
    teamSize: "11–50 employees",
    website: "https://equiwork.ph",
    specialties: ["Software Engineering", "Customer Support", "Operations"],
    avatarDataUrl: "",
  };

  const profileName = document.getElementById("profileName");
  const profileRole = document.getElementById("profileRole");
  const profileLocationText = document.getElementById("profileLocationText");
  const profileBio = document.getElementById("profileBio");
  const avatarInitials = document.getElementById("avatarInitials");
  const avatarImage = document.getElementById("avatarImage");
  const avatarUploadBtn = document.getElementById("avatarUploadBtn");
  const avatarInput = document.getElementById("avatarInput");

  const companyNameVal = document.getElementById("companyNameVal");
  const companyIndustryVal = document.getElementById("companyIndustryVal");
  const teamSizeVal = document.getElementById("teamSizeVal");
  const websiteVal = document.getElementById("websiteVal");

  const contactEmail = document.getElementById("contactEmail");
  const contactPhone = document.getElementById("contactPhone");
  const contactTimezone = document.getElementById("contactTimezone");
  const contactVisibility = document.getElementById("contactVisibility");

  const completionPct = document.getElementById("completionPct");
  const completionBar = document.getElementById("completionBar");
  const completionNote = document.getElementById("completionNote");

  const specialtyInput = document.getElementById("specialtyInput");
  const addSpecialtyBtn = document.getElementById("addSpecialtyBtn");
  const specialtyList = document.getElementById("specialtyList");

  const copyProfileBtn = document.getElementById("copyProfileBtn");
  const editProfileBtn = document.getElementById("editProfileBtn");
  const editModal = document.getElementById("editModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");
  const editProfileForm = document.getElementById("editProfileForm");

  const toastEl = document.getElementById("toast");
  let toastTimer = 0;

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("is-visible");
    }, 3000);
  }

  function loadJSON(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "{}");
      return { ...fallback, ...parsed };
    } catch {
      return { ...fallback };
    }
  }

  function getInitials(name) {
    const parts = (name || "EW").trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  let settingsData = loadJSON(SETTINGS_KEY, DEFAULT_SETTINGS);
  let extraData = loadJSON(PROFILE_EXTRA_KEY, DEFAULT_EXTRA);
  if (!Array.isArray(extraData.specialties)) {
    extraData.specialties = [...DEFAULT_EXTRA.specialties];
  }

  function renderSpecialties() {
    specialtyList.textContent = "";
    extraData.specialties.forEach((tag, index) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";

      const text = document.createElement("span");
      text.textContent = tag;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.dataset.index = String(index);
      removeBtn.setAttribute("aria-label", `Remove ${tag}`);
      removeBtn.textContent = "×";

      chip.append(text, removeBtn);
      specialtyList.appendChild(chip);
    });
  }

  function updateCompletion() {
    const checks = [
      Boolean(settingsData.displayName),
      Boolean(settingsData.accountEmail),
      Boolean(settingsData.accountBio),
      Boolean(settingsData.companyName),
      Boolean(settingsData.companyLocation),
      extraData.specialties.length > 0,
    ];
    const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    completionPct.textContent = `${pct}%`;
    completionBar.style.width = `${pct}%`;
    completionNote.textContent =
      pct === 100
        ? "Your profile is complete and ready to build trust with candidates."
        : "Add a bio, location, and hiring specialties to reach 100%.";
  }

  function renderProfile() {
    profileName.textContent = settingsData.displayName || DEFAULT_SETTINGS.displayName;
    profileRole.textContent = `${settingsData.roleTitle || "Member"} • ${settingsData.companyName || "EquiWork"}`;
    profileLocationText.textContent = settingsData.companyLocation || "Philippines";
    profileBio.textContent = settingsData.accountBio || "No bio added yet.";

    companyNameVal.textContent = settingsData.companyName || "—";
    companyIndustryVal.textContent = settingsData.companyIndustry || "—";
    teamSizeVal.textContent = extraData.teamSize || "—";
    websiteVal.textContent = extraData.website || "—";

    contactEmail.textContent = settingsData.accountEmail || "—";
    contactPhone.textContent = settingsData.accountPhone || "—";
    contactTimezone.textContent = settingsData.timezone || "Asia/Manila";
    contactVisibility.textContent = settingsData.publicVisibility ? "Public" : "Private";

    if (extraData.avatarDataUrl) {
      avatarImage.src = extraData.avatarDataUrl;
      avatarImage.hidden = false;
      avatarInitials.hidden = true;
    } else {
      avatarImage.hidden = true;
      avatarInitials.hidden = false;
      avatarInitials.textContent = getInitials(settingsData.displayName);
    }

    renderSpecialties();
    updateCompletion();
  }

  /* SPECIALTY TAGS */
  function addSpecialty() {
    const val = specialtyInput.value.trim();
    if (!val) return;
    if (extraData.specialties.some((s) => s.toLowerCase() === val.toLowerCase())) {
      showToast("That specialty is already listed.");
      return;
    }
    extraData.specialties.push(val);
    localStorage.setItem(PROFILE_EXTRA_KEY, JSON.stringify(extraData));
    specialtyInput.value = "";
    renderSpecialties();
    updateCompletion();
    showToast("Specialty added.");
  }

  addSpecialtyBtn.addEventListener("click", addSpecialty);
  specialtyInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSpecialty();
    }
  });

  specialtyList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-index]");
    if (!btn) return;
    extraData.specialties.splice(Number(btn.dataset.index), 1);
    localStorage.setItem(PROFILE_EXTRA_KEY, JSON.stringify(extraData));
    renderSpecialties();
    updateCompletion();
  });

  /* AVATAR UPLOAD */
  avatarUploadBtn.addEventListener("click", () => avatarInput.click());
  avatarInput.addEventListener("change", () => {
    const file = avatarInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      extraData.avatarDataUrl = String(reader.result || "");
      localStorage.setItem(PROFILE_EXTRA_KEY, JSON.stringify(extraData));
      renderProfile();
      showToast("Profile photo updated.");
    };
    reader.readAsDataURL(file);
  });

  /* SHARE PROFILE */
  copyProfileBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Profile link copied to clipboard.");
    } catch {
      showToast("Profile URL ready to share.");
    }
  });

  /* EDIT MODAL */
  function openEditModal() {
    document.getElementById("editDisplayName").value = settingsData.displayName || "";
    document.getElementById("editRoleTitle").value = settingsData.roleTitle || "";
    document.getElementById("editEmail").value = settingsData.accountEmail || "";
    document.getElementById("editPhone").value = settingsData.accountPhone || "";
    document.getElementById("editCompanyName").value = settingsData.companyName || "";
    document.getElementById("editLocation").value = settingsData.companyLocation || "";
    document.getElementById("editTeamSize").value = extraData.teamSize || "11–50 employees";
    document.getElementById("editWebsite").value = extraData.website || "";
    document.getElementById("editBio").value = settingsData.accountBio || "";
    editModal.hidden = false;
    document.getElementById("editDisplayName").focus();
  }

  function closeEditModal() {
    editModal.hidden = true;
  }

  editProfileBtn.addEventListener("click", openEditModal);
  closeModalBtn.addEventListener("click", closeEditModal);
  cancelModalBtn.addEventListener("click", closeEditModal);
  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) closeEditModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !editModal.hidden) closeEditModal();
  });

  editProfileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newName = document.getElementById("editDisplayName").value.trim();
    const newEmail = document.getElementById("editEmail").value.trim();

    if (!newName || !newEmail) {
      showToast("Full name and email are required.");
      return;
    }

    settingsData.displayName = newName;
    settingsData.roleTitle = document.getElementById("editRoleTitle").value.trim();
    settingsData.accountEmail = newEmail;
    settingsData.accountPhone = document.getElementById("editPhone").value.trim();
    settingsData.companyName = document.getElementById("editCompanyName").value.trim();
    settingsData.companyLocation = document.getElementById("editLocation").value.trim();
    settingsData.accountBio = document.getElementById("editBio").value.trim();

    extraData.teamSize = document.getElementById("editTeamSize").value;
    extraData.website = document.getElementById("editWebsite").value.trim();

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsData));
    localStorage.setItem(PROFILE_EXTRA_KEY, JSON.stringify(extraData));

    renderProfile();
    closeEditModal();
    showToast("Profile updated.");
  });

  /* INIT */
  renderProfile();
});
