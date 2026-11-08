/** Number formatting used by the catalog and comparison views. */

export const UNMEASURED = '未測定';

/** Integer-ish values with ja-JP grouping; `null` is shown as 未測定, never as 0. */
export function fmt(n: number | null): string {
  return n === null ? UNMEASURED : n.toLocaleString('ja-JP');
}

export function fmtPercent(thdn: number | null): string {
  return thdn === null ? UNMEASURED : `${thdn}%`;
}

export function fmtDb(snr: number | null): string {
  return snr === null ? UNMEASURED : `${snr} dB`;
}

/** `toFixed(1)` for finite numbers, an em dash otherwise. */
export function fmtFixed1(x: number | null): string {
  return x !== null && Number.isFinite(x) ? x.toFixed(1) : '—';
}

/** Today's date as YYYY-MM-DD (local time), used to stamp exports. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
