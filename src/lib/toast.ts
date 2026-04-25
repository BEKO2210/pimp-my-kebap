// Powered by skill: frontend-design, accessibility
// Tiny toast queue. Builds DOM via createElementNS — CSP-safe (no innerHTML).

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
    append('path', { d: 'M12 3l10 17H2L12 3z' });
    append('line', { x1: '12', y1: '10', x2: '12', y2: '14' });
    append('line', { x1: '12', y1: '17.5', x2: '12', y2: '17.6' });
  } else if (tone === 'success') {
    append('polyline', { points: '4 12 10 18 20 6' });
  } else {
    // info: a small dot inside a circle
    append('circle', { cx: '12', cy: '12', r: '9' });
    append('line', { x1: '12', y1: '8', x2: '12', y2: '12' });
    append('line', { x1: '12', y1: '15.5', x2: '12', y2: '15.6' });
  }
  return svg;
}

export function toast(message: string, opts: { tone?: Tone; ms?: number } = {}): void {
  const tone: Tone = opts.tone ?? 'info';
  const ms = opts.ms ?? 3500;
  const root = ensureRegion();

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

  const dismiss = () => {
    el.dataset.leaving = 'true';
    setTimeout(() => el.remove(), 220);
  };
  setTimeout(dismiss, ms);
  el.addEventListener('click', dismiss);
}
