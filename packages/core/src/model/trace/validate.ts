/** Validation of speaker electrical load traces. Pure; never mutates. */
import { isBlank, isCalendarDate, isInvalidUncertainty, isZeroUncertainty, uncertaintyUnit } from '../common.ts';
import type { Product, QualityIssue, Source } from '../types.ts';
import { IMPEDANCE_UNIT, MIN_PRIMARY_POINTS, PHASE_RANGE_DEG } from './rules.ts';
import type { SpeakerElectricalTrace, TracePoint } from './types.ts';

export interface TraceValidationInput {
  readonly traces: readonly SpeakerElectricalTrace[];
  readonly products: readonly Product[];
  readonly sources: readonly Source[];
}

const isPrimary = (p: TracePoint): boolean => p.kind === 'measured' || p.kind === 'converted';

/**
 * Presupposes `products`/`sources` from a dataset that passed `prepareDataset`; duplicate ids in the
 * supplied context are nevertheless reported (`trace.context-duplicate-product` / `-source`) because
 * a wrong registry would silently change which record a trace refers to.
 *
 * Error codes — trace level: `trace.duplicate-id`, `trace.id-empty`, `trace.unknown-product`,
 * `trace.unknown-source`, `trace.product-not-speaker`, `trace.status-source-kind-conflict`,
 * `trace.too-few-points` (fewer than MIN_PRIMARY_POINTS distinct primary frequencies),
 * `trace.derivation-required`, `trace.derivation-forbidden`, `trace.uncertainty-zero`,
 * `trace.uncertainty-invalid`, `trace.uncertainty-unit-mismatch` (absolute/range not in Ω),
 * `trace.phase-uncertainty-invalid`, `trace.version-invalid`, `trace.captured-at-invalid`,
 * `trace.technique-empty`, `trace.sense-resistor-invalid` (non-finite or ≤ 0 when present),
 * `trace.condition-value-invalid` (frequencyHz/loadOhms ≤ 0 or non-finite, bandwidth low ≥ high).
 * Point level (`traces[i].points[j]`): `trace.frequency-invalid`, `trace.frequency-not-increasing`,
 * `trace.impedance-invalid` (non-finite or ≤ 0), `trace.phase-invalid` (non-finite),
 * `trace.phase-out-of-range` (passive trace, outside ±90°), `trace.point-empty`,
 * `trace.derived-from-required` / `-forbidden`, `trace.derived-from-invalid` (not `[f]` exact hit or
 * `[lo, hi]` with lo < f < hi, both primary and adjacent — no primary frequency strictly between them),
 * `trace.conversion-required` / `-forbidden`, `trace.conversion-blank`.
 *
 * Warnings: `trace.revision-unknown` (null or blank), `trace.drive-level-unstated`, `trace.phase-missing`,
 * `trace.uncertainty-unstated`, `trace.conditions-unrecorded`, `trace.passivity-unknown`,
 * `trace.phase-outside-passive-range` (passivity unknown and a phase beyond ±90°),
 * `trace.context-duplicate-product`, `trace.context-duplicate-source`.
 */
