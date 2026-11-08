/**
 * Amp–speaker pairing estimate of the v0.4 demo (simplified free-field model).
 *
 *   SPL        ≈ S(1W/1m) + 10·log10(P / 1 W) − 20·log10(d / 1 m) + stereoGain
 *   P_required = 10 ^ ((targetPeak + safetyMargin − S(1W/1m) + 20·log10(d) − stereoGain) / 10)
 *   headroom   = 10·log10(P_available / P_required)
 *
 * Only the output/headroom aspect is estimated. Electrical load stability and
 * frequency-dependent behaviour are always reported as `pending` because the
 * demo has no impedance-phase, output-impedance or load-dependent data.
 * None of this is a safety guarantee.
 */
import {
  DISTANCE_RANGE_M,
  HEADROOM_NEUTRAL_DB,
  HEADROOM_POSITIVE_DB,
  METHODOLOGY_VERSION,
  PEAK_SPL_RANGE_DB,
} from './methodology.ts';
import type { DemoAmp, DemoSpeaker, PairingInput, PairingResult, PairingVerdict, SensitivitySpec } from './types.ts';

/**
 * Convert a sensitivity figure to dB @ 1 W / 1 m for the given nominal load.
 * - `1W/1m` → returned unchanged.
 * - `2.83V/1m` → 2.83 V delivers 8/Z watts into Z ohms, so
 *   `S(1W) = S(2.83V) − 10·log10(8 / nominalOhms)`; identical only for 8 Ω
 *   (4 Ω: −3.01 dB, 16 Ω: +3.01 dB).
 * Throws `RangeError` when `nominalOhms` is not a finite positive number.
 */
export function sensitivityAt1W(spec: SensitivitySpec, nominalOhms: number): number {
  void spec;
  void nominalOhms;
  throw new Error('not implemented');
}

/**
 * Power per channel (W) needed for `targetPeakSpl + safetyMarginDb` at `distanceM`.
 * Pure formula; does not validate ranges (see `validatePairingInput`).
 */
export function requiredPowerW(sensitivityAt1WDb: number, input: PairingInput): number {
  void sensitivityAt1WDb;
  void input;
  throw new Error('not implemented');
}

/**
 * Amplifier output into the speaker's nominal load:
 * 8 → `powerAt8Ohms`, 4 → `powerAt4Ohms`, any other load → `null` (unknown).
 * A non-finite or non-positive published figure is also returned as `null`.
 */
export function availablePowerForLoad(amp: DemoAmp, nominalOhms: number): number | null {
  void amp;
  void nominalOhms;
  throw new Error('not implemented');
}

/** `10·log10(available / required)`; `null` when `available` is null. Never NaN. */
export function headroomDb(availableW: number | null, requiredW: number): number | null {
  void availableW;
  void requiredW;
  throw new Error('not implemented');
}

/**
 * `null` → 'pending'; ≥ HEADROOM_POSITIVE_DB → 'positive';
 * ≥ HEADROOM_NEUTRAL_DB → 'neutral'; otherwise 'negative'.
 * Boundaries are inclusive on the upper category (exactly 3 dB is positive, exactly 0 dB is neutral).
 */
export function classifyHeadroom(headroom: number | null): PairingVerdict {
  void headroom;
  void HEADROOM_POSITIVE_DB;
  void HEADROOM_NEUTRAL_DB;
  throw new Error('not implemented');
}

/**
 * Problem codes for an input, empty when valid:
 * - `distance-invalid` (non-finite) / `distance-out-of-range` (outside DISTANCE_RANGE_M, inclusive)
 * - `peak-invalid` / `peak-out-of-range` (outside PEAK_SPL_RANGE_DB, inclusive)
 * - `stereo-gain-invalid`, `safety-margin-invalid` (non-finite)
 */
export function validatePairingInput(input: PairingInput): string[] {
  void input;
  void DISTANCE_RANGE_M;
  void PEAK_SPL_RANGE_DB;
  throw new Error('not implemented');
}

/**
 * Full pairing evaluation. Returns `{ ok: false, error: 'invalid-input', problems }`
 * when `validatePairingInput` reports anything; otherwise a `PairingSuccess`
 * with `loadVerdict` and `bandVerdict` fixed to 'pending' and
 * `methodologyVersion = METHODOLOGY_VERSION`.
 */
export function evaluatePairing(amp: DemoAmp, speaker: DemoSpeaker, input: PairingInput): PairingResult {
  void amp;
  void speaker;
  void input;
  void METHODOLOGY_VERSION;
  throw new Error('not implemented');
}
