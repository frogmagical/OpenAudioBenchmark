/** Catalog filtering and ranking, ported from the v0.4 prototype. */
import { calculateUtility } from './scoring.ts';
import { COVERAGE_THRESHOLD } from './methodology.ts';
import type { CatalogFilter, DemoProduct, Weights } from './types.ts';

/**
 * Keep products that satisfy every constraint.
 * - `budgetMax`: product.price must be ≤ budgetMax. A `null`/`undefined`/non-finite
 *   budget means no limit. A product with `price === null` is excluded when a
 *   budget is set (unknown price cannot be proven affordable) and kept otherwise.
 * - `requiredFeatures`: every listed feature must be present (empty list = no constraint).
 * - `verifiedOnly`: when true, keep only `verified === true`.
 * Returns a new array; input order is preserved.
 */
export function filterProducts(products: readonly DemoProduct[], filter: CatalogFilter): DemoProduct[] {
  const budget = filter.budgetMax;
  const limited = budget != null && Number.isFinite(budget);
  return products.filter(product =>
    (!limited || (product.price !== null && product.price <= budget)) &&
    (filter.requiredFeatures ?? []).every(feature => product.features.includes(feature)) &&
    (!filter.verifiedOnly || product.verified),
  );
}

/**
 * Stable sort (new array) reproducing the prototype order:
 * 1. products with `coverage < COVERAGE_THRESHOLD` sort after those at/above it;
 * 2. within a group, descending `score`, with a `null` score treated as -1.
 */
export function rankProducts(products: readonly DemoProduct[], weights: Weights): DemoProduct[] {
  return products
    .map(product => ({ product, result: calculateUtility(product, weights) }))
    .sort((a, b) => {
      const group = Number(a.result.coverage < COVERAGE_THRESHOLD) - Number(b.result.coverage < COVERAGE_THRESHOLD);
      return group || (b.result.score ?? -1) - (a.result.score ?? -1);
    })
    .map(({ product }) => product);
}
