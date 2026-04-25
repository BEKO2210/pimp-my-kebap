// Powered by skill: frontend-design, accessibility
// Tiny toast queue. Builds DOM via createElementNS — CSP-safe (no innerHTML).

type Tone = 'info' | 'success' | 'error';

const MAX_VISIBLE = 3;
const DEDUPE_WINDOW_MS = 600;

let region: HTMLElement | null = null;
let lastMessage = '';
let lastMessageAt = 0;

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

const SVG_NS = 'http://www.w3.org/2000/svg';

function buildIcon(tone: Tone): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  const append = (tag: string, attrs: Record<string, string>) => {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    svg.appendChild(node);
  };

  if (tone === 'error') {
    // lucide: triangle-alert
    append('path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' });
    append('path', { d: 'M12 9v4' });
    append('path', { d: 'M12 17h.01' });
  } else if (tone === 'success') {
    // lucide: check
    append('path', { d: 'M20 6 9 17l-5-5' });
  } else {
    // lucide: info
    append('circle', { cx: '12', cy: '12', r: '10' });
    append('path', { d: 'M12 16v-4' });
    append('path', { d: 'M12 8h.01' });
  }
  return svg;
}

function dismiss(el: HTMLElement) {
  if (el.dataset.leaving === 'true') return; // already animating out
  el.dataset.leaving = 'true';
  setTimeout(() => el.remove(), 220);
}

export function toast(message: string, opts: { tone?: Tone; ms?: number } = {}): void {
  const tone: Tone = opts.tone ?? 'info';
  const ms = opts.ms ?? 3500;
  const now = Date.now();

  // Dedupe: a rapid sequence of identical messages (e.g. tapping +-buttons
  // in a row) becomes one notification instead of a spam stack.
  if (message === lastMessage && now - lastMessageAt < DEDUPE_WINDOW_MS) {
    lastMessageAt = now;
    return;
  }
  lastMessage = message;
  lastMessageAt = now;

  const root = ensureRegion();

  // Cap how many toasts can be visible at once — push the oldest out so the
  // stack never overruns the viewport on rapid bursts.
  while (root.children.length >= MAX_VISIBLE) {
    const oldest = root.firstElementChild as HTMLElement | null;
    if (!oldest) break;
    dismiss(oldest);
  }

  const el = document.createElement('div');
  el.className = 'toast';
  el.dataset.tone = tone;
  el.setAttribute('role', tone === 'error' ? 'alert' : 'status');

  const iconWrap = document.createElement('span');
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.style.display = 'inline-flex';
  iconWrap.appendChild(buildIcon(tone));

  const text = document.createElement('span');
  text.textContent = message;

  el.append(iconWrap, text);
  root.appendChild(el);

  setTimeout(() => dismiss(el), ms);
  el.addEventListener('click', () => dismiss(el));
}
