import type { METHODOLOGY_VERSION } from './methodology.ts';

/** The four indicators evaluated by the v0.4 demo utility score. */
export type MetricKey = 'price' | 'power' | 'thdn' | 'snr';
export const METRIC_KEYS: readonly MetricKey[] = ['price', 'power', 'thdn', 'snr'];

export type FeatureKey = 'hdmi' | 'usb' | 'bt' | 'hp' | 'phono' | 'optical' | 'coaxial' | 'subout' | 'xlr';

export type PresetKey = 'balanced' | 'near' | 'power' | 'budget';

/** Raw (un-normalised) slider weights, 0–100 each, as the user set them. */
export type Weights = Record<MetricKey, number>;

/**
 * Where a figure comes from. Manufacturer specifications and independent
 * measurements are never interchangeable; `missing` means unknown, not zero.
 */
export type EvidenceStatus = 'observed' | 'manufacturer' | 'estimated' | 'missing';

/**
 * Minimal measurement-condition record for Phase 1. Two figures may only be
 * compared when their conditions are compatible (see `compareConditions`).
 * `undefined` means "not recorded", which is itself a reason to flag the pair.
 */
export interface MeasurementConditions {
  /** Test frequency for single-tone figures (Hz). */
  readonly frequencyHz?: number;
  /** Measurement bandwidth [low, high] in Hz. */
  readonly bandwidthHz?: readonly [number, number];
  /** Load impedance (Ω). */
  readonly loadOhms?: number;
  readonly loadType?: 'resistive' | 'reactive' | 'speaker' | 'open';
  readonly channelsDriven?: number;
  /** Stimulus description, e.g. "1 kHz sine". */
  readonly inputSignal?: string;
  /** Output level at which the figure was taken, e.g. "1 W", "5 W", "rated power". */
  readonly outputLevel?: string;
  readonly weighting?: 'A' | 'unweighted' | 'CCIR' | 'demo-assumed';
  readonly environment?: 'anechoic' | 'quasi-anechoic' | 'in-room' | 'bench';
  /** Named procedure; demo fixtures use `demo-assumed-identical`. */
  readonly method?: string;
  /** Measurement instrument, e.g. "Audio Precision APx555", "Klippel NFS" (schema 1.1, G4). A comparison condition, never a blanket scoring-eligibility condition (D-03). */
  readonly instrument?: string;
  /** Test signal, e.g. "1 kHz sine, continuous", "burst" (G4). */
  readonly testSignal?: string;
  /** Averaging method for sensitivity, e.g. "spot", "mean", "IEC", "Listening Window" (G4, P8). */
  readonly averaging?: string;
  /** Frequency band the sensitivity was averaged over, [low, high] Hz; `[f, f]` for a spot value (P8). */
  readonly averagingBandHz?: readonly [number, number];
  /** Distortion criterion a rated power refers to, e.g. "THD+N 1 %" (G6). */
  readonly distortionCriterion?: string;
  /** Reference of a sensitivity figure. Structured on purpose: never inferred from free text (D-06). */
  readonly sensitivityReference?: '2.83V/1m' | '1W/1m';
  /** Measurement distance in metres (sensitivity, response). */
  readonly distanceM?: number;
}

/**
 * The only thing the utility calculation needs from a product: one value
 * (or `null` for unknown) per metric. `DemoProduct` satisfies this
 * structurally; the provenance model produces it through `projectMetricValues`.
 */
export type MetricValues = Readonly<Record<MetricKey, number | null>>;

/**
 * Fictional demonstration product. `fictional` is a literal `true` so a real
 * record can never be mistaken for demo data at the type level.
 * `null` = not measured / not published. Never 0.
 */
export interface DemoProduct {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
  /** Reference price in JPY. */
  readonly price: number | null;
  /** Nominal continuous output per channel into 8 Ω, in watts. */
  readonly power: number | null;
  /** THD+N in percent (e.g. 0.005 = 0.005 %). */
  readonly thdn: number | null;
  /** Signal-to-noise ratio in dB. */
  readonly snr: number | null;
  readonly features: readonly FeatureKey[];
  /** True when at least one independent (third-party) measurement exists. */
  readonly verified: boolean;
  /** Human-readable provenance labels (all fictional in Phase 1). */
  readonly sources: readonly string[];
  readonly evidence: EvidenceStatus;
  /** Conditions the power/THD+N/S-N figures are assumed to share in the demo. */
  readonly conditions: MeasurementConditions;
  readonly fictional: true;
}

/** How a metric is mapped onto the 0–100 scale. */
export interface NormalizationBounds {
  /** Lower bound of the fixed reference range, in the metric's native unit (or log10 of it). */
  readonly min: number;
  /** Upper bound of the fixed reference range. */
  readonly max: number;
  /** When true, `min` scores 100 and `max` scores 0 (lower is better). */
  readonly invert: boolean;
  /** `log10` applies Math.log10 to the value before clamping (used for THD+N). */
  readonly scale: 'linear' | 'log10';
  /**
   * When true, a value of 0 is invalid data (treated as missing), not a measurement.
   * Methodology 0.5.0-demo: a reference price of 0 JPY is excluded from the price score.
   */
  readonly requirePositive: boolean;
  readonly unit: string;
}

