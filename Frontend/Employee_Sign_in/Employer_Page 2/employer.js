(() => {
  let jobs = [];
  let currentView = 'active';
  try {
    const storedJobs = JSON.parse(localStorage.getItem('equiwork_employer_jobs') || '[]');
    jobs = Array.isArray(storedJobs) ? storedJobs : [];
  } catch (error) {
    jobs = [];
  }

  const SAMPLE_APPLICANTS = [
    {
      id: 'app-1',
      name: 'Maria Santos',
      location: 'Batangas City',
      experience: '5 yrs experience',
      applied: 'Applied 2h ago',
      note: 'Experienced in residential framing, cabinet installation, and finishing work. Own hand tools ready.',
      status: 'pending'
    },
    {
      id: 'app-2',
      name: 'Juan Dela Cruz',
      location: 'Lipa City',
      experience: '3 yrs experience',
      applied: 'Applied 5h ago',
      note: 'Reliable worker with background in site prep, masonry assistance, and general repair.',
      status: 'pending'
    }
  ];

  // DOM Elements
  const emptyStateBanner = document.getElementById('emptyStateBanner');
  const cardsContainer = document.getElementById('cardsContainer');
  const jobCountEl = document.getElementById('jobCount');
  const jobCountLabel = document.getElementById('jobCountLabel');
  const activeJobsTab = document.getElementById('activeJobsTab');
  const jobHistoryTab = document.getElementById('jobHistoryTab');
  const activeJobTotal = document.getElementById('activeJobTotal');
  const historyJobTotal = document.getElementById('historyJobTotal');

  // Add Job Modal Elements
  const addJobModal = document.getElementById('addJobModal');
  const openAddJobBtn = document.getElementById('openAddJobBtn');
  const emptyAddJobBtn = document.getElementById('emptyAddJobBtn');
  const closeAddJobModal = document.getElementById('closeAddJobModal');
  const cancelAddJob = document.getElementById('cancelAddJob');
  const addJobForm = document.getElementById('addJobForm');

  // Drawer Elements
  const overlay = document.getElementById('overlay');
  const backdrop = document.getElementById('drawerBackdrop');
  const closeBtn = document.getElementById('drawerClose');
  const dJobIcon = document.getElementById('dJobIcon');
  const dJobTitle = document.getElementById('dJobTitle');
  const dJobMeta = document.getElementById('dJobMeta');
  const dJobDesc = document.getElementById('dJobDesc');
  const dApplicantCount = document.getElementById('dApplicantCount');
  const dApplicantList = document.getElementById('dApplicantList');

  // Search & Filter Elements
  const searchForm = document.getElementById('searchForm');
  const qInput = document.getElementById('qInput');
  const locInput = document.getElementById('locInput');
  const fType = document.getElementById('fType');
  const fClass = document.getElementById('fClass');
  const filterBadge = document.getElementById('filterBadge');
  const locBox = document.getElementById('locBox');
  const locDropdown = document.getElementById('locDropdown');

  function isArchived(job) {
    return job.status === 'archived';
  }

  function saveJobs() {
    localStorage.setItem('equiwork_employer_jobs', JSON.stringify(jobs));
  }

  function updateFilterBadge() {
    if (!filterBadge) return;
    const count = [fType?.value, fClass?.value].filter(Boolean).length;
    filterBadge.textContent = String(count);
    filterBadge.hidden = count === 0;
  }

  function renderLocationSuggestions() {
    if (!locDropdown) return;
    const query = locInput?.value.trim().toLowerCase() || '';
    const locations = [...new Set(jobs.map(job => job.location).filter(Boolean))]
      .filter(location => location.toLowerCase().includes(query))
      .sort((a, b) => a.localeCompare(b));

    locDropdown.innerHTML = locations.length
      ? locations.map(location =>
          `<li role="option" data-location="${escapeHTML(location)}">${escapeHTML(location)}</li>`
        ).join('')
      : '<li role="option" aria-disabled="true">No matching locations</li>';
  }

  function renderJobs() {
    updateFilterBadge();

    const archivedJobs = jobs.filter(isArchived);
    const activeJobs = jobs.filter(job => !isArchived(job));
    if (activeJobTotal) activeJobTotal.textContent = String(activeJobs.length);
    if (historyJobTotal) historyJobTotal.textContent = String(archivedJobs.length);
    activeJobsTab?.classList.toggle('is-active', currentView === 'active');
    activeJobsTab?.setAttribute('aria-pressed', String(currentView === 'active'));
    jobHistoryTab?.classList.toggle('is-active', currentView === 'history');
    jobHistoryTab?.setAttribute('aria-pressed', String(currentView === 'history'));

    const query = qInput ? qInput.value.trim().toLowerCase() : '';
    const loc = locInput ? locInput.value.trim().toLowerCase() : '';
    const type = fType ? fType.value : '';
    const classification = fClass ? fClass.value : '';
    const jobsInView = currentView === 'history' ? archivedJobs : activeJobs;

    const filtered = jobsInView.filter(job => {
      const matchesQ =
        !query ||
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query);
      const matchesLoc = !loc || job.location.toLowerCase().includes(loc);
      const matchesType = !type || job.type === type;
      const matchesClass = !classification || job.classification === classification;
      return matchesQ && matchesLoc && matchesType && matchesClass;
    });

    if (jobCountEl) jobCountEl.textContent = String(filtered.length);
    if (jobCountLabel) {
      jobCountLabel.textContent = currentView === 'history'
        ? 'historical job postings'
        : 'active job postings';
    }

    if (currentView === 'active' && activeJobs.length === 0) {
      if (emptyStateBanner) emptyStateBanner.hidden = false;
      const emptyTitle = emptyStateBanner?.querySelector('h2');
      const emptyDescription = emptyStateBanner?.querySelector('p');
      if (emptyTitle) {
        emptyTitle.textContent = jobs.length === 0
          ? 'Post your first job opening'
          : 'No active job postings';
      }
      if (emptyDescription) {
        emptyDescription.textContent = jobs.length === 0
          ? 'Create a job listing with pay details and requirements. Once posted, workers can apply and you can review all applicants here.'
          : 'Your past postings are saved in Job History. Add a new job or restore a posting from history.';
      }
      if (cardsContainer) cardsContainer.hidden = true;
      return;
    }

    if (emptyStateBanner) emptyStateBanner.hidden = true;
    if (!cardsContainer) return;
    cardsContainer.hidden = false;

    if (filtered.length === 0) {
      const emptyMessage = jobsInView.length === 0
        ? 'No job history yet. Move a posting to history to see it here.'
        : 'No posted jobs match your search filters.';
      cardsContainer.innerHTML = `<p style="color: var(--ink-soft); grid-column: 1 / -1; background: var(--glass-card); backdrop-filter: blur(16px); padding: 20px; border-radius: 16px; border: 1px solid var(--glass-border);">${emptyMessage}</p>`;
      return;
    }

    cardsContainer.innerHTML = filtered.map(job => {
      return `
        <article class="card" data-job-id="${escapeHTML(job.id)}" tabindex="0">
          <div class="card-top">
            <div>
              <h2 class="card-name">${escapeHTML(job.title)}</h2>
              <p class="card-role">${escapeHTML(job.classification)}</p>
            </div>
          </div>

          <div class="card-meta">
            <span>📍 ${escapeHTML(job.location)}</span>
            <span>💼 ${escapeHTML(job.type)}</span>
            <span>💰 ${escapeHTML(job.pay)}</span>
          </div>

          <p class="card-bio">${escapeHTML(job.description)}</p>

          <div class="card-foot">
            <span>${currentView === 'history'
              ? `Posted ${escapeHTML(job.posted)} · Archived ${escapeHTML(new Date(job.archivedAt).toLocaleDateString())}`
              : `Posted ${escapeHTML(job.posted)}`}</span>
            <div class="card-actions">
              ${currentView === 'history'
                ? `<button type="button" class="card-action card-restore" data-restore-job="${escapeHTML(job.id)}" aria-label="Restore ${escapeHTML(job.title)} to active postings">Restore</button>
                   <button type="button" class="card-delete" data-delete-job="${escapeHTML(job.id)}" aria-label="Permanently delete ${escapeHTML(job.title)} from history">Delete</button>`
                : `<button type="button" class="card-action" data-archive-job="${escapeHTML(job.id)}" aria-label="Archive ${escapeHTML(job.title)}">Archive</button>`}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function openModal() {
    if (!addJobModal) return;
    addJobModal.hidden = false;
    addJobModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    document.getElementById('jobTitleInput')?.focus();
  }

  function closeModal() {
    if (!addJobModal) return;
    addJobModal.hidden = true;
    addJobModal.classList.remove('is-open');
    document.body.style.overflow = '';
    addJobForm?.reset();
  }

  openAddJobBtn?.addEventListener('click', openModal);
  emptyAddJobBtn?.addEventListener('click', openModal);
  closeAddJobModal?.addEventListener('click', closeModal);
  cancelAddJob?.addEventListener('click', closeModal);
  addJobModal?.addEventListener('click', (e) => {
    if (e.target === addJobModal) closeModal();
  });

  addJobForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newJob = {
      id: 'job-' + Date.now(),
      title: document.getElementById('jobTitleInput').value.trim(),
      location: document.getElementById('jobLocationInput').value.trim(),
      pay: document.getElementById('jobPayInput').value.trim(),
      type: document.getElementById('jobTypeInput').value,
      classification: document.getElementById('jobClassInput').value,
      description: document.getElementById('jobDescInput').value.trim(),
      posted: 'Just now',
      status: 'active',
      applicants: JSON.parse(JSON.stringify(SAMPLE_APPLICANTS))
    };

    jobs.unshift(newJob);
    saveJobs();
    renderJobs();
    closeModal();
  });

  function openJobApplicantsDrawer(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job || !overlay) return;

    if (dJobIcon) dJobIcon.textContent = job.title.charAt(0).toUpperCase();
    if (dJobTitle) dJobTitle.textContent = job.title;
    if (dJobMeta) dJobMeta.textContent = `${job.location} • ${job.type} • ${job.pay}`;
    if (dJobDesc) dJobDesc.textContent = job.description;
    if (dApplicantCount) dApplicantCount.textContent = String(job.applicants ? job.applicants.length : 0);

    renderDrawerApplicants(job);

    overlay.classList.add('is-open');
    backdrop?.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  }

  function renderDrawerApplicants(job) {
    if (!dApplicantList) return;
    if (!job.applicants || job.applicants.length === 0) {
      dApplicantList.innerHTML = `<p style="color: var(--muted); font-size: 0.88rem;">No applicants yet for this job posting.</p>`;
      return;
    }

    dApplicantList.innerHTML = job.applicants.map(app => `
      <div class="applicant-item">
        <div class="applicant-top">
          <div class="applicant-info">
            <strong>${escapeHTML(app.name)}</strong>
            <span>📍 ${escapeHTML(app.location)} • ${escapeHTML(app.experience)} • ${escapeHTML(app.applied)}</span>
          </div>
          ${app.status === 'accepted' ? `<span class="status-accepted">✓ Accepted</span>` : ''}
        </div>
        <p class="applicant-note">${escapeHTML(app.note)}</p>
        <div class="applicant-actions">
          <button type="button" class="btn-ghost btn-sm" data-msg-name="${escapeHTML(app.name)}">Message</button>
          ${app.status !== 'accepted'
            ? `<button type="button" class="btn-apply btn-sm accept-app-btn" data-job-id="${escapeHTML(job.id)}" data-app-id="${escapeHTML(app.id)}">Accept</button>`
            : ''}
        </div>
      </div>
    `).join('');
  }

  cardsContainer?.addEventListener('click', (e) => {
    const archiveBtn = e.target.closest('[data-archive-job]');
    if (archiveBtn) {
      e.stopPropagation();
      const job = jobs.find(j => j.id === archiveBtn.dataset.archiveJob);
      if (!job) return;
      job.status = 'archived';
      job.archivedAt = new Date().toISOString();
      saveJobs();
      renderJobs();
      return;
    }

    const restoreBtn = e.target.closest('[data-restore-job]');
    if (restoreBtn) {
      e.stopPropagation();
      const job = jobs.find(j => j.id === restoreBtn.dataset.restoreJob);
      if (!job) return;
      job.status = 'active';
      delete job.archivedAt;
      saveJobs();
      renderJobs();
      return;
    }

    const deleteBtn = e.target.closest('[data-delete-job]');
    if (deleteBtn) {
      e.stopPropagation();
      const job = jobs.find(j => j.id === deleteBtn.dataset.deleteJob);
      if (!job || !window.confirm(`Permanently delete "${job.title}" from job history?`)) return;

      jobs = jobs.filter(j => j.id !== job.id);
      saveJobs();
      renderJobs();
      return;
    }

    const card = e.target.closest('.card');
    if (card) {
      openJobApplicantsDrawer(card.dataset.jobId);
    }
  });

  cardsContainer?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.card');
    if (!card || e.target.closest('button')) return;
    e.preventDefault();
    openJobApplicantsDrawer(card.dataset.jobId);
  });

  activeJobsTab?.addEventListener('click', () => {
    currentView = 'active';
    renderJobs();
  });
  jobHistoryTab?.addEventListener('click', () => {
    currentView = 'history';
    renderJobs();
  });

  dApplicantList?.addEventListener('click', (e) => {
    const msgBtn = e.target.closest('[data-msg-name]');
    if (msgBtn) {
      alert(`Opening chat with ${msgBtn.dataset.msgName}...`);
      return;
    }

    const acceptBtn = e.target.closest('.accept-app-btn');
    if (!acceptBtn) return;

    const { jobId, appId } = acceptBtn.dataset;
    const job = jobs.find(j => j.id === jobId);
    const applicant = job?.applicants.find(a => a.id === appId);
    if (applicant) {
      applicant.status = 'accepted';
      saveJobs();
      renderDrawerApplicants(job);
      renderJobs();
    }
  });

  function closeDrawer() {
    overlay?.classList.remove('is-open');
    backdrop?.classList.remove('is-open');
    overlay?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      closeModal();
      setSidebarOpen(false);
      accountBox?.classList.remove('is-open');
      accountBtn?.setAttribute('aria-expanded', 'false');
      filterPopover?.classList.remove('is-open');
      filterToggle?.setAttribute('aria-expanded', 'false');
    }
  });

  // Search & Filter Listeners
  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    renderJobs();
  });
  qInput?.addEventListener('input', renderJobs);
  locInput?.addEventListener('input', renderJobs);
  locInput?.addEventListener('input', () => {
    renderLocationSuggestions();
    locDropdown?.classList.add('is-open');
  });
  locInput?.addEventListener('focus', () => {
    renderLocationSuggestions();
    locDropdown?.classList.add('is-open');
  });
  locDropdown?.addEventListener('click', (e) => {
    const option = e.target.closest('[data-location]');
    if (!option) return;
    locInput.value = option.dataset.location;
    locDropdown.classList.remove('is-open');
    renderJobs();
  });
  locBox?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') locDropdown?.classList.remove('is-open');
  });

  document.getElementById('applyFilters')?.addEventListener('click', () => {
    renderJobs();
    filterPopover?.classList.remove('is-open');
    filterToggle?.setAttribute('aria-expanded', 'false');
  });

  document.getElementById('clearFilters')?.addEventListener('click', () => {
    if (fType) fType.value = '';
    if (fClass) fClass.value = '';
    renderJobs();
  });

  // Account & Filter Popover Toggles
  const accountBox = document.getElementById('accountBox');
  const accountBtn = document.getElementById('accountBtn');
  accountBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    accountBox?.classList.toggle('is-open');
    accountBtn.setAttribute(
      'aria-expanded',
      String(accountBox?.classList.contains('is-open'))
    );
  });

  const filterToggle = document.getElementById('filterToggle');
  const filterPopover = document.getElementById('filterPopover');
  filterToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    filterPopover?.classList.toggle('is-open');
    filterToggle.setAttribute(
      'aria-expanded',
      String(filterPopover?.classList.contains('is-open'))
    );
  });

  document.addEventListener('click', () => {
    accountBox?.classList.remove('is-open');
    filterPopover?.classList.remove('is-open');
    locDropdown?.classList.remove('is-open');
    accountBtn?.setAttribute('aria-expanded', 'false');
    filterToggle?.setAttribute('aria-expanded', 'false');
  });
  filterPopover?.addEventListener('click', (e) => e.stopPropagation());

  // Sidebar Collapse & Mobile Drawer
  const sidebar = document.getElementById('leftSidebar');
  const sidebarCollapse = document.getElementById('sidebarCollapse');
  const mobileNavBtn = document.getElementById('mobileNavBtn');
  const sidebarClose = document.getElementById('sidebarClose');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const mobileNavQuery = window.matchMedia('(max-width: 850px)');

  sidebarCollapse?.addEventListener('click', () => {
    sidebar?.classList.toggle('is-collapsed');
    sidebarCollapse.setAttribute(
      'aria-expanded',
      String(!sidebar?.classList.contains('is-collapsed'))
    );
  });

  function setSidebarOpen(open) {
    sidebar?.classList.toggle('is-open', open);
    sidebarBackdrop?.classList.toggle('is-open', open);
    sidebarBackdrop?.setAttribute('aria-hidden', String(!open));
    mobileNavBtn?.setAttribute('aria-expanded', String(open));
    mobileNavBtn?.setAttribute(
      'aria-label',
      open ? 'Close navigation' : 'Open navigation'
    );
    document.body.classList.toggle('nav-open', open);
  }

  mobileNavBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    setSidebarOpen(!sidebar?.classList.contains('is-open'));
  });
  sidebarClose?.addEventListener('click', () => setSidebarOpen(false));
  sidebarBackdrop?.addEventListener('click', () => setSidebarOpen(false));

  document.querySelectorAll('.side-nav__link').forEach((link) => {
    link.addEventListener('click', () => {
      if (mobileNavQuery.matches) setSidebarOpen(false);
    });
  });

  mobileNavQuery.addEventListener('change', (event) => {
    if (!event.matches) setSidebarOpen(false);
  });

  // Grid / List View Switcher
  document.querySelectorAll('.views__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.views__btn').forEach(b => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      cardsContainer?.classList.toggle('list-view', btn.dataset.view === 'list');
      cardsContainer?.classList.toggle('grid-view', btn.dataset.view === 'grid');
    });
  });

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  // Initial Render
  renderJobs();
})();