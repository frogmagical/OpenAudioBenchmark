/** Descriptive summary of a trace. No verdicts (ADR-0006). */
import type { SpeakerElectricalTrace, TraceSummary } from './types.ts';

export function summarizeTrace(trace: SpeakerElectricalTrace): TraceSummary {
  const measured = trace.points.filter((p) => p.kind === 'measured');
  const withZ = measured.filter((p): p is typeof p & { impedanceOhms: number } => p.impedanceOhms !== null);
  const withPhase = measured.filter((p): p is typeof p & { phaseDeg: number } => p.phaseDeg !== null);
  const first = trace.points[0];
  const last = trace.points[trace.points.length - 1];
  const min = withZ.reduce<(typeof withZ)[number] | null>((acc, p) => (acc === null || p.impedanceOhms < acc.impedanceOhms ? p : acc), null);
  const max = withZ.reduce<(typeof withZ)[number] | null>((acc, p) => (acc === null || p.impedanceOhms > acc.impedanceOhms ? p : acc), null);
  return {
    traceId: trace.id,
    frequencyRangeHz: first && last ? [first.frequencyHz, last.frequencyHz] : [NaN, NaN],
    pointCount: trace.points.length,
    measuredPointCount: measured.length,
    minimumImpedance: min ? { ohms: min.impedanceOhms, frequencyHz: min.frequencyHz } : null,
    maximumImpedance: max ? { ohms: max.impedanceOhms, frequencyHz: max.frequencyHz } : null,
    phaseExtremesDeg:
      withPhase.length > 0
        ? { min: Math.min(...withPhase.map((p) => p.phaseDeg)), max: Math.max(...withPhase.map((p) => p.phaseDeg)) }
        : null,
    note:
      '記述統計のみ。アンプとの適合性・安全性・音質の判定ではありません。電流供給能力・保護回路・負荷別出力特性が不明なため判定保留です。',
  };
}
