/** Physical and structural rules for electrical load traces (ADR-0006). */

/**
 * A passive one-port's driving-point impedance has a non-negative real part,
 * so its phase lies within ±90°. Values outside indicate a measurement or
 * sign-convention error; they are rejected rather than clamped.
 */
export const PHASE_RANGE_DEG = { min: -90, max: 90 } as const;

/** A trace needs at least this many measured points to describe a curve. */
export const MIN_MEASURED_POINTS = 2;

export const TRACE_POINT_KIND_LABELS = {
  measured: '測定点',
  interpolated: '補間点',
  converted: '換算点',
} as const;
