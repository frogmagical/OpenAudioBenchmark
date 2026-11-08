# Phase 3 — データモデルの不足項目分析

## 結論

現行モデル(ADR-0004/0005/0006)は、2製品のパイロットに必要な情報の大半を**そのまま表現できる**。モデル拡張が必要なのは次の4点に限られる。

| # | 不足 | 影響 | 対応区分 |
| --- | --- | --- | --- |
| G1 | `MetricId` が 4 指標(price / power / thdn / snr)に固定で、スピーカー指標(感度、公称/最小インピーダンス、周波数範囲、クロスオーバー)を `Measurement` として保持できない | LS50 Meta の公称値を記録できない | **拡張必須** |
| G2 | `Product.category: 'speaker'` の製品に対し、相性診断が使う `DemoSpeaker.sensitivity {valueDb, reference}` と `Measurement` の間に橋渡しがない | 感度基準(2.83V/1m と 1W/1m)の追跡ができない | **拡張必須** |
| G3 | `Source` に「一次資料/二次資料」「転載・保存・再配布の可否」「ライセンス確認状況」を区別する項目がない(`license: string | null` のみ) | 利用許諾の管理が自由文に依存 | **拡張必須** |
| G4 | `MeasurementConditions` に測定機器・試験信号の詳細(例: APx555、1 kHz、バースト/連続、電源電圧)を構造化する項目が一部しかない | 第三者測定の条件を部分的にしか記録できない | 拡張推奨(`method` 自由文で暫定可) |

それ以外(出典・証拠種別・条件・不確かさ・系譜・価格観測・インピーダンス特性・品質ゲート)は既存モデルで対応できる。

## 既存モデルで対応できる項目

| 実データの要素 | 対応するモデル | 備考 |
| --- | --- | --- |
| アンプ定格出力(負荷・THD条件つき) | `Measurement{metric:'power', unit:'W', conditions:{loadOhms, channelsDriven, bandwidthHz, outputLevel?}}` | 条件は `outputLevel` に "at 1 % THD+N" のように記録。`REQUIRED_CONDITIONS.power` を満たせる |
| THD+N / S/N(条件つき) | `Measurement{metric:'thdn' | 'snr'}` | `weighting`(A / unweighted)と `outputLevel` を必須としている |
| メーカー公称 vs 第三者測定 | `status: manufacturer / observed` + `Source.kind` | 投影は observed を優先(ADR-0004 §3)。**同一指標に両方を保持したまま、どちらを採用したかを系譜に残せる** |
| 測定条件の不一致 | `compareConditions` / `explainComparability` / 比較ビューの保留表示 | 条件キーは `RELEVANT_CONDITIONS` で指標ごとに制御 |
| 不確かさ不明 | `uncertainty: null`(0 は禁止) | 比較では `uncertainty.unstated` の注意 |
| 条件の一部欠落 | `REQUIRED_CONDITIONS` による警告、比較では `conditions.unrecorded` で保留 | — |
| 複数測定からの代表値 | `selectMeasurement`(証拠種別 → 版 → 測定日 → id) | **条件を跨いだ平均は行わない**(規則どおり) |
| 価格 | `PriceObservation` / `ExchangeRate`(ADR-0005) | 希望小売価格はメーカー出典のみ |
| インピーダンス周波数特性・位相 | `SpeakerElectricalTrace`(ADR-0006) | 一次点 2 点以上、位相 ±90°(受動宣言時) |
| 変換履歴 | `DerivedValue.steps` / JSON `provenance` | 単位換算・補間・集計を記録済み |
| 出典・証拠の表示 | 出典・根拠ビュー(P2-3C) | 価格・トレースの表示は未実装(後続) |

## 拡張が必要な項目の提案

### G1 — スピーカー指標の追加(型の拡張)

