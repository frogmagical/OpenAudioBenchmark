# Phase 3 — データモデルの不足項目分析

## 結論

現行モデル(ADR-0004/0005/0006)は、2製品のパイロットに必要な情報の多くを**そのまま表現できる**。モデル拡張が必要なのは次の 9 点(G1〜G9)。**PL 判定(2026-11-08)**: G1〜G8 の必要性は承認。G5 は `MeasurementReference`(欠測とは別型)案を優先検討。G9(採点適格性)は D-17 選択肢 B の承認に伴い追加。いずれも本工程では実装しない。

| # | 不足 | 影響 | 対応区分 |
| --- | --- | --- | --- |
| G1 | `MetricId` が 4 指標(price / power / thdn / snr)に固定で、スピーカー指標(感度、公称/最小インピーダンス、周波数範囲、クロスオーバー)を `Measurement` として保持できない | LS50 Meta の公称値を記録できない | **拡張必須** |
| G2 | `Product.category: 'speaker'` の製品に対し、相性診断が使う `DemoSpeaker.sensitivity {valueDb, reference}` と `Measurement` の間に橋渡しがない | 感度基準(2.83V/1m と 1W/1m)の追跡ができない | **拡張必須** |
| G3 | `Source` に「一次資料/二次資料」「転載・保存・再配布の可否」「ライセンス確認状況」を区別する項目がない(`license: string | null` のみ) | 利用許諾の管理が自由文に依存 | **拡張必須** |
| G4 | `MeasurementConditions` に測定機器・試験信号・平均方法・平均帯域(感度)を構造化する項目がなく、`method` 自由文に混在 | 機器・手順・試験信号を判定キーにできない(いずれも同等性確認まで保留、D-03)。感度の平均方法・帯域を判定キーにできない(D-13) | **拡張必須**(D-03/D-13 の前提) |
| G5 | 「値を持たないが出典・条件・リンクを持つ測定」(第三者測定の所在のみ記録、許諾未確認で伏せる値)の置き場がない。`missing` に出典を付けるとエラー(`measurement.source-forbidden`)、参照されない出典は警告 | SOURCE_INVENTORY の「所在・条件・リンクのみ」運用(D-16)と P7 の「伏せる」を表現できない | **拡張必須** |
| G6 | 定格出力の**歪み基準**(1 % / 0.1 % THD+N など)を保持する条件キーがない。`outputLevel` は「図を取った出力レベル」の意味で、転用は誤用 | 歪み基準が異なる W を別測定として弾けない | **拡張必須** |
| G7 | `Product` に地域・市場、寸法・質量の項目がない。`FeatureKey` が `hdmi/usb/bt/hp/phono` のアンプ専用列挙で、光・同軸・サブウーファー出力やスピーカーの属性を表せない | 「型番・地域仕様・リビジョン」の同定結果と、LS50 Meta の文書間差(質量・奥行)を記録できない | 拡張推奨(同定記録は `notes` で暫定可) |
| G8 | `Source` 等の拡張に伴う `DATASET_SCHEMA_VERSION`('1.0')の更新方針がない。ゲートは版不一致をエラーにする | スキーマ変更時に既存データが読めなくなる | 方針決定が必要(1.1 へ更新、架空データも同時移行) |
| G9 | **採点適格性**の概念がない。現行は必須条件未記録の値も投影され採点に入る | D-17(選択肢 B)を実装できない。「欠測」と「値はあるが採点不適格」を区別できない | **拡張必須**(ADR-0007 P9) |

それ以外(出典・証拠種別・条件・不確かさ・系譜・価格観測・インピーダンス特性・品質ゲート)は既存モデルで対応できる。なお、現行の投影は**必須条件が未記録でも値を採用し採点に渡す**(警告のみ)。PL 判定により、これは改める(D-17 選択肢 B → G9)。

## 既存モデルで対応できる項目

