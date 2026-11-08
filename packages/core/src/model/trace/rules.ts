/** Physical and structural rules for electrical load traces (ADR-0006). */

/**
 * A passive one-port's driving-point impedance has a non-negative real part,
 * so its principal phase lies within ±90° (inclusive). For a trace declared
 * `passive`, a value outside this range is a measurement or processing error
 * (a sign-convention flip cannot produce it: it preserves |phase|). The check
 * is a warning for `unknown` passivity and disabled for `not-passive` devices.
 * No tolerance for stated uncertainty is applied here; that policy is a PL
 * decision recorded as open in ADR-0006.
 */
export const PHASE_RANGE_DEG = { min: -90, max: 90 } as const;

/**
 * A trace needs at least this many primary (measured or converted) points to
 * be stored as a curve. Storage policy, not physics — see ADR-0006 §decisions.
 */
export const MIN_PRIMARY_POINTS = 2;

/** Unit in which absolute/range impedance uncertainty must be stated. */
export const IMPEDANCE_UNIT = 'Ω' as const;

export const TRACE_POINT_KIND_LABELS = {
  measured: '測定点',
  interpolated: '補間点',
  converted: '換算点',
} as const;
