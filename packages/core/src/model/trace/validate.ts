/** Validation of speaker electrical load traces. Pure; never mutates. */
import type { Product, QualityIssue, Source } from '../types.ts';
import { MIN_MEASURED_POINTS, PHASE_RANGE_DEG } from './rules.ts';
import type { SpeakerElectricalTrace } from './types.ts';

export interface TraceValidationInput {
  readonly traces: readonly SpeakerElectricalTrace[];
  readonly products: readonly Product[];
  readonly sources: readonly Source[];
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function blank(s: string | null): boolean {
  return s !== null && s.trim() === '';
}

/**
 * Error codes: `trace.duplicate-id`, `trace.id-empty`, `trace.unknown-product`, `trace.unknown-source`,
 * `trace.product-not-speaker` (product category must be `speaker`), `trace.too-few-points`
 * (fewer than MIN_MEASURED_POINTS measured points), `trace.frequency-invalid` (non-finite or ≤ 0),
 * `trace.frequency-not-increasing` (not strictly increasing), `trace.impedance-invalid`
 * (non-finite or ≤ 0 when present), `trace.phase-out-of-range` (non-finite or outside ±90°),
 * `trace.point-empty` (both impedance and phase null), `trace.derived-from-required`
 * (interpolated/converted point without `derivedFrom`), `trace.derived-from-unknown`
 * (`derivedFrom` frequency that is not a measured point of the same trace),
 * `trace.derived-from-forbidden` (measured point with `derivedFrom`), `trace.derivation-required`
 * (status estimated without derivation), `trace.derivation-forbidden`, `trace.uncertainty-zero`,
 * `trace.uncertainty-invalid`, `trace.phase-uncertainty-invalid` (≤ 0 or non-finite when present),
 * `trace.version-invalid`, `trace.captured-at-invalid`, `trace.technique-empty`,
 * `trace.status-source-kind-conflict` (observed from a manufacturer source or manufacturer from a lab).
 *
 * Warning codes: `trace.revision-unknown`, `trace.drive-level-unstated`, `trace.phase-missing`
 * (no phase on any measured point), `trace.uncertainty-unstated`, `trace.conditions-unrecorded`
 * (no `environment` and no `method` in conditions).
 *
 * Paths `traces[i]` or `traces[i].points[j]`. Order: dataset order, points in order. Deterministic.
 */
export function validateTraces(input: TraceValidationInput): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const add = (code: string, severity: QualityIssue['severity'], path: string, message: string, relatedIds: string[]) =>
    issues.push({ code, severity, path, message, relatedIds });
  const products = new Map(input.products.map((p) => [p.id, p]));
  const sources = new Map<string, Source>();
  for (const s of input.sources) if (!sources.has(s.id)) sources.set(s.id, s);
  const seen = new Set<string>();

