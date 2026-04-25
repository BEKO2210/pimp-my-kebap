// Powered by skill: frontend-design, accessibility
// Tiny toast queue. Uses textContent (no innerHTML) — CSP-safe.

type Tone = 'info' | 'success' | 'error';

let region: HTMLElement | null = null;

function ensureRegion(): HTMLElement {
  if (region) return region;
  region = document.createElement('div');
  region.id = 'toast-region';
  region.setAttribute('role', 'region');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-label', 'Benachrichtigungen');
  document.body.appendChild(region);
  return region;
}

export function toast(message: string, opts: { tone?: Tone; ms?: number } = {}): void {
  const tone: Tone = opts.tone ?? 'info';
  const ms = opts.ms ?? 3500;
  const root = ensureRegion();

  const el = document.createElement('div');
  el.className = 'toast';
  el.dataset.tone = tone;
  el.setAttribute('role', tone === 'error' ? 'alert' : 'status');

  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = tone === 'error' ? '⚠️' : tone === 'success' ? '✓' : '🥙';

  const text = document.createElement('span');
  text.textContent = message;

  el.append(icon, text);
  root.appendChild(el);

  const dismiss = () => {
    el.dataset.leaving = 'true';
    setTimeout(() => el.remove(), 220);
  };
  setTimeout(dismiss, ms);
  el.addEventListener('click', dismiss);
}