| 実データの要素 | 対応するモデル | 備考 |
| --- | --- | --- |
| アンプ定格出力(負荷・ch 数・帯域) | `Measurement{metric:'power', unit:'W', conditions:{loadOhms, channelsDriven, bandwidthHz}}` | `REQUIRED_CONDITIONS.power` は満たせるが、**歪み基準は保持できない**(G6 で拡張) |
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
| `frequencyRange` | Hz(範囲) | `Measurement.value` が単一数値のため表現不可 → **範囲型**(`{ lowHz, highHz, toleranceDb, conditions }` を一体で保持)を追加。2 測定への分割は不採用 | PL 承認(D-07) |
| `crossoverFrequency` | Hz | なし | 参考情報 |

既存 4 指標の `METRIC_BOUNDS`(採点用正規化範囲)はアンプ専用である。スピーカー指標は**採点に接続しない**(採点方式の変更は PL 承認が必要)。

**型構造上の前提**: 現在 `MetricId = MetricKey` であり、`METRIC_BOUNDS` / `Weights` / `MetricValues` / `METRIC_UNITS` / `REQUIRED_CONDITIONS` / `ProductProjection.metrics` がすべて `Record<MetricKey, …>` で定義されている。`MetricKey` に指標を足すと `METRIC_BOUNDS` と `Weights` への追加が型で強制され、採点側へ漏れる。したがって G1 は次を必須条件とする。

- `MetricKey`(採点 4 指標、`METRIC_KEYS` は 4 件のまま)と `MetricId = MetricKey | SpeakerMetricId`(モデル)を分離する。
- `projectProduct` は `MetricId` 全体を投影し、`toMetricValues` は `METRIC_KEYS` の 4 件だけを採点へ渡す(スピーカー指標は投影結果にあっても採点入力にならない)。
- 検証: `METRIC_BOUNDS` に新キーが存在しないことの型テスト、`calculateUtility` の入力型が 4 キーのままであるテスト。

### G2 — 感度基準の追跡

`DemoSpeaker.sensitivity.reference` は閉じた列挙 `'1W/1m' | '2.83V/1m'` である。実データでは自由文 `inputSignal` からの推測ではなく、**構造化キー**(例 `conditions.sensitivityReference: '2.83V/1m' | '1W/1m'`、`conditions.distanceM: number`)を追加し、橋渡し関数 `toPairingSpeaker(dataset, productId)` で `DemoSpeaker` 相当を組み立てる。次の場合は相性診断の入力に使わず**判定保留**とする: 基準未記録、`nominalImpedance` の測定が無い(`sensitivityAt1W` は `nominalOhms` 非有限で `RangeError`)、`nominalImpedance` が `estimated` のみ。検証: 「公称 Z 欠測 → 保留」「基準未記録 → 保留」のテスト。

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

### G4 — 測定条件の構造化(必須)

`MeasurementConditions` に次を追加する。

| キー | 例 | 判定上の扱い(提案、D-03/D-13) |
| --- | --- | --- |
| `instrument?: string` | "Audio Precision APx555"、"Klippel NFS" | 相違は**保留**(P3 未承認: 同等性が確認されるまで保留を維持) |
| `testSignal?: string` | "1 kHz sine, continuous"、"burst" | 相違は**保留**(手順差) |
| `averaging?: string` | "spot"、"mean"、"IEC"、"Listening Window" | 感度では**保留**(手順差、P8 承認) |
| `averagingBandHz?: [number, number]` | [300, 3000]、[1000, 1000](点値) | 感度では**保留**。未記録も保留(P8、PL 追加指示) |
| `supplyVoltage?: string` | "100 V AC" | 注意 |
| `distortionCriterion?: string` | "THD+N 1 %"、"THD+N 0.1 %" | 定格出力では**保留**(G6) |

### G5 — 値を持たない測定参照(PL: 案 B を優先検討)

第三者測定の「所在・条件・リンクのみ」(D-16)と、許諾未確認で公開しない値(P7)を表す。PL 判定により**案 B(別型 `MeasurementReference`)を優先**する: 欠測(`missing`)とは別に表現し、投影・採点には入らない。

| 案 | 内容 | 判定 |
| --- | --- | --- |
| A | 新 status `withheld`(値は `null`、出典・条件必須) | 不採用候補(`value: null` の意味が missing と二重化) |
| B | 別型 `MeasurementReference { id, productId, metric, sourceId, conditions, quantities: string[], note, accessedAt }`。値を持たない。UI は「出典で確認」とリンク表示 | **優先検討** |

