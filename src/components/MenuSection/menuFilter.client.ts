// Powered by skill: frontend-design, accessibility
// Client-side menu search + tag/allergen filtering. No backend.

const root = document;
const searchInput = root.querySelector<HTMLInputElement>('[data-menu-search]');
if (searchInput) {
  const status = root.querySelector<HTMLElement>('[data-filter-status]')!;
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-item-id]'));
  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-menu-section]'));

  const state = {
    search: '',
    veg: false,
    spicy: false,
    excludeAllergens: new Set<string>(),
  };

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
    // Hide entire sections that have zero visible cards
    for (const section of sections) {
      const localCards = section.querySelectorAll<HTMLElement>('[data-item-id]');
      const someVisible = Array.from(localCards).some((c) => !c.hasAttribute('hidden'));
      section.toggleAttribute('hidden', !someVisible);
    }
    const total = cards.length;
    if (visible === total && q === '' && !state.veg && !state.spicy && state.excludeAllergens.size === 0) {
      status.textContent = '';
    } else if (visible === 0) {
      status.textContent = `Keine Treffer — Filter zurücksetzen?`;
    } else {
      status.textContent = `${visible} von ${total} Speisen sichtbar`;
    }
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
}