export function validateTraces(input: TraceValidationInput): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const add = (code: string, severity: QualityIssue['severity'], path: string, message: string, relatedIds: string[]) =>
    issues.push({ code, severity, path, message, relatedIds });

  const products = new Map<string, Product>();
  input.products.forEach((p, i) => {
    if (products.has(p.id)) add('trace.context-duplicate-product', 'warning', `products[${i}]`, '製品の識別子が重複しています。トレースの参照先が一意に決まりません', [p.id]);
    else products.set(p.id, p);
  });
  const sources = new Map<string, Source>();
  input.sources.forEach((s, i) => {
    if (sources.has(s.id)) add('trace.context-duplicate-source', 'warning', `sources[${i}]`, '出典の識別子が重複しています。トレースの参照先が一意に決まりません', [s.id]);
    else sources.set(s.id, s);
  });
  const duplicateProduct = new Set(input.products.filter((p, i, arr) => arr.findIndex((q) => q.id === p.id) !== i).map((p) => p.id));
  const duplicateSource = new Set(input.sources.filter((s, i, arr) => arr.findIndex((q) => q.id === s.id) !== i).map((s) => s.id));
  const seen = new Set<string>();

  input.traces.forEach((trace, i) => {
    const path = `traces[${i}]`;
    const ids = [trace.id];
    const error = (code: string, message: string, p = path, related = ids) => add(code, 'error', p, message, related);
    const warn = (code: string, message: string) => add(code, 'warning', path, message, ids);

    if (isBlank(trace.id) || trace.id === '') error('trace.id-empty', 'トレースの識別子が空です');
    if (seen.has(trace.id)) error('trace.duplicate-id', 'トレースの識別子が重複しています');
    seen.add(trace.id);

    const product = products.get(trace.productId);
    if (!product || duplicateProduct.has(trace.productId)) {
      error('trace.unknown-product', duplicateProduct.has(trace.productId) ? '参照先の製品が一意に決まりません（識別子の重複）' : '参照先の製品が見つかりません', path, [trace.id, trace.productId]);
    } else if (product.category !== 'speaker') {
      error('trace.product-not-speaker', `電気的負荷特性はスピーカーにのみ記録できます（${product.category}）`, path, [trace.id, product.id]);
    }
    const source = sources.get(trace.sourceId);
    if (!source || duplicateSource.has(trace.sourceId)) {
      error('trace.unknown-source', duplicateSource.has(trace.sourceId) ? '参照先の出典が一意に決まりません（識別子の重複）' : '参照先の出典が見つかりません', path, [trace.id, trace.sourceId]);
    } else if (
      (trace.status === 'observed' && source.kind === 'manufacturer') ||
      (trace.status === 'manufacturer' && source.kind === 'independent-lab')
    ) {
      error('trace.status-source-kind-conflict', 'トレースの証拠種別と出典の種別が矛盾しています', path, [trace.id, source.id]);
    }

    if (trace.status === 'estimated' && (trace.derivation === null || isBlank(trace.derivation))) error('trace.derivation-required', '推定トレースには導出方法の記録が必要です');
    if (trace.status !== 'estimated' && trace.derivation !== null) error('trace.derivation-forbidden', '推定以外のトレースに導出方法は設定できません');
    if (!Number.isInteger(trace.version) || trace.version <= 0) error('trace.version-invalid', 'トレースの版は正の整数でなければなりません');
    if (trace.capturedAt !== null && !isCalendarDate(trace.capturedAt)) error('trace.captured-at-invalid', '測定日は YYYY-MM-DD 形式の実在する日付で記録してください');
    if (trace.method.technique.trim() === '') error('trace.technique-empty', '測定手法（technique）を記録してください');
    if (trace.method.senseResistorOhms !== null && (!Number.isFinite(trace.method.senseResistorOhms) || trace.method.senseResistorOhms <= 0)) {
      error('trace.sense-resistor-invalid', 'センス抵抗は正の有限値（Ω）で記録してください');
    }
    const c = trace.conditions;
    if (
      (c.frequencyHz !== undefined && (!Number.isFinite(c.frequencyHz) || c.frequencyHz <= 0)) ||
      (c.loadOhms !== undefined && (!Number.isFinite(c.loadOhms) || c.loadOhms <= 0)) ||
      (c.bandwidthHz !== undefined && (!Number.isFinite(c.bandwidthHz[0]) || !Number.isFinite(c.bandwidthHz[1]) || c.bandwidthHz[0] <= 0 || c.bandwidthHz[0] >= c.bandwidthHz[1]))
    ) {
      error('trace.condition-value-invalid', '測定条件の数値が不正です（周波数・負荷は正の有限値、帯域は low < high）');
    }

    const u = trace.impedanceUncertainty;
    if (u !== null) {
      if (isZeroUncertainty(u)) error('trace.uncertainty-zero', '不確かさをゼロで記録できません。不明な場合は null にしてください');
      else if (isInvalidUncertainty(u)) error('trace.uncertainty-invalid', '不確かさは有限の非負値（範囲は low ≤ high）で記録してください');
      else if (uncertaintyUnit(u) !== null && uncertaintyUnit(u) !== IMPEDANCE_UNIT) {
        error('trace.uncertainty-unit-mismatch', `インピーダンスの不確かさは ${IMPEDANCE_UNIT} で記録してください（${uncertaintyUnit(u)}）`);
      }
    }
    if (trace.phaseUncertaintyDeg !== null && (!Number.isFinite(trace.phaseUncertaintyDeg) || trace.phaseUncertaintyDeg <= 0)) {
      error('trace.phase-uncertainty-invalid', '位相の不確かさは正の有限値（度）で記録してください');
    }

    const primaryFrequencies = trace.points.filter(isPrimary).map((p) => p.frequencyHz).filter((f) => Number.isFinite(f) && f > 0);
    const primarySet = new Set(primaryFrequencies);
    if (primarySet.size < MIN_PRIMARY_POINTS) {
      error('trace.too-few-points', `測定点・換算点が ${MIN_PRIMARY_POINTS} 点未満のため曲線として扱えません（${primarySet.size} 点）`);
    }
    const sortedPrimary = [...primarySet].sort((a, b) => a - b);
    const adjacent = (lo: number, hi: number): boolean => {
      const i = sortedPrimary.indexOf(lo);
      return i >= 0 && sortedPrimary[i + 1] === hi;
    };

    let previous = -Infinity;
    let anyPhase = false;
    let phaseBeyondPassive = false;
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
        if (!Number.isFinite(pt.phaseDeg)) perr('trace.phase-invalid', `位相は有限値（度）でなければなりません: ${pt.phaseDeg}`);
        else {
          const outside = pt.phaseDeg < PHASE_RANGE_DEG.min || pt.phaseDeg > PHASE_RANGE_DEG.max;
          if (outside && trace.passivity === 'passive') {
            perr('trace.phase-out-of-range', `受動負荷の位相は ${PHASE_RANGE_DEG.min}°〜${PHASE_RANGE_DEG.max}° の範囲にあるはずです: ${pt.phaseDeg}°（測定・処理の誤り、または受動でない機器の可能性）`);
          } else if (outside && trace.passivity === 'unknown') phaseBeyondPassive = true;
          if (isPrimary(pt)) anyPhase = true;
        }
      }
      if (pt.impedanceOhms === null && pt.phaseDeg === null) perr('trace.point-empty', 'インピーダンスも位相も無い点は記録できません（点を省いてください）');

      if (pt.kind === 'interpolated') {
        if (pt.derivedFrom === null || pt.derivedFrom.length === 0) perr('trace.derived-from-required', '補間点には元になった周波数（derivedFrom）が必要です');
        else {
          const d = pt.derivedFrom;
          const ok =
            (d.length === 1 && d[0] === pt.frequencyHz && primarySet.has(d[0]!)) ||
            (d.length === 2 && d[0]! < pt.frequencyHz && pt.frequencyHz < d[1]! && primarySet.has(d[0]!) && primarySet.has(d[1]!) && adjacent(d[0]!, d[1]!));
          if (!ok) perr('trace.derived-from-invalid', `derivedFrom は [f]（一致点）または隣接する測定点 [lo, hi]（lo < f < hi）でなければなりません: [${d.join(', ')}] → ${pt.frequencyHz} Hz`);
        }
        if (pt.conversion !== null) perr('trace.conversion-forbidden', '補間点に conversion は設定できません');
      } else {
        if (pt.derivedFrom !== null) perr('trace.derived-from-forbidden', `${pt.kind} 点に derivedFrom は設定できません`);
        if (pt.kind === 'converted') {
          if (pt.conversion === null) perr('trace.conversion-required', '換算点には元の表現と換算方法（conversion）が必要です');
          else if (isBlank(pt.conversion.from) || pt.conversion.from === '' || isBlank(pt.conversion.method) || pt.conversion.method === '') perr('trace.conversion-blank', 'conversion の from / method を空にできません');
        } else if (pt.conversion !== null) perr('trace.conversion-forbidden', '測定点に conversion は設定できません');
      }
    });

    if (trace.revision === null || isBlank(trace.revision)) warn('trace.revision-unknown', '対象のモデル・リビジョンが未確認です。別リビジョンでは特性が異なる可能性があります');
    if (trace.method.driveLevel === null || isBlank(trace.method.driveLevel)) warn('trace.drive-level-unstated', '駆動レベルが未記録です。共振付近のインピーダンスはレベルに依存します');
    if (!anyPhase && primarySet.size >= MIN_PRIMARY_POINTS) warn('trace.phase-missing', '位相データがありません。絶対値だけでは負荷の性質を十分に記述できません');
    if (trace.impedanceUncertainty === null) warn('trace.uncertainty-unstated', 'インピーダンスの不確かさが未記録です');
    if ((c.environment === undefined) && (c.method === undefined || isBlank(c.method))) warn('trace.conditions-unrecorded', '測定環境・方法が未記録です（キャビネット状態、温度、ポート開閉など）');
    if (trace.passivity === 'unknown') warn('trace.passivity-unknown', '受動負荷かどうかが未確認のため、位相範囲の検証を警告に留めています');
    if (phaseBeyondPassive) warn('trace.phase-outside-passive-range', '±90° を超える位相があります。受動負荷なら測定・処理の誤り、能動機器なら passivity を not-passive に設定してください');
  });
  return issues;
}

export function areTracesUsable(input: TraceValidationInput): boolean {
  return !validateTraces(input).some((i) => i.severity === 'error');
}
