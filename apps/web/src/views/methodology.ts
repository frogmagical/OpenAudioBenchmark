/**
 * Methodology view (04) additions: the methodology version and the explicit
 * known-limits list required by Phase 1 (docs/tasks/PHASE1_TASKS.md, P1-C).
 * The static text of the v0.4 prototype stays in index.html unchanged.
 */
import {
  COVERAGE_THRESHOLD,
  HEADROOM_NEUTRAL_DB,
  HEADROOM_POSITIVE_DB,
  METHODOLOGY_VERSION,
} from '@openaudiobenchmark/core';
import { qs } from '../dom.ts';

export const KNOWN_LIMITS: readonly string[] = [
  '収録データはすべて架空のデモ用です。実在機器の性能・互換性は一切推定できません。',
  `参考適合度の正規化範囲とカバー率${Math.round(COVERAGE_THRESHOLD * 100)}%の閾値は製品上の仮説であり、科学的に校正された値ではありません。`,
  `出力余裕の区分（+${HEADROOM_POSITIVE_DB}dB以上＝余裕あり、${HEADROOM_NEUTRAL_DB}〜${HEADROOM_POSITIVE_DB}dB未満＝必要出力を満たす）はUI上の暫定区分であり、安全性の保証ではありません。`,
  '相性診断は自由音場近似です。室内反射、近接音場、指向性、熱圧縮、アンプの動的制限は再現しません。',
  '公称インピーダンスと定格出力だけでは負荷安定性を判定できません。インピーダンス振幅・位相、電流供給能力、保護動作の測定が必要です。',
  'メーカー公称値と第三者測定値は証拠種別として区別し、同一視しません。測定条件が異なる値の直接比較は行いません。',
  '製品リビジョン、不確かさ、価格履歴の扱いは未定義です（Phase 2以降）。',
];

export function renderMethodologyMeta(): void {
  const section = qs('#methodology');
  const block = document.createElement('div');
  block.className = 'formula';
  block.dataset['methodologyVersion'] = METHODOLOGY_VERSION;
  block.innerHTML =
    `<strong>計算方式のバージョンと既知の制約</strong><br/>` +
    `現在の計算方式：<code>${METHODOLOGY_VERSION}</code>。承認済みプロトタイプ v0.4 の式・基準範囲・閾値を基礎とし、` +
    `0.5.0-demo で「価格0円は価格スコアの対象外（欠測扱い）」「カバー率${Math.round(COVERAGE_THRESHOLD * 100)}%未満の製品は公開JSONの参考適合度を非公開（null）」を追加。` +
    `計算結果にはこのバージョンを付与し、式・範囲・閾値の変更時に更新します。` +
    `<ul>${KNOWN_LIMITS.map((t) => `<li>${t}</li>`).join('')}</ul>`;
  section.append(block);
}
