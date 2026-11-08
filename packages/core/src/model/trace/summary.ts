/** Descriptive summary of a trace. No verdicts (ADR-0006). */
import type { SpeakerElectricalTrace, TracePoint, TraceSummary } from './types.ts';

const isPrimary = (p: TracePoint): boolean => p.kind === 'measured' || p.kind === 'converted';

export function summarizeTrace(trace: SpeakerElectricalTrace): TraceSummary {
  const primary = trace.points.filter(isPrimary);
  const withZ = primary.filter((p): p is TracePoint & { impedanceOhms: number } => p.impedanceOhms !== null);
  const withPhase = primary.filter((p): p is TracePoint & { phaseDeg: number } => p.phaseDeg !== null);
  const first = trace.points[0];
  const last = trace.points[trace.points.length - 1];
  const min = withZ.reduce<(typeof withZ)[number] | null>((acc, p) => (acc === null || p.impedanceOhms < acc.impedanceOhms ? p : acc), null);
  const max = withZ.reduce<(typeof withZ)[number] | null>((acc, p) => (acc === null || p.impedanceOhms > acc.impedanceOhms ? p : acc), null);
  const phaseMin = withPhase.reduce<(typeof withPhase)[number] | null>((acc, p) => (acc === null || p.phaseDeg < acc.phaseDeg ? p : acc), null);
  const phaseMax = withPhase.reduce<(typeof withPhase)[number] | null>((acc, p) => (acc === null || p.phaseDeg > acc.phaseDeg ? p : acc), null);
  return {
    traceId: trace.id,
    frequencyRangeHz: first && last ? [first.frequencyHz, last.frequencyHz] : [NaN, NaN],
    pointCount: trace.points.length,
    measuredPointCount: trace.points.filter((p) => p.kind === 'measured').length,
    primaryPointCount: primary.length,
    minimumImpedance: min ? { ohms: min.impedanceOhms, frequencyHz: min.frequencyHz, phaseDegAtMinimum: min.phaseDeg } : null,
    maximumImpedance: max ? { ohms: max.impedanceOhms, frequencyHz: max.frequencyHz } : null,
    phaseExtremesDeg:
      phaseMin && phaseMax
        ? { min: { deg: phaseMin.phaseDeg, frequencyHz: phaseMin.frequencyHz }, max: { deg: phaseMax.phaseDeg, frequencyHz: phaseMax.frequencyHz } }
        : null,
    note:
      '記述統計のみ。アンプとの適合性・安全性・音質の判定ではありません。電流供給能力・保護回路・負荷別出力特性が不明なため判定保留です。位相の極値と最小インピーダンスは別の周波数で生じることがあります。',
  };
}
