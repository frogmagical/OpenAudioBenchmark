/** View navigation with hash routing, ported from the v0.4 prototype (six views) plus the Phase 2 sources view. */
import { qs, qsa } from '../dom.ts';

export const VIEW_NAMES = {
  overview: '概要',
  benchmark: '製品カタログ',
  compare: '製品の比較',
  pairing: '相性診断',
  methodology: '評価方法',
  principles: '設計原則',
  sources: '出典・根拠',
} as const;

export type ViewName = keyof typeof VIEW_NAMES;

export function isViewName(name: string): name is ViewName {
  return Object.prototype.hasOwnProperty.call(VIEW_NAMES, name);
}

export function goView(rawName: string): ViewName {
  const name: ViewName = isViewName(rawName) ? rawName : 'overview';
  for (const section of qsa<HTMLElement>('.view')) {
    const active = section.dataset['view'] === name;
    section.classList.toggle('active', active);
    section.hidden = !active;
  }
  for (const button of qsa<HTMLElement>('.menu-button')) {
    if (button.dataset['go'] === name) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  qs('#currentView').textContent = VIEW_NAMES[name];
  if (location.hash !== `#${name}`) history.replaceState(null, '', `#${name}`);
  window.scrollTo({ top: 0, behavior: 'instant' });
  return name;
}

const onDocumentClick = (e: Event): void => {
  const el = (e.target as Element | null)?.closest<HTMLElement>('[data-go]');
  if (el) goView(el.dataset['go'] ?? 'overview');
};
const onHashChange = (): void => {
  goView(location.hash.slice(1));
};

export function initNavigation(): void {
  // Delegated so that links rendered later (e.g. inside catalog record details) navigate too.
  // Re-registering the same function references is a no-op, so repeated init (tests) does not stack handlers.
  document.addEventListener('click', onDocumentClick);
  window.addEventListener('hashchange', onHashChange);
  goView(location.hash.slice(1) || 'overview');
  // Deep links (/#pairing): the browser scrolls to the fragment's section after this module ran,
  // which parks the section title under the sticky header. Re-assert the top once loading ends.
  // Found by the P2-2 browser verification; same behaviour existed in the v0.4 prototype.
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => window.scrollTo({ top: 0, behavior: 'instant' }), { once: true });
  }
}
