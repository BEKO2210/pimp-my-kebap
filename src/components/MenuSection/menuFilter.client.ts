// Powered by skill: frontend-design, accessibility
// Client-side menu search + tag/allergen filtering. No backend.

const root = document;
const searchInput = root.querySelector<HTMLInputElement>('[data-menu-search]');
if (searchInput) {
  const status = root.querySelector<HTMLElement>('[data-filter-status]')!;
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-item-id]'));
  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-menu-section]'));
  const filterDropdown = root.querySelector<HTMLDetailsElement>('[data-menu-filter-dropdown]');
  const filterCountBadge = root.querySelector<HTMLElement>('[data-filter-active-count]');

  const state = {
    search: '',
    veg: false,
    spicy: false,
    excludeAllergens: new Set<string>(),
  };

  function activeFilterCount(): number {
    let n = 0;
    if (state.veg) n++;
    if (state.spicy) n++;
    n += state.excludeAllergens.size;
    return n;
  }

  function updateFilterBadge() {
    if (!filterCountBadge) return;
    const n = activeFilterCount();
    if (n === 0) {
      filterCountBadge.classList.add('hidden');
      filterCountBadge.textContent = '0';
    } else {
      filterCountBadge.classList.remove('hidden');
      filterCountBadge.textContent = String(n);
    }
  }

  function apply() {
    const q = state.search.trim();
    let visible = 0;
    for (const card of cards) {
      const name = card.dataset.itemSearch ?? '';
      const tag = card.dataset.itemTag ?? '';
      const markings = (card.dataset.itemMarkings ?? '').split(',').filter(Boolean);

      let show = true;
      if (q && !name.includes(q.toLowerCase())) show = false;
      if (state.veg && tag !== 'vegetarisch') show = false;
      if (state.spicy && tag !== 'scharf') show = false;
      for (const code of state.excludeAllergens) {
        if (markings.includes(code)) show = false;
      }
      card.toggleAttribute('hidden', !show);
      if (show) visible++;
    }
    // Hide entire sections that have zero visible cards; auto-open accordions
    // that have at least one match while filters/search are active so the user
    // sees results without manual expansion. When filters are off, leave the
    // open/closed state alone so the user keeps their manual choice.
    const filtersActive = q !== '' || state.veg || state.spicy || state.excludeAllergens.size > 0;
    for (const section of sections) {
      const localCards = section.querySelectorAll<HTMLElement>('[data-item-id]');
      // Sections without filterable items (e.g. Drinks, which are rendered
      // through a different component) must never get auto-hidden.
      if (localCards.length === 0) continue;
      const someVisible = Array.from(localCards).some((c) => !c.hasAttribute('hidden'));
      section.toggleAttribute('hidden', !someVisible);
      const acc = section.querySelector<HTMLDetailsElement>('details[data-menu-accordion]');
      if (acc && filtersActive) acc.open = someVisible;
    }
    const total = cards.length;
    if (visible === total && q === '' && !state.veg && !state.spicy && state.excludeAllergens.size === 0) {
      status.textContent = '';
    } else if (visible === 0) {
      status.textContent = `Keine Treffer — Filter zurücksetzen?`;
    } else {
      status.textContent = `${visible} von ${total} Speisen sichtbar`;
    }
    updateFilterBadge();
  }

  searchInput.addEventListener('input', () => {
    state.search = searchInput.value;
    apply();
  });

  function toggleButton(btn: HTMLButtonElement, key: 'veg' | 'spicy') {
    const active = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(active));
    btn.setAttribute('data-active', String(active));
    state[key] = active;
    apply();
  }

  root.querySelector<HTMLButtonElement>('[data-filter-veg]')?.addEventListener('click', (e) =>
    toggleButton(e.currentTarget as HTMLButtonElement, 'veg'),
  );
  root.querySelector<HTMLButtonElement>('[data-filter-spicy]')?.addEventListener('click', (e) =>
    toggleButton(e.currentTarget as HTMLButtonElement, 'spicy'),
  );
  root.querySelectorAll<HTMLButtonElement>('[data-filter-allergen]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-filter-allergen')!;
      const has = state.excludeAllergens.has(code);
      if (has) state.excludeAllergens.delete(code);
      else state.excludeAllergens.add(code);
      btn.setAttribute('aria-pressed', String(!has));
      btn.setAttribute('data-active', String(!has));
      apply();
    });
  });

  root.querySelector<HTMLButtonElement>('[data-filter-reset]')?.addEventListener('click', () => {
    state.search = '';
    state.veg = false;
    state.spicy = false;
    state.excludeAllergens.clear();
    searchInput.value = '';
    root.querySelectorAll<HTMLButtonElement>('[data-filter-veg],[data-filter-spicy],[data-filter-allergen]').forEach((b) => {
      b.setAttribute('aria-pressed', 'false');
      b.removeAttribute('data-active');
    });
    apply();
  });

  // Filter dropdown: close on outside click + ESC
  if (filterDropdown) {
    document.addEventListener('click', (e) => {
      if (!filterDropdown.open) return;
      if (filterDropdown.contains(e.target as Node)) return;
      filterDropdown.open = false;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && filterDropdown.open) filterDropdown.open = false;
    });
  }

  // Quick-jump links: open the target accordion before scrolling.
  root.querySelectorAll<HTMLAnchorElement>('[data-cat-jump]').forEach((a) => {
    a.addEventListener('click', () => {
      const cat = a.dataset.catJump;
      if (!cat) return;
      const target = document.getElementById(`section-${cat}`);
      const acc = target?.querySelector<HTMLDetailsElement>('details[data-menu-accordion]');
      if (acc) acc.open = true;
    });
  });

  apply();
}
