# Phase 3 — データ投入・検証・差し戻し手順(設計)

## 結論

実在データは **データセットファイル → 品質ゲート → レビュー → 公開ビルド** の一方向パイプラインで扱う。手入力・半自動を問わず、ゲートを通らないデータは画面にも出力にも届かない(ADR-0004 §8 の既存方針を踏襲)。本工程では手順を定義するのみで、実データの投入は行わない。

## 前提

| 項目 | 内容 |
| --- | --- |
| 対象 | SMSL AO300 PRO、KEF LS50 Meta(PRODUCT_IDENTIFICATION.md で同定済みの型番・リビジョンに限る) |
| 入力形式 | `Dataset`(schema 1.0)+ `PriceObservation[]` + `SpeakerElectricalTrace[]` を 1 つの JSON(`data/real/<slug>/dataset.json`)に分離して配置。架空デモ(`DEMO_DATASET`)と**別ファイル・別フラグ**(`fictional: false`) |
| 必須メタデータ | 出典(URL・発行元・公開日・取得日・一次/二次・利用許諾の確認状況)、測定条件、証拠種別、不確かさ(不明は null) |
| 禁止 | 利用許諾が `prohibited` / `unknown` の数値を公開ビルドへ含めること。図表・生データの転載 |

## 手順

| 段階 | 作業 | 成功条件 | 失敗時 |
| --- | --- | --- | --- |
| 1 同定 | 製品の型番・リビジョン・地域仕様を PRODUCT_IDENTIFICATION.md に記録し、`Product.revision` を埋める | リビジョンが確認済み、または「不明」と明記 | 投入しない |
| 2 出典登録 | `Source` を作成。`tier`、`reuse.*`、`checkedAt` を記入(G3 拡張後) | `url` あり、`reuse.quoteFacts` が `prohibited` でない | 出典を登録せずリンクのみ |
| 3 測定登録 | 1 測定 = 1 `Measurement`。公称値は `manufacturer`、第三者は `observed`。条件は出典の記載どおりに転記し、記載がない条件は**空欄のまま**(推測で埋めない) | `REQUIRED_CONDITIONS` の警告を確認し、残る理由を `notes` に記載 | 条件不明なら登録はするが比較保留になることを受け入れる |
| 4 ゲート | `prepareDataset` + `validatePriceObservations` + `validateTraces` を CI で実行 | エラー 0 件。警告は一覧化して PR に添付 | エラーがあれば PR をブロック |
| 5 レビュー | 独立レビュー担当が出典の原文と登録値を突合(値・単位・条件・証拠種別) | 差異なし | 差し戻し(下記) |
| 6 公開ビルド | `fictional: false` のデータセットを読み込むビルド設定(未実装)で生成。ライセンス `unknown` の数値は伏せ、出典リンクのみ表示 | Playwright で表示確認 | ビルド失敗 = 公開しない |

## 差し戻し基準

| 事象 | 判定 | 処置 |
| --- | --- | --- |
| 出典原文と登録値が不一致 | エラー | 修正して再レビュー |
| 条件を推測で補完していた | エラー | 空欄に戻す(警告は許容) |
| 公称値を `observed` として登録 | エラー | `status` を修正 |
| 感度の基準(2.83 V / 1 W)が未記録 | 警告 | 登録は可、相性診断には使わない |
| 不確かさを 0 で登録 | エラー | `null` に修正 |
| 利用許諾 `unknown` | 警告 | 数値は内部データのみ、公開ビルドで伏せる |

## 変更管理

- 値の訂正は `Measurement.version` を上げ、旧版を削除せず `notes` に理由を残す。
- メーカーが仕様を改訂した場合は新しい `Measurement`(`capturedAt` を更新)を追加し、`selectMeasurement` の版・日付順で採用される。
- 方法論・採点・判定ロジックは本パイプラインで変更しない。

## 未実装(後続タスク)

- `fictional: false` データセットを読み込むビルド/ローダー(現在は `DEMO_DATASET` 固定)。
- `Source.reuse` の型と検証規則(G3)。
- カテゴリ×指標の整合検証、スピーカー指標の `MetricId` 追加(G1)。
- CI ジョブ `data-gate`(データ JSON の検証のみを行う軽量ジョブ)。
