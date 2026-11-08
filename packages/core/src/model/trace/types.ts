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

export interface TracePoint {
  readonly frequencyHz: number;
  /** |Z| in ohms; `null` = not available at this frequency. */
  readonly impedanceOhms: number | null;
  /** Phase in degrees, electrical convention (positive = inductive). `null` = not measured. */
  readonly phaseDeg: number | null;
  readonly kind: TracePointKind;
  /** For interpolated/converted points: what they were derived from. */
  readonly derivedFrom: readonly number[] | null;
}

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
  readonly method: TraceMethod;
  /** Environmental/electrical conditions (temperature, cabinet loading, ports open/closed via `environment`/`method`). */
  readonly conditions: MeasurementConditions;
  /** Points sorted by strictly increasing frequency. */
  readonly points: readonly TracePoint[];
  /** Uncertainty stated for |Z| (ohms) and phase (degrees); `null` = unstated. */
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
  /** Minimum |Z| among measured points and the frequency at which it occurs; `null` if no |Z|. */
  readonly minimumImpedance: { readonly ohms: number; readonly frequencyHz: number } | null;
  readonly maximumImpedance: { readonly ohms: number; readonly frequencyHz: number } | null;
  /** Largest capacitive (most negative) and inductive (most positive) phase among measured points. */
  readonly phaseExtremesDeg: { readonly min: number; readonly max: number } | null;
  /** Nominal impedance as the manufacturer states it, when a `nominalOhms` is recorded elsewhere — not derived here. */
  readonly note: string;
}
