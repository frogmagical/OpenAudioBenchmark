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
import type {
  DemoAmp,
  DemoProduct,
  DemoSpeaker,
  FeatureKey,
  MeasurementConditions,
  MetricKey,
  NormalizationBounds,
  PresetKey,
  Weights,
} from './types.ts';

/** Label shown wherever demo data appears. */
export const FICTIONAL_DATA_NOTICE = 'FICTIONAL DEMO DATA ONLY' as const;

/**
 * The demo assumes all amplifier figures share one measurement condition set.
 * Real data must carry its own conditions; see docs/METHODOLOGY.md.
 */
export const DEMO_CONDITIONS: MeasurementConditions = {
  loadOhms: 8,
  channelsDriven: 2,
  bandwidthHz: [20, 20000],
  method: 'demo-assumed-identical',
};

export const DEMO_PRODUCTS: readonly DemoProduct[] = [
  {
    id: 'a',
    name: 'Reference Amp A',
    subtitle: 'バランス型の一体型アンプ',
    price: 46000,
    power: 85,
    thdn: 0.005,
    snr: 105,
    features: ['hdmi', 'usb', 'bt', 'hp'],
    verified: true,
    sources: ['DEMO-LAB-001: 第三者測定（架空）', 'DEMO-MFG-001: メーカー仕様（架空）'],
    evidence: 'observed',
    conditions: DEMO_CONDITIONS,
    fictional: true,
  },
  {
    id: 'b',
    name: 'Studio Amp B',
    subtitle: '測定性能重視のシンプル設計',
    price: 34000,
    power: 100,
    thdn: 0.0015,
    snr: 111,
    features: ['usb', 'hp'],
    verified: true,
    sources: ['DEMO-LAB-002: 第三者測定（架空）'],
    evidence: 'observed',
    conditions: DEMO_CONDITIONS,
    fictional: true,
  },
  {
    id: 'c',
    name: 'Living Amp C',
    subtitle: 'テレビ連携を重視した多機能機',
    price: 32000,
    power: 75,
    thdn: 0.01,
    snr: 98,
    features: ['hdmi', 'usb', 'bt', 'hp', 'phono'],
    verified: false,
    sources: ['DEMO-MFG-003: メーカー公称（架空）'],
    evidence: 'manufacturer',
    conditions: DEMO_CONDITIONS,
    fictional: true,
  },
  {
    id: 'd',
    name: 'Drive Amp D',
    subtitle: '高出力に特化したアンプ',
    price: 69000,
    power: 155,
    thdn: 0.002,
    snr: 108,
    features: ['usb', 'bt'],
    verified: true,
    sources: ['DEMO-LAB-004: 第三者測定（架空）'],
    evidence: 'observed',
    conditions: DEMO_CONDITIONS,
    fictional: true,
  },
  {
    id: 'e',
    name: 'Compact Amp E',
    subtitle: '低価格・省スペース設計',
    price: 24000,
    power: 40,
    thdn: null,
    snr: 92,
    features: ['usb', 'bt'],
    verified: false,
    sources: ['DEMO-MFG-005: THD+N未公表（架空）'],
    evidence: 'manufacturer',
    conditions: DEMO_CONDITIONS,
    fictional: true,
  },
  {
    id: 'f',
    name: 'Classic Amp F',
    subtitle: 'アナログ入力中心の設計',
    price: 54000,
    power: 115,
    thdn: 0.004,
    snr: null,
    features: ['hp', 'phono'],
    verified: false,
    sources: ['DEMO-MFG-006: S/N未公表（架空）'],
    evidence: 'manufacturer',
    conditions: DEMO_CONDITIONS,
    fictional: true,
  },
];

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

/**
 * Fixed reference ranges of the v0.4 demo (amplifiers only). These are
 * temporary illustrative bounds, not a standard.
 */
export const METRIC_BOUNDS: Readonly<Record<MetricKey, NormalizationBounds>> = {
  price: { min: 20000, max: 100000, invert: true, scale: 'linear', unit: 'JPY' },
  power: { min: 20, max: 160, invert: false, scale: 'linear', unit: 'W' },
  thdn: { min: -4, max: -1, invert: true, scale: 'log10', unit: '%' },
  snr: { min: 70, max: 120, invert: false, scale: 'linear', unit: 'dB' },
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