/** Result of the weighted utility calculation for one product. */
export interface UtilityResult {
  /** Weighted mean of available normalised metrics, or `null` when no weighted metric is available. */
  readonly score: number | null;
  /** Share (0–1) of the total weight backed by available data. 0 when total weight is 0. */
  readonly coverage: number;
  /** `scored` when `score !== null` and `coverage >= COVERAGE_THRESHOLD`; otherwise `pending`. */
  readonly status: 'scored' | 'pending';
  /** Per-metric normalised scores (0–100) or `null` when the metric is missing. */
  readonly metricScores: Readonly<Record<MetricKey, number | null>>;
  readonly usedWeight: number;
  readonly totalWeight: number;
  readonly methodologyVersion: typeof METHODOLOGY_VERSION;
}

export interface CatalogFilter {
  /** Maximum reference price (JPY). `null`/`undefined`/non-finite = no limit. */
  readonly budgetMax?: number | null;
  /** Every listed feature must be present. */
  readonly requiredFeatures?: readonly FeatureKey[];
  /** Keep only products with independent measurements. */
  readonly verifiedOnly?: boolean;
}

/** Speaker sensitivity with its reference condition made explicit. */
export interface SensitivitySpec {
  readonly valueDb: number;
  /**
   * `1W/1m`: dB SPL at 1 W input, 1 m.
   * `2.83V/1m`: dB SPL at 2.83 V input, 1 m — equals 1 W only into 8 Ω.
   */
  readonly reference: '1W/1m' | '2.83V/1m';
}

export interface DemoSpeaker {
  readonly id: string;
  readonly name: string;
  readonly sensitivity: SensitivitySpec;
  /** Nominal impedance in ohms (demo: 4 or 8). */
  readonly nominalOhms: number;
  /** Minimum impedance magnitude in ohms, or `null` when not measured. */
  readonly minimumOhms: number | null;
  /** Impedance phase data is not available for any demo speaker. */
  readonly impedancePhase: null;
  readonly fictional: true;
}

export interface DemoAmp {
  readonly id: string;
  readonly name: string;
  /** Nominal continuous output per channel into 8 Ω (W), or `null` when not published. */
  readonly powerAt8Ohms: number | null;
  /** Nominal continuous output per channel into 4 Ω (W), or `null` when not published. */
  readonly powerAt4Ohms: number | null;
  readonly fictional: true;
}

export interface PairingInput {
  readonly distanceM: number;
  readonly targetPeakSpl: number;
  /** Stereo summation assumption in dB (prototype offers 0 or +3). */
  readonly stereoGainDb: number;
  /** Safety margin added to the target peak SPL, in dB (prototype offers 0, +3, +6). */
  readonly safetyMarginDb: number;
}

/**
 * Verdict semantics shared by UI colour coding:
 * positive → blue, negative → red, neutral and pending → black.
 * `pending` must never be rendered as positive or negative.
 */
export type PairingVerdict = 'positive' | 'neutral' | 'negative' | 'pending';

export interface PairingSuccess {
  readonly ok: true;
  /** Sensitivity converted to dB @ 1 W / 1 m for the speaker's nominal load. */
  readonly sensitivityAt1WDb: number;
  /** Power per channel needed to reach target + margin at the listening distance (W). */
  readonly requiredPowerW: number;
  /** Amplifier output into the speaker's nominal load (W), or `null` when unknown. */
  readonly availablePowerW: number | null;
  /** 10·log10(available / required), or `null` when `availablePowerW` is null. */
  readonly headroomDb: number | null;
  readonly outputVerdict: PairingVerdict;
  /** Always `pending` in Phase 1: nominal impedance cannot prove load stability. */
  readonly loadVerdict: 'pending';
  /** Always `pending` in Phase 1: no frequency-dependent data exists. */
  readonly bandVerdict: 'pending';
  readonly inputs: PairingInput;
  readonly ampId: string;
  readonly speakerId: string;
  readonly methodologyVersion: typeof METHODOLOGY_VERSION;
}

export interface PairingFailure {
  readonly ok: false;
  readonly error: 'invalid-input';
  /** Machine-readable problem codes, e.g. `distance-out-of-range`. */
  readonly problems: readonly string[];
}

export type PairingResult = PairingSuccess | PairingFailure;

export interface ConditionComparison {
  /**
   * `compatible`: every recorded condition is recorded and equal on both sides, and at least one is recorded.
   * `incompatible`: at least one condition differs or is recorded on one side only.
   * `undetermined`: nothing is recorded on either side — unknown conditions are never assumed identical.
   */
  readonly status: 'compatible' | 'incompatible' | 'undetermined';
  /** `status === 'compatible'`. Kept for ergonomic checks; never true for undetermined. */
  readonly compatible: boolean;
  /** Keys that differ or are unrecorded on one side, sorted alphabetically. Empty unless incompatible. */
  readonly mismatches: readonly (keyof MeasurementConditions)[];
  /** Keys recorded (and equal) on both sides, sorted alphabetically. */
  readonly shared: readonly (keyof MeasurementConditions)[];
}
