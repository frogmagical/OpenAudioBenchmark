/** Wires the six views of the v0.4 workspace onto the static markup in index.html. */
import { PREPARED_DEMO_DATASET, assertUsable } from '@openaudiobenchmark/core';
import type { PreparedDataset } from '@openaudiobenchmark/core';
import { qs } from './dom.ts';
import { initCatalog } from './views/catalog.ts';
import type { CatalogController } from './views/catalog.ts';
import { renderMethodologyMeta } from './views/methodology.ts';
import { initNavigation } from './views/navigation.ts';
import { initPairing } from './views/pairing.ts';
import { renderSources } from './views/sources.ts';

export interface App {
  readonly catalog: CatalogController;
}

export function initApp(prepared: PreparedDataset = PREPARED_DEMO_DATASET): App {
  // The quality gate must hold for the whole dataset, not only for the products that happen to be
  // projected (an empty product list would otherwise bypass it — found by the schema 1.1 test worker).
  assertUsable(prepared);
  qs('#nproducts').textContent = String(prepared.dataset.products.length);
  const catalog = initCatalog(prepared);
  initPairing();
  renderMethodologyMeta();
  renderSources(prepared);
  initNavigation();
  return { catalog };
}
