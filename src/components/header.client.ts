// Powered by skill: frontend-design, accessibility
// Mobile burger toggle — opens/closes the mobile nav panel, syncs the
// menu↔close icon swap, traps esc + outside clicks, and locks body scroll
// while the panel is open.

const toggle = document.querySelector<HTMLButtonElement>('[data-mobile-nav-toggle]');
const panel = document.querySelector<HTMLElement>('[data-mobile-nav-panel]');

if (toggle && panel) {
  const iconMenu = toggle.querySelector<HTMLElement>('[data-icon-menu]');
  const iconClose = toggle.querySelector<HTMLElement>('[data-icon-close]');

  const setOpen = (open: boolean) => {
    if (open) {
      panel.removeAttribute('hidden');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Menü schließen');
      document.body.classList.add('mobile-nav-open');
      iconMenu?.classList.add('hidden');
      iconMenu?.classList.remove('block');
      iconClose?.classList.remove('hidden');
      iconClose?.classList.add('block');
    } else {
      panel.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Menü öffnen');
      document.body.classList.remove('mobile-nav-open');
      iconMenu?.classList.remove('hidden');
      iconMenu?.classList.add('block');
      iconClose?.classList.add('hidden');
      iconClose?.classList.remove('block');
    }
  };

  const isOpen = () => !panel.hasAttribute('hidden');

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!isOpen());
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    const target = e.target as Node;
    if (panel.contains(target) || toggle.contains(target)) return;
    setOpen(false);
  });

  panel.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => setOpen(false)),
  );

  const mq = window.matchMedia('(min-width: 768px)');
  mq.addEventListener('change', (ev) => {
    if (ev.matches && isOpen()) setOpen(false);
  });
}
