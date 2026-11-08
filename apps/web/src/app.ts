/** Wires the six views of the v0.4 workspace onto the static markup in index.html. */
import { PREPARED_DEMO_DATASET } from '@openaudiobenchmark/core';
import type { PreparedDataset } from '@openaudiobenchmark/core';
import { qs } from './dom.ts';
import { initCatalog } from './views/catalog.ts';
import type { CatalogController } from './views/catalog.ts';
import { renderMethodologyMeta } from './views/methodology.ts';
import { initNavigation } from './views/navigation.ts';
import { initPairing } from './views/pairing.ts';

export interface App {
  readonly catalog: CatalogController;
}

export function initApp(prepared: PreparedDataset = PREPARED_DEMO_DATASET): App {
  qs('#nproducts').textContent = String(prepared.dataset.products.length);
  const catalog = initCatalog(prepared);
  initPairing();
  renderMethodologyMeta();
  initNavigation();
  return { catalog };
}