  input.traces.forEach((trace, i) => {
    const path = `traces[${i}]`;
    const ids = [trace.id];
    const error = (code: string, message: string, p = path, related = ids) => add(code, 'error', p, message, related);
    const warn = (code: string, message: string) => add(code, 'warning', path, message, ids);

    if (trace.id.trim() === '') error('trace.id-empty', 'トレースの識別子が空です');
    if (seen.has(trace.id)) error('trace.duplicate-id', 'トレースの識別子が重複しています');
    seen.add(trace.id);

    const product = products.get(trace.productId);
    if (!product) error('trace.unknown-product', '参照先の製品が見つかりません', path, [trace.id, trace.productId]);
    else if (product.category !== 'speaker') {
      error('trace.product-not-speaker', `電気的負荷特性はスピーカーにのみ記録できます（${product.category}）`, path, [trace.id, product.id]);
    }
    const source = sources.get(trace.sourceId);
    if (!source) error('trace.unknown-source', '参照先の出典が見つかりません', path, [trace.id, trace.sourceId]);
    else if (
      (trace.status === 'observed' && source.kind === 'manufacturer') ||
      (trace.status === 'manufacturer' && source.kind === 'independent-lab')
    ) {
      error('trace.status-source-kind-conflict', 'トレースの証拠種別と出典の種別が矛盾しています', path, [trace.id, source.id]);
    }

    if (trace.status === 'estimated' && (trace.derivation === null || blank(trace.derivation))) {
      error('trace.derivation-required', '推定トレースには導出方法の記録が必要です');
    }
    if (trace.status !== 'estimated' && trace.derivation !== null) error('trace.derivation-forbidden', '推定以外のトレースに導出方法は設定できません');
    if (!Number.isInteger(trace.version) || trace.version <= 0) error('trace.version-invalid', 'トレースの版は正の整数でなければなりません');
    if (trace.capturedAt !== null && !isCalendarDate(trace.capturedAt)) error('trace.captured-at-invalid', '測定日は YYYY-MM-DD 形式の実在する日付で記録してください');
    if (trace.method.technique.trim() === '') error('trace.technique-empty', '測定手法（technique）を記録してください');

    const u = trace.impedanceUncertainty;
    if (u !== null) {
      const zero = (u.type === 'absolute' && u.plusMinus === 0) || (u.type === 'relative' && u.plusMinusPercent === 0) || (u.type === 'range' && u.low === u.high);
      const invalid =
        (u.type === 'absolute' && (!Number.isFinite(u.plusMinus) || u.plusMinus < 0)) ||
        (u.type === 'relative' && (!Number.isFinite(u.plusMinusPercent) || u.plusMinusPercent < 0)) ||
        (u.type === 'range' && (!Number.isFinite(u.low) || !Number.isFinite(u.high) || u.low > u.high));
      if (zero) error('trace.uncertainty-zero', '不確かさをゼロで記録できません。不明な場合は null にしてください');
      else if (invalid) error('trace.uncertainty-invalid', '不確かさは有限の非負値（範囲は low ≤ high）で記録してください');
    }
    if (trace.phaseUncertaintyDeg !== null && (!Number.isFinite(trace.phaseUncertaintyDeg) || trace.phaseUncertaintyDeg <= 0)) {
      error('trace.phase-uncertainty-invalid', '位相の不確かさは正の有限値（度）で記録してください');
    }

    const measuredFrequencies = new Set(trace.points.filter((p) => p.kind === 'measured').map((p) => p.frequencyHz));
    if (measuredFrequencies.size < MIN_MEASURED_POINTS) {
      error('trace.too-few-points', `測定点が ${MIN_MEASURED_POINTS} 点未満のため曲線として扱えません（${measuredFrequencies.size} 点）`);
    }
    let previous = -Infinity;
    let anyPhase = false;
    trace.points.forEach((pt, j) => {
      const ppath = `${path}.points[${j}]`;
      const perr = (code: string, message: string) => error(code, message, ppath);
      if (!Number.isFinite(pt.frequencyHz) || pt.frequencyHz <= 0) perr('trace.frequency-invalid', `周波数は正の有限値（Hz）でなければなりません: ${pt.frequencyHz}`);
      else if (pt.frequencyHz <= previous) perr('trace.frequency-not-increasing', `周波数は狭義単調増加で並べてください: ${previous} Hz の後に ${pt.frequencyHz} Hz`);
      if (Number.isFinite(pt.frequencyHz)) previous = Math.max(previous, pt.frequencyHz);
      if (pt.impedanceOhms !== null && (!Number.isFinite(pt.impedanceOhms) || pt.impedanceOhms <= 0)) {
        perr('trace.impedance-invalid', `インピーダンス絶対値は正の有限値（Ω）でなければなりません: ${pt.impedanceOhms}`);
      }
      if (pt.phaseDeg !== null) {
        if (!Number.isFinite(pt.phaseDeg) || pt.phaseDeg < PHASE_RANGE_DEG.min || pt.phaseDeg > PHASE_RANGE_DEG.max) {
          perr('trace.phase-out-of-range', `受動負荷の位相は ${PHASE_RANGE_DEG.min}°〜${PHASE_RANGE_DEG.max}° の範囲にあるはずです: ${pt.phaseDeg}°（符号規約または測定の誤りの可能性）`);
        } else if (pt.kind === 'measured') anyPhase = true;
      }
      if (pt.impedanceOhms === null && pt.phaseDeg === null) perr('trace.point-empty', 'インピーダンスも位相も無い点は記録できません（点を省いてください）');
      if (pt.kind === 'measured' && pt.derivedFrom !== null) perr('trace.derived-from-forbidden', '測定点に derivedFrom は設定できません');
      if (pt.kind !== 'measured') {
        if (pt.derivedFrom === null || pt.derivedFrom.length === 0) perr('trace.derived-from-required', `${pt.kind} 点には元になった測定周波数（derivedFrom）が必要です`);
        else {
          const unknown = pt.derivedFrom.filter((f) => !measuredFrequencies.has(f));
          if (unknown.length > 0) perr('trace.derived-from-unknown', `derivedFrom に測定点でない周波数があります: ${unknown.join(', ')} Hz`);
        }
      }
    });

    if (trace.revision === null) warn('trace.revision-unknown', '対象のモデル・リビジョンが未確認です。別リビジョンでは特性が異なる可能性があります');
    if (trace.method.driveLevel === null) warn('trace.drive-level-unstated', '駆動レベルが未記録です。共振付近のインピーダンスはレベルに依存します');
    if (!anyPhase && measuredFrequencies.size >= MIN_MEASURED_POINTS) warn('trace.phase-missing', '位相データがありません。絶対値だけでは負荷の性質を十分に記述できません');
    if (trace.impedanceUncertainty === null) warn('trace.uncertainty-unstated', 'インピーダンスの不確かさが未記録です');
    if (trace.conditions.environment === undefined && trace.conditions.method === undefined) {
      warn('trace.conditions-unrecorded', '測定環境・方法が未記録です（キャビネット状態、温度、ポート開閉など）');
    }
  });
  return issues;
}

export function areTracesUsable(input: TraceValidationInput): boolean {
  return !validateTraces(input).some((i) => i.severity === 'error');
}