内部保存と公開を区別する: **メーカー公称値**(D-15 判断待ち)は `Measurement` + `Source.reuse.quoteFacts: 'unknown'` として内部保持し、公開ビルドでは `MeasurementReference` 相当に落として表示する(数値・図表・本文・生データの区別は `Source.reuse` の 4 項目で表す)。**第三者測定**はパイロットでは `MeasurementReference` のみ(D-16、数値は内部にも保持しない)。検証規則: 出典・条件必須、投影・採点に不採用。

### G9 — 採点適格性(D-17 選択肢 B、設計のみ)

| 要素 | 内容 |
| --- | --- |
| 状態 | `missing`(値なし)/ `ineligible`(値あり・採点対象外)/ `eligible`(採点入力) |
| 不適格の条件 | `REQUIRED_CONDITIONS[metric]` に未記録あり、または図表読取由来の `estimated`(P6)、または `MeasurementReference`。`estimated` 全般の不適格化は Claude 側の統合案で要 PL 確認 |
| 投影 | `MetricProjection` に `eligibility` を追加。`toMetricValues` は eligible のみ値を渡し、ineligible は `null` |
| カバレッジ | 分母を「採点適格な指標の重み」に変更(解釈は PL 確認事項、ADR-0007)。`calculateUtility` の入力を 3 状態(`eligible` / `ineligible` / `missing`)にするシグネチャ変更が必要。`UtilityResult` に `ineligibleMetrics` を追加し JSON `computed` に出力 |
| 選択順位 | 適格性を先に判定し、適格な候補の中で observed > manufacturer > 版 > 日付(P1 条件付き承認) |
| 表示 | 不適格値は「採点対象外(条件未記録)」と明示し、欠測の「未測定」と区別 |
| 方法論 | `METHODOLOGY_VERSION` 0.6.0。デモデータの扱いは D-18 |

### G6 — 定格出力の歪み基準

`distortionCriterion` を `REQUIRED_CONDITIONS.power` と `RELEVANT_CONDITIONS.power` に加える(D-04)。基準が異なる W は別測定として保留される。

### G7 — 製品属性

`Product` に `region?: string`、`dimensionsMm?: {w,h,d}`、`massKg?: number` を追加し、`FeatureKey` はカテゴリ別の列挙(アンプ: 光・同軸・サブウーファー出力等を追加、スピーカー: 端子形式等)か自由タグに拡張する。LS50 Meta の文書間差(7.2/7.8 kg、278/280.5 mm)は `notes` に記録し、照会後に版を分ける(D-14)。

### G8 — スキーマ版

`Source.reuse`(G3)・条件キー(G4)・値なし参照型 `MeasurementReference`(G5)・採点適格性(G9)はいずれも `DATASET_SCHEMA_VERSION` を '1.1' に上げる変更である。ゲートは版不一致をエラーにするため、既存の架空データセットも同時に更新する。

## 検証規則で追加が必要なもの

| 規則 | 区分 | 理由 |
| --- | --- | --- |
| スピーカー製品に `power` / `thdn` / `snr` 測定を登録したらエラー、アンプ製品に `sensitivity` 等を登録したらエラー(カテゴリ×指標の整合) | 追加必須 | 現在は未チェック(P2-1 の独立レビュー報告「Could not verify: category/metric compatibility rule」、PR #4 本文参照) |
| `sensitivity` に `inputSignal` が無ければ警告、相性診断では採用しない | 追加必須 | 2.83V/1W の混同防止(AGENTS §4) |
| 非架空データセットで `Source.url` 必須(既存)に加え、`reuse.quoteFacts !== 'prohibited'` | 追加必須 | 利用許諾 |
| `Product.revision` が `null` の非架空製品は警告 | 追加推奨 | 同定の不確かさを可視化 |

## 変更しないもの

- 採点式・正規化範囲・70 % 閾値・相性診断の式(方法論 0.5.0-demo)。
- 価格観測からの参考価格選択(ADR-0005 O4、未承認)。
- トレースからの判定(ADR-0006、未承認)。
