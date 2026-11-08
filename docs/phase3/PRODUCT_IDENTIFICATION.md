# Phase 3 — 製品同定とリビジョン確認

取得日はすべて 2026-11-08。分類: **確認済み** = 当日取得した一次/二次資料に記載を確認、**推定** = 取得内容からの推論(理由を併記)、**未確認** = 取得できず。

## 結論

| 製品 | 同定結果 | リビジョン | 登録可否(提案) |
| --- | --- | --- | --- |
| SMSL AO300 PRO | 公式サイトに「AO300 PRO」の製品ページと公式マニュアル(Ver 1.0)が存在する。無印「AO300」(2024 年発売)とは別製品で、PRO は 2025-11 発表。公式仕様値は無印と同一(HDMI が ARC → eARC、重量が 1.52 → 1.49 kg の差のみ) | ハードウェア改版の表記なし。ファームウェア V1.21(2026-05-07 付ファイル)。マニュアル Ver 1.0 | 登録可。`Product.revision` には「HW 表記なし / FW V1.21 / Manual Ver 1.0」を記録し、無印 AO300 とは別 `Product` とする |
| KEF LS50 Meta | (KEF 調査ワーカーの結果を反映 — 下記 §2) | — | — |

## 1. SMSL AO300 PRO

### 1.1 同定

| 項目 | 内容 | 分類 | 根拠(URL / 引用) |
| --- | --- | --- | --- |
| 製造元 | S.M.S.L(Foshan Shuangmusanlin Technology Co., Ltd.) | 確認済み | 公式ページ脚注 "© 2009 Foshan Shuangmusanlin technology Co., Ltd." https://www.smsl-audio.com/portal/product/detail/id/931.html |
| 公式製品名 | 「AO300 PRO」(副題 DAC&Power Amplifier) | 確認済み | 同上。マニュアル表紙 "AO300 PRO" "USER MANUAL" "Ver 1.0" https://www.smsl-audio.com/upload/portal/download/AO300PROManual.pdf |
| 無印 AO300 との関係 | 無印は公式の現行一覧・Legacy 一覧に無く、欧州小売で "discontinued"。PRO が後継 | 推定(公式の後継宣言は未取得) | Audiophonics 無印ページ "This product is discontinued"; 公式一覧 https://www.smsl-audio.com/portal/product/lists/id/4.html |
| 公式仕様上の差分 | 無印マニュアル(Ver 1.0)と PRO マニュアル(Ver 1.0)の仕様ページを照合: 入力が HDMI(ARC) → HDMI(eARC)、重量 1.52 kg/3.35 lbs → 1.49 kg/3.3 lbs。出力・THD+N・SNR・セパレーション・入力感度・寸法は同一 | 確認済み(リードが両 PDF の仕様ページ画像を目視照合) | 上記 2 PDF の仕様ページ(PRO: p.13 英 / p.22 日、無印: p.20 日) |
| 発表時期 | PRO: 2025-11-06 報道(mimiオーディオ)。無印: 2024-02-27(HiFiGo ブログ、"$289") | 確認済み(二次資料) | https://www.mimiaudio.jp/smsl-ao300-pro/ 、 https://hifigo.com/blogs/news/smsl-ao300 |
| 地域仕様 | 色は Black / Silver。電源・地域別仕様の記載なし | 確認済み(記載なし) | 公式ページ |
| 搭載チップ | Infineon 製アンプ IC(公式は型番非記載。小売は MA5332MS と記載)、CS43131、XMOS XU-316、NJW1194 | 公式記載分は確認済み、IC 型番は小売のみ | 公式ページ本文; Audiophonics 商品名 |

### 1.2 リビジョン

| 項目 | 内容 | 分類 |
| --- | --- | --- |
| ハードウェア改版表記 | なし | 確認済み(記載なし) |
| ファームウェア | "Firmware V1.21"、配布ファイル AO300PROFW20260507.zip | 確認済み |
| マニュアル版 | Ver 1.0、"subject to change without notice" | 確認済み |
| 判断 | 改版識別子が公開されていないため、`Product.revision` には上記の FW/マニュアル版と取得日を記録する。将来の仕様改訂は新 `Measurement`(版・取得日更新)で表す | 提案 |

### 1.3 公式仕様値(一次資料: 公式マニュアル Ver 1.0、仕様ページ)

| 項目 | 公式記載 | 条件の記載 | モデル上の扱い |
| --- | --- | --- | --- |
| 出力電力 | 165W×2 (4Ω) / 85W×2 (8Ω) | **歪み基準・帯域・駆動 ch 数の記載なし** | `manufacturer`。`REQUIRED_CONDITIONS.power` のうち `loadOhms` のみ記録可 → 条件未記録の警告、比較は保留 |
| THD+N | 0.003% | **条件(周波数・出力・帯域・負荷)の記載なし** | `manufacturer`、条件未記録 → 比較保留 |
| S/N | 107dB | **重み付け・基準出力の記載なし** | `manufacturer`、条件未記録 → 比較保留 |
| チャンネルセパレーション | 98dB | 記載なし | 現行 `MetricId` に無い(表示のみなら `notes`) |
| 入力感度 / 入力インピーダンス | 280mV / 22kΩ | — | 同上 |
| 消費電力 | 40W(通常音量) | — | 同上 |
| 寸法・重量 | 219×42×185 mm (W×H×D)、1.49 kg / 3.3 lbs | — | `Product` 属性候補 |
| 入力 | HDMI(eARC) / RCA / BT / USB / 光 / 同軸 | — | `features`(hdmi, usb, bt, hp) |

仕様ページには「SMSLは予告なしに仕様や機能を変更する改良を行う権利を有します」とある。**出力の歪み基準と S/N の重み付けが公式に明記されていない**ため、現行の比較規則(条件完全一致)では AO300 PRO の公称値は他製品と比較不能として扱われる。これは規則の意図どおりであり、推測で条件を補ってはならない。

### 1.4 未確認・リスク

| 事項 | 状態 | 次のアクション |
| --- | --- | --- |
| 無印 AO300 公式ページの削除時期・後継宣言 | 未確認 | Wayback Machine で旧 URL を確認 |
| PRO と無印の内部差分(基板・電源) | 未確認 | 公式比較資料がなければ「小売説明に基づく推定」のまま |
| 日本国内の正規代理店・円建て希望小売価格 | 未確認 | 代理店特定後に `PriceObservation(kind:'list')` として登録可能 |
| 第三者測定 | 一件も確認できず(ASR は 403 で検索不可) | ブラウザで人手確認 |

## 2. KEF LS50 Meta

(KEF 調査ワーカーの確認結果を反映して記載 — 後述)