| 追加する `MetricId` | 単位 | 必須条件(提案) | 備考 |
| --- | --- | --- | --- |
| `sensitivity` | dB | `inputSignal`(2.83 V または 1 W を明記)、`environment`、`method`(距離 1 m、軸上) | 2.83V/1m と 1W/1m を**単位ではなく条件**で区別し、換算は `toCanonicalUnit` ではなく相性診断側の `sensitivityAt1W` で行う |
| `nominalImpedance` | Ω | なし(公称値はメーカー申告) | 評価には使わない。表示とトレースの文脈用 |
| `minimumImpedance` | Ω | `frequencyHz`(最小となる周波数)、`method` | 第三者測定とメーカー申告が併存し得る |
| `frequencyRange` | Hz(範囲) | `bandwidthHz` 形式ではなく値が範囲 → **`Measurement.value` が単一数値のため表現不可**。`rangeLow/rangeHigh` を持つ別型か、`low`/`high` 2 測定に分割する | 要判断(OPEN_DECISIONS D-07) |
| `crossoverFrequency` | Hz | なし | 参考情報 |

既存 4 指標の `METRIC_BOUNDS`(採点用正規化範囲)はアンプ専用である。スピーカー指標は**採点に接続しない**(採点方式の変更は PL 承認が必要)。`calculateUtility` は `MetricValues` の 4 キーのみを見るため、指標追加は採点に影響しない。

### G2 — 感度基準の追跡

`DemoSpeaker.sensitivity.reference` は手入力の列挙型である。実データでは `Measurement{metric:'sensitivity'}` の `conditions.inputSignal` から導出する橋渡し関数(`toPairingSpeaker(dataset, productId)`)を追加し、基準が未記録なら相性診断の入力に使わず「判定保留」とする。

### G3 — 出典の利用許諾メタデータ

```ts
interface Source {
  // 既存
  license: string | null;
  // 追加(提案)
  tier: 'primary' | 'secondary';                       // 一次資料(メーカー・測定者本人) / 二次資料(転載・要約)
  reuse: {
    quoteFacts: 'allowed' | 'allowed-with-attribution' | 'unknown' | 'prohibited';   // 数値の事実引用
    reproduceFigures: 'allowed' | 'allowed-with-attribution' | 'unknown' | 'prohibited'; // 図表の転載
    storeRawData: 'allowed' | 'unknown' | 'prohibited';   // 生データの保存
    redistribute: 'allowed' | 'unknown' | 'prohibited';   // 再配布
    basis: string | null;                                  // 根拠(利用規約 URL・問い合わせ結果)
    checkedAt: string | null;                              // 確認日
  };
}
```

検証規則(提案): `fictional: false` のデータセットで、`reuse.quoteFacts` が `prohibited` の出典を参照する測定はエラー、`unknown` の出典は警告とし公開ビルドでは数値を伏せてリンクのみ表示する。

### G4 — 測定条件の構造化(推奨)

`MeasurementConditions` に `instrument?: string`(例: "Audio Precision APx555")、`testSignal?: string`(例: "1 kHz sine, continuous")、`supplyVoltage?: string` を追加する。`method` 自由文で暫定運用も可能だが、比較可能性の判定キー(`RELEVANT_CONDITIONS`)に乗せるには構造化が必要。

## 検証規則で追加が必要なもの

| 規則 | 区分 | 理由 |
| --- | --- | --- |
| スピーカー製品に `power` / `thdn` / `snr` 測定を登録したらエラー、アンプ製品に `sensitivity` 等を登録したらエラー(カテゴリ×指標の整合) | 追加必須 | 現在は未チェック(P2-1 レビューでも指摘) |
| `sensitivity` に `inputSignal` が無ければ警告、相性診断では採用しない | 追加必須 | 2.83V/1W の混同防止(AGENTS §4) |
| 非架空データセットで `Source.url` 必須(既存)に加え、`reuse.quoteFacts !== 'prohibited'` | 追加必須 | 利用許諾 |
| `Product.revision` が `null` の非架空製品は警告 | 追加推奨 | 同定の不確かさを可視化 |

## 変更しないもの

- 採点式・正規化範囲・70 % 閾値・相性診断の式(方法論 0.5.0-demo)。
- 価格観測からの参考価格選択(ADR-0005 O4、未承認)。
- トレースからの判定(ADR-0006、未承認)。
