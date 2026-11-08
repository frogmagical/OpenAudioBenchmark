/** Wires the six views of the v0.4 workspace onto the static markup in index.html. */
import { DEMO_PRODUCTS } from '@openaudiobenchmark/core';
import { qs } from './dom.ts';
import { initCatalog } from './views/catalog.ts';
import type { CatalogController } from './views/catalog.ts';
import { renderMethodologyMeta } from './views/methodology.ts';
import { initNavigation } from './views/navigation.ts';
import { initPairing } from './views/pairing.ts';

export interface App {
  readonly catalog: CatalogController;
}

export function initApp(): App {
  qs('#nproducts').textContent = String(DEMO_PRODUCTS.length);
  const catalog = initCatalog(DEMO_PRODUCTS);
  initPairing();
  renderMethodologyMeta();
  initNavigation();
  return { catalog };
}
