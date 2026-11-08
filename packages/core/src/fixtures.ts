/**
 * FICTIONAL DEMONSTRATION DATA ONLY.
 *
 * Every product, speaker, amplifier, figure and source label in this file is
 * invented for the v0.4 prototype. Nothing here is a manufacturer value or a
 * measurement of a real device, and nothing here may be used to infer the
 * compatibility or performance of real equipment.
 *
 * Values are copied verbatim from `prototype/index.html` (v0.4) so that the
 * ported application reproduces the approved baseline behaviour.
 */
import { DEMO_DATASET } from './model/demo-dataset.ts';
import { toDemoProduct } from './model/adapter.ts';
import { assertUsable } from './model/prepare.ts';
import type { DemoAmp, DemoProduct, DemoSpeaker, FeatureKey, MetricKey, PresetKey, Weights } from './types.ts';

/** Label shown wherever demo data appears. */
export const FICTIONAL_DATA_NOTICE = 'FICTIONAL DEMO DATA ONLY' as const;

export { DEMO_CONDITIONS } from './model/demo-dataset.ts';

/**
 * Product view consumed by the Phase 1 UI and scorer, projected from
 * `DEMO_DATASET` (one measurement per metric with source and status).
 * The literal values are pinned in `test/model/projection.test.ts`.
 */
/** The demo dataset after the quality gate (throws at load if it ever acquires an error). */
export const PREPARED_DEMO_DATASET = assertUsable(DEMO_DATASET);

export const DEMO_PRODUCTS: readonly DemoProduct[] = DEMO_DATASET.products.map((p) => toDemoProduct(PREPARED_DEMO_DATASET, p.id));

/** Japanese labels for the four metrics, in display order. */
export const METRIC_LABELS: Readonly<Record<MetricKey, string>> = {
  price: '価格',
  power: '出力',
  thdn: '低歪み',
  snr: 'S/N',
};

export const FEATURE_LABELS: Readonly<Record<FeatureKey, string>> = {
  hdmi: 'HDMI ARC',
  usb: 'USB DAC',
  bt: 'Bluetooth',
  hp: 'ヘッドホン',
  phono: 'フォノ',
  optical: '光デジタル',
  coaxial: '同軸デジタル',
  subout: 'サブウーファー出力',
  xlr: 'XLR',
};

/** Weight presets by usage scenario (raw slider values, not percentages). */
export const WEIGHT_PRESETS: Readonly<Record<PresetKey, Weights>> = {
  balanced: { price: 25, power: 25, thdn: 30, snr: 20 },
  near: { price: 20, power: 10, thdn: 35, snr: 35 },
  power: { price: 15, power: 55, thdn: 20, snr: 10 },
  budget: { price: 65, power: 10, thdn: 15, snr: 10 },
};

export const PRESET_LABELS: Readonly<Record<PresetKey, string>> = {
  balanced: 'バランス重視',
  near: '近距離・低音量',
  power: '駆動力重視',
  budget: '価格重視',
};


/** Fictional 4 Ω figures were added for the pairing demo only. */
export const DEMO_AMPS: readonly DemoAmp[] = [
  { id: 'a', name: 'Reference Amp A', powerAt8Ohms: 85, powerAt4Ohms: 150, fictional: true },
  { id: 'b', name: 'Studio Amp B', powerAt8Ohms: 100, powerAt4Ohms: 180, fictional: true },
  { id: 'd', name: 'Drive Amp D', powerAt8Ohms: 155, powerAt4Ohms: 250, fictional: true },
  { id: 'e', name: 'Compact Amp E', powerAt8Ohms: 40, powerAt4Ohms: null, fictional: true },
];

export const DEMO_SPEAKERS: readonly DemoSpeaker[] = [
  {
    id: 's1',
    name: 'Monitor Speaker M',
    sensitivity: { valueDb: 85, reference: '1W/1m' },
    nominalOhms: 8,
    minimumOhms: null,
    impedancePhase: null,
    fictional: true,
  },
  {
    id: 's2',
    name: 'Easy Speaker E',
    sensitivity: { valueDb: 90, reference: '1W/1m' },
    nominalOhms: 8,
    minimumOhms: 6.2,
    impedancePhase: null,
    fictional: true,
  },
  {
    id: 's3',
    name: 'Demanding Speaker D',
    sensitivity: { valueDb: 83, reference: '1W/1m' },
    nominalOhms: 4,
    minimumOhms: 2.8,
    impedancePhase: null,
    fictional: true,
  },
];

/** Default pairing inputs of the prototype form. */
export const DEFAULT_PAIRING_INPUT = {
  distanceM: 1.5,
  targetPeakSpl: 95,
  stereoGainDb: 3,
  safetyMarginDb: 3,
} as const;
