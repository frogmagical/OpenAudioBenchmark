/**
 * Adapter from the provenance model to the Phase 1 `DemoProduct` view that
 * the current UI renders. Everything derives from a projection; nothing is
 * typed in twice.
 */
import type { DemoProduct, EvidenceStatus } from '../types.ts';
import { assertUsable } from './prepare.ts';
import type { PreparedDataset } from './prepare.ts';
import { projectProduct, toMetricValues } from './project.ts';
import { statusRank } from './rules.ts';
import type { Dataset, ProductProjection, Source } from './types.ts';

/** Legacy label format `ID: notes` used by the v0.4 UI ("出典・測定証跡"). */
export function sourceLabel(source: Source): string {
  return source.notes ? `${source.id}: ${source.notes}` : source.id;
}

/** Sources referenced by a product's measurements, in first-appearance order. The dataset must pass the gate. */
export function sourcesForProduct(input: Dataset | PreparedDataset, productId: string): Source[] {
  const { dataset } = assertUsable(input);
  const ids: string[] = [];
  for (const m of dataset.measurements) {
    if (m.productId === productId && m.sourceId !== null && !ids.includes(m.sourceId)) ids.push(m.sourceId);
  }
  return ids.map((id) => dataset.sources.find((s) => s.id === id)).filter((s): s is Source => s !== undefined);
}

/**
 * Best evidence status among the selected metrics (observed > manufacturer >
 * estimated > missing). A product with only estimates is `estimated`, one
 * with nothing usable is `missing`; neither is ever reported as manufacturer data.
 */
export function summarizeEvidence(projection: ProductProjection): EvidenceStatus {
  return Object.values(projection.metrics)
    .map((m) => m.status)
    .sort((a, b) => statusRank(a) - statusRank(b))[0] ?? 'missing';
}

export function toDemoProduct(input: Dataset | PreparedDataset, productId: string): DemoProduct {
  const prepared = assertUsable(input);
  const dataset = prepared.dataset;
  if (!dataset.fictional) {
    throw new Error('toDemoProduct only renders fictional datasets; real data needs the provenance-aware view');
  }
  const product = dataset.products.find((p) => p.id === productId);
  if (!product) throw new Error(`Unknown product ${productId}`);
  const projection: ProductProjection = projectProduct(prepared, productId);
  const values = toMetricValues(projection);
  const evidence = summarizeEvidence(projection);
  const verified = evidence === 'observed';
  const powerMeasurement = dataset.measurements.find((m) => m.id === projection.metrics.power.measurementId);
  return {
    id: product.id,
    name: product.name,
    subtitle: product.subtitle,
    price: values.price,
    power: values.power,
    thdn: values.thdn,
    snr: values.snr,
    features: product.features,
    verified,
    sources: sourcesForProduct(dataset, productId).map(sourceLabel),
    evidence,
    conditions: powerMeasurement?.conditions ?? {},
    fictional: true,
  };
}
