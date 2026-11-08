/**
 * Speaker electrical load traces (P2-3B, ADR-0006): impedance magnitude and
 * phase versus frequency, with provenance, conditions, uncertainty and an
 * explicit distinction between measured, interpolated and converted points.
 *
 * Nothing in this module judges amplifier compatibility, safety or sound.
 * Descriptive summaries (minimum |Z|, phase extremes) are extracted for
 * display only; any verdict needs amplifier current capability, protection
 * behaviour and load-dependent output data, which do not exist here.
 */
import type { MeasurementConditions } from '../../types.ts';
import type { Uncertainty } from '../types.ts';

export type TracePointKind = 'measured' | 'interpolated' | 'converted';

/** How a `converted` point was obtained from another representation at the same frequency. */
export interface PointConversion {
  /** Original representation, e.g. "radians", "dB re 1 Ω", "digitised from published graph". */
  readonly from: string;
  /** Formula or procedure, e.g. "deg = rad × 180/π". */
  readonly method: string;
  /** Identifier of the original record (file, figure, dataset) when available. */
  readonly originalRecordId: string | null;
}

export interface TracePoint {
  readonly frequencyHz: number;
  /** |Z| in ohms; `null` = not available at this frequency. */
  readonly impedanceOhms: number | null;
  /** Phase in degrees, electrical convention (positive = inductive, current lags voltage). `null` = not measured. */
  readonly phaseDeg: number | null;
  /**
   * `measured`: taken from the instrument as recorded.
   * `converted`: same frequency, value converted from another representation (`conversion` required).
   * `interpolated`: synthesised between two adjacent primary points (`derivedFrom` required).
   * Measured and converted points are "primary"; interpolated points never are.
   */
  readonly kind: TracePointKind;
  /** Interpolated points: the bracketing primary frequencies `[lo, hi]`, or `[f]` for an exact hit. Otherwise `null`. */
  readonly derivedFrom: readonly number[] | null;
  /** Converted points only. */
  readonly conversion: PointConversion | null;
}

/**
 * Whether the device under test is a passive network. The ±90° phase rule is
 * a passivity consequence and is enforced only for `passive`; `unknown`
 * downgrades it to a warning; `not-passive` (active or protection
 * electronics in the signal path) disables it.
 */
export type Passivity = 'passive' | 'not-passive' | 'unknown';

export interface TraceMethod {
  /** e.g. "constant-current sweep", "voltage divider with sense resistor", "impedance analyser". */
  readonly technique: string;
  /** Drive level description, e.g. "0.1 V", "1 V", "−20 dBV". Level affects results near resonance. */
  readonly driveLevel: string | null;
  /** Sense resistor value when applicable. */
  readonly senseResistorOhms: number | null;
  /** Sweep or stepped; log/linear spacing — informational. */
  readonly sweep: string | null;
}

export interface SpeakerElectricalTrace {
  readonly id: string;
  readonly productId: string;
  /** Exact model revision the trace applies to; `null` = unknown (a quality warning). */
  readonly revision: string | null;
  readonly sourceId: string;
  readonly status: 'observed' | 'manufacturer' | 'estimated';
  readonly passivity: Passivity;
  readonly method: TraceMethod;
  /** Environmental/electrical conditions (temperature, cabinet loading, ports open/closed via `environment`/`method`). */
  readonly conditions: MeasurementConditions;
  /** Points sorted by strictly increasing frequency. */
  readonly points: readonly TracePoint[];
  /** Uncertainty stated for |Z| — absolute/range in `Ω` or relative; `null` = unstated, never 0. */
  readonly impedanceUncertainty: Uncertainty | null;
  readonly phaseUncertaintyDeg: number | null;
  readonly capturedAt: string | null;
  readonly derivation: string | null;
  readonly version: number;
  readonly notes: string | null;
}

/** Descriptive, non-judgemental summary of a trace. */
export interface TraceSummary {
  readonly traceId: string;
  readonly frequencyRangeHz: readonly [number, number];
  readonly pointCount: number;
  readonly measuredPointCount: number;
  /** Primary (measured + converted) points carrying |Z|. */
  readonly primaryPointCount: number;
  /** Minimum |Z| among primary points, its frequency and the phase recorded at that same point (`null` if none). */
  readonly minimumImpedance: { readonly ohms: number; readonly frequencyHz: number; readonly phaseDegAtMinimum: number | null } | null;
  readonly maximumImpedance: { readonly ohms: number; readonly frequencyHz: number } | null;
  /** Most capacitive (negative) and most inductive (positive) phase among primary points, with their frequencies. */
  readonly phaseExtremesDeg: {
    readonly min: { readonly deg: number; readonly frequencyHz: number };
    readonly max: { readonly deg: number; readonly frequencyHz: number };
  } | null;
  /** Nominal impedance as the manufacturer states it, when a `nominalOhms` is recorded elsewhere — not derived here. */
  readonly note: string;
}
