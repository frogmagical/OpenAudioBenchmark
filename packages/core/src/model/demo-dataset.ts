/**
 * FICTIONAL DEMONSTRATION DATASET.
 *
 * The same six invented amplifiers as the v0.4 prototype, now expressed as
 * provenance records: each figure is a Measurement with its own source,
 * evidence status, unit and conditions. No value here describes a real device.
 */
import type { MeasurementConditions } from '../types.ts';
import type { Dataset, Measurement, MeasurementStatus, MetricId, Product, Source, Unit } from './types.ts';
import { DATASET_SCHEMA_VERSION } from './types.ts';
import type { SourceReuse } from './types.ts';

const CAPTURED_DATE = '2026-11-08';

/** Fictional data carries no third-party rights; marked allowed so the gate exercises the permitted path. */
const DEMO_REUSE: SourceReuse = {
  quoteFacts: 'allowed',
  reproduceFigures: 'allowed',
  storeRawData: 'allowed',
  redistribute: 'allowed',
  basis: 'fictional demonstration data authored by this project',
  checkedAt: CAPTURED_DATE,
};

/**
 * The demo assumes all amplifier figures share one measurement condition set.
 * Output level and weighting are deliberately unrecorded: the quality checks
 * must report that THD+N and S/N figures are missing required conditions.
 */
export const DEMO_CONDITIONS: MeasurementConditions = {
  loadOhms: 8,
  channelsDriven: 2,
  bandwidthHz: [20, 20000],
  method: 'demo-assumed-identical',
};

const CAPTURED = CAPTURED_DATE;

function source(id: string, kind: Source['kind'], publisher: string, notes: string): Source {
  return { id, kind, publisher, url: null, publishedAt: null, accessedAt: CAPTURED, license: null, notes, archiveRef: null, tier: 'primary', reuse: DEMO_REUSE };
}

const UNIT: Record<MetricId, Unit> = { price: 'JPY', power: 'W', thdn: '%', snr: 'dB', sensitivity: 'dB', nominalImpedance: 'Ω', minimumImpedance: 'Ω', crossoverFrequency: 'Hz' };

function measurement(
  productId: string,
  metric: MetricId,
  value: number | null,
  status: MeasurementStatus,
  sourceId: string | null,
): Measurement {
  return {
    id: `m-${productId}-${metric}`,
    productId,
    metric,
    value,
    unit: UNIT[metric],
    status,
    sourceId,
    conditions: DEMO_CONDITIONS,
    uncertainty: null,
    derivation: null,
    capturedAt: null,
    version: 1,
    notes: null,
  };
}

function product(id: string, name: string, subtitle: string, features: Product['features']): Product {
  return { id, maker: 'Demo Audio（架空）', model: name, revision: null, category: 'integrated-amplifier', name, subtitle, features, region: null, dimensionsMm: null, massKg: null, fictional: true };
}

const products: Product[] = [
  product('a', 'Reference Amp A', 'バランス型の一体型アンプ', ['hdmi', 'usb', 'bt', 'hp']),
  product('b', 'Studio Amp B', '測定性能重視のシンプル設計', ['usb', 'hp']),
  product('c', 'Living Amp C', 'テレビ連携を重視した多機能機', ['hdmi', 'usb', 'bt', 'hp', 'phono']),
  product('d', 'Drive Amp D', '高出力に特化したアンプ', ['usb', 'bt']),
  product('e', 'Compact Amp E', '低価格・省スペース設計', ['usb', 'bt']),
  product('f', 'Classic Amp F', 'アナログ入力中心の設計', ['hp', 'phono']),
];

const sources: Source[] = [
  source('DEMO-LAB-001', 'independent-lab', 'Demo Measurement Lab（架空）', '第三者測定（架空）'),
  source('DEMO-MFG-001', 'manufacturer', 'Demo Audio（架空）', 'メーカー仕様（架空）'),
  source('DEMO-LAB-002', 'independent-lab', 'Demo Measurement Lab（架空）', '第三者測定（架空）'),
  source('DEMO-MFG-003', 'manufacturer', 'Demo Audio（架空）', 'メーカー公称（架空）'),
  source('DEMO-LAB-004', 'independent-lab', 'Demo Measurement Lab（架空）', '第三者測定（架空）'),
  source('DEMO-MFG-005', 'manufacturer', 'Demo Audio（架空）', 'THD+N未公表（架空）'),
  source('DEMO-MFG-006', 'manufacturer', 'Demo Audio（架空）', 'S/N未公表（架空）'),
];

// Order matters for the legacy source labels: independent figures are listed before the price source.
const measurements: Measurement[] = [
  measurement('a', 'power', 85, 'observed', 'DEMO-LAB-001'),
  measurement('a', 'thdn', 0.005, 'observed', 'DEMO-LAB-001'),
  measurement('a', 'snr', 105, 'observed', 'DEMO-LAB-001'),
  measurement('a', 'price', 46000, 'manufacturer', 'DEMO-MFG-001'),

  measurement('b', 'power', 100, 'observed', 'DEMO-LAB-002'),
  measurement('b', 'thdn', 0.0015, 'observed', 'DEMO-LAB-002'),
  measurement('b', 'snr', 111, 'observed', 'DEMO-LAB-002'),
  measurement('b', 'price', 34000, 'observed', 'DEMO-LAB-002'),

  measurement('c', 'price', 32000, 'manufacturer', 'DEMO-MFG-003'),
  measurement('c', 'power', 75, 'manufacturer', 'DEMO-MFG-003'),
  measurement('c', 'thdn', 0.01, 'manufacturer', 'DEMO-MFG-003'),
  measurement('c', 'snr', 98, 'manufacturer', 'DEMO-MFG-003'),

  measurement('d', 'power', 155, 'observed', 'DEMO-LAB-004'),
  measurement('d', 'thdn', 0.002, 'observed', 'DEMO-LAB-004'),
  measurement('d', 'snr', 108, 'observed', 'DEMO-LAB-004'),
  measurement('d', 'price', 69000, 'observed', 'DEMO-LAB-004'),

  measurement('e', 'price', 24000, 'manufacturer', 'DEMO-MFG-005'),
  measurement('e', 'power', 40, 'manufacturer', 'DEMO-MFG-005'),
  measurement('e', 'thdn', null, 'missing', null),
  measurement('e', 'snr', 92, 'manufacturer', 'DEMO-MFG-005'),

  measurement('f', 'price', 54000, 'manufacturer', 'DEMO-MFG-006'),
  measurement('f', 'power', 115, 'manufacturer', 'DEMO-MFG-006'),
  measurement('f', 'thdn', 0.004, 'manufacturer', 'DEMO-MFG-006'),
  measurement('f', 'snr', null, 'missing', null),
];

export const DEMO_DATASET: Dataset = {
  schemaVersion: DATASET_SCHEMA_VERSION,
  fictional: true,
  products,
  sources,
  measurements,
};
