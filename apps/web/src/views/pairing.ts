/**
 * Pairing view (03): reads the form, asks the core for the estimate and renders
 * the primary card, three sub-cards and the collapsible calculation details.
 * Colour semantics: positive → blue, negative → red, neutral/pending → black.
 * Every verdict also carries a text label, so colour is never the only channel.
 */
import { DEMO_AMPS, DEMO_SPEAKERS, evaluatePairing } from '@openaudiobenchmark/core';
import type { PairingVerdict } from '@openaudiobenchmark/core';
import { escapeHtml, qs } from '../dom.ts';
import { fmtFixed1 } from '../format.ts';

interface VerdictCopy {
  readonly title: string;
  readonly description: string;
  readonly tone: 'pair-positive' | 'pair-negative' | 'pair-neutral';
}

export const OUTPUT_VERDICT_COPY: Readonly<Record<PairingVerdict, VerdictCopy>> = {
  positive: {
    title: '出力に余裕あり',
    description: '指定した音圧と安全余裕を含む条件に対し、計算上は追加の出力余裕があります。',
    tone: 'pair-positive',
  },
  neutral: {
    title: '必要出力を満たす',
    description: '計算上は条件を満たしますが、追加の出力余裕は限定的です。',
    tone: 'pair-neutral',
  },
  negative: {
    title: '出力不足のおそれ',
    description: '指定した音圧と安全余裕を含む条件に、計算上の出力が届きません。',
    tone: 'pair-negative',
  },
  pending: {
    title: '判定保留',
    description: '対象負荷でのアンプ出力が未測定です。',
    tone: 'pair-neutral',
  },
};

export const INVALID_INPUT_TEXT = '視聴距離と目標音圧の入力値を確認してください。';

const INPUT_IDS = ['pairAmp', 'pairSpeaker', 'pairDistance', 'pairPeak', 'pairGain', 'pairMargin'] as const;

export function renderPairing(): void {
  const target = qs('#pairResult');
  const amp = DEMO_AMPS.find((a) => a.id === qs<HTMLSelectElement>('#pairAmp').value);
  const speaker = DEMO_SPEAKERS.find((s) => s.id === qs<HTMLSelectElement>('#pairSpeaker').value);
  if (!amp || !speaker) {
    target.innerHTML = `<div class="notice">${INVALID_INPUT_TEXT}</div>`;
    return;
  }
  const input = {
    distanceM: Number(qs<HTMLInputElement>('#pairDistance').value),
    targetPeakSpl: Number(qs<HTMLInputElement>('#pairPeak').value),
    stereoGainDb: Number(qs<HTMLSelectElement>('#pairGain').value),
    safetyMarginDb: Number(qs<HTMLSelectElement>('#pairMargin').value),
  };
  const result = evaluatePairing(amp, speaker, input);
  if (!result.ok) {
    target.innerHTML = `<div class="notice" data-pairing-error="${escapeHtml(result.problems.join(' '))}">${INVALID_INPUT_TEXT}</div>`;
    return;
  }

  const copy = OUTPUT_VERDICT_COPY[result.outputVerdict];
  const headroomText =
    result.headroomDb === null ? '判定保留' : `${result.headroomDb >= 0 ? '+' : ''}${fmtFixed1(result.headroomDb)} dB`;
  const ohm = speaker.nominalOhms;
  const sens = speaker.sensitivity;

  target.innerHTML = `
 <section class="pair-report" aria-label="相性診断の結果" data-methodology-version="${escapeHtml(result.methodologyVersion)}">
  <h3 class="pair-report-heading">診断結果</h3>
  <div class="pair-hero" data-verdict="${result.outputVerdict}"><div class="pair-hero-label">出力適合の判定（簡易推定）</div><div class="pair-hero-title ${copy.tone}">${copy.title}</div><p class="pair-hero-description">${copy.description} 帯域別の音質や電気的安全性を保証する判定ではありません。</p></div>
  <div class="pair-result-grid">
   <div class="pair-result-card" data-card="output" data-verdict="${result.outputVerdict}"><div class="pair-result-label">音圧・出力の余裕</div><div class="pair-result-value ${copy.tone}">${headroomText}</div><div class="pair-result-note">必要出力と${ohm}Ω時の公称出力を比較した値</div></div>
   <div class="pair-result-card" data-card="load" data-verdict="${result.loadVerdict}"><div class="pair-result-label">電気的負荷の適合性</div><div class="pair-result-value pair-neutral">判定保留</div><div class="pair-result-note">公称${ohm}Ω。最低インピーダンス・位相角とアンプの安定性データが不足</div></div>
   <div class="pair-result-card" data-card="band" data-verdict="${result.bandVerdict}"><div class="pair-result-label">低域・中域・高域の相性</div><div class="pair-result-value pair-neutral">判定保留</div><div class="pair-result-note">周波数別の出力インピーダンス・応答・歪みデータが不足</div></div>
  </div>
  <div class="pair-measurements"><h4>計算に用いた数値</h4><div class="pair-measure-grid">
   <div class="pair-measure"><small>必要出力 / ch（概算）</small><strong>${fmtFixed1(result.requiredPowerW)} W</strong></div>
   <div class="pair-measure"><small>アンプ出力 / ch（${ohm}Ω・デモ）</small><strong>${result.availablePowerW === null ? '未測定' : `${fmtFixed1(result.availablePowerW)} W`}</strong></div>
   <div class="pair-measure"><small>出力ヘッドルーム</small><strong class="${copy.tone}">${headroomText}</strong></div>
  </div></div>
  <details class="pair-method"><summary>判定根拠と未測定項目を確認</summary>
   <p>自由音場近似、距離 ${input.distanceM}m、ピーク ${input.targetPeakSpl}dB SPL、ステレオ補正 +${input.stereoGainDb}dB、安全余裕 +${input.safetyMarginDb}dB。追加余裕3dB以上を「余裕あり」、0～3dB未満を「必要出力を満たす」と表示するUI上の暫定区分です。</p>
   <p>スピーカー感度 ${sens.valueDb}dB（${sens.reference} 基準。1W/1m換算 ${fmtFixed1(result.sensitivityAt1WDb)}dB）、公称インピーダンス ${ohm}Ω、最小インピーダンス ${speaker.minimumOhms === null ? '未測定' : `${speaker.minimumOhms}Ω`}。公称値だけではアンプの安定動作を証明できません。</p>
   <p>帯域別判定に必要：アンプの出力インピーダンス対周波数、4/8Ωなどの負荷別周波数応答・歪み、スピーカーのインピーダンス振幅・位相と歪み対音圧。</p>
   <p>すべて架空のデモパラメータです。実在機器への適合性・安全性を保証しません。計算方式 ${escapeHtml(result.methodologyVersion)}。</p>
  </details>
 </section>`;
}

export function initPairing(): void {
  for (const id of INPUT_IDS) qs(`#${id}`).addEventListener('input', renderPairing);
  renderPairing();
}
