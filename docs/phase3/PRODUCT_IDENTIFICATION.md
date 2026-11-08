# Phase 3 — 製品同定とリビジョン確認

取得日はすべて 2026-11-08。分類: **確認済み** = 当日取得した一次/二次資料に記載を確認、**推定** = 取得内容からの推論(理由を併記)、**未確認** = 取得できず。

## 結論

| 製品 | 同定結果 | リビジョン | 登録可否(提案) |
| --- | --- | --- | --- |
| SMSL AO300 PRO | 公式サイトに「AO300 PRO」の製品ページと公式マニュアル(Ver 1.0)が存在する。無印「AO300」(2024 年発売)とは別製品で、PRO は 2025-11 発表。公式仕様値は無印と同一(HDMI が ARC → eARC、重量が 1.52 → 1.49 kg の差のみ) | ハードウェア改版の表記なし。ファームウェア V1.21(2026-05-07 付ファイル)。マニュアル Ver 1.0 | 登録可。`Product.revision` には「HW 表記なし / FW V1.21 / Manual Ver 1.0」を記録し、無印 AO300 とは別 `Product` とする |
| KEF LS50 Meta | KEF 公式の Info sheet(2025-08 版)と R&D 白書(2020-09)で仕様を確認。2020-09-22 発表、日本発売 2020-10-02。LS50(2012)・LS50 Wireless II(内蔵アンプ付きアクティブ機)とは別製品 | **リビジョン識別子なし**。公式文書間で質量 7.2 kg(2020 白書) / 7.8 kg(2025 Info sheet)、奥行 278 / 280.5 mm の差があり、理由未確認。2025-08 に新仕上げ追加(ハードウェア変更の記載なし) | 登録可だが `revision` は「不明(文書間差異あり)」と明記し、質量・寸法差の照会を次アクションとする |

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

### 2.1 同定

| 項目 | 内容 | 分類 | 根拠(URL / 引用) |
| --- | --- | --- | --- |
| 製造元・製品名 | KEF「LS50 Meta」(パッシブ 2 ウェイ、12 世代 Uni-Q + MAT) | 確認済み | KEF Info sheet "08.2025 \| LS50 Meta" https://www.stassen.nl/images/LS50%20Meta_Info_sheet_EN_20250624.pdf ; KEF R&D 白書 https://www.richersounds.com/content/product_files/LS50META.pdf(PDF 内部名 KEF_LS50_LS50WII_WP_18.09.2020) |
| 発表・発売 | 2020-09-22 発表(KEF Japan プレスリリース)、日本発売 2020-10-02、発売時 4 仕上げ | 確認済み | https://kyodonewsprwire.jp/release/202009214611 |
| 公式 Shopify 商品データ | international: published_at 2020-09-22、6 仕上げ各 1199.00 EUR。jp: 4 仕上げ各 187000 JPY(updated_at 2026-11-08) | 確認済み(税込/税抜・ペア単位の明記なし) | https://international.kef.com/products/ls50-meta.json ; https://jp.kef.com/products/ls50-meta.json |
| 混同しやすい製品 | LS50(2012)、LS50 Wireless II(内蔵アンプ "合計380W")は別製品 | 確認済み | 同プレスリリース |
| 新仕上げ | Moss Green / Sand Shell 追加(2025-08-12)。ハードウェア変更の記載なし | 確認済み | https://eu.kef.com/blogs/news/ls50-new-finishes-moss-green-sand |
| 公式製品ページ本体 | international / jp / uk / us / ca / ap すべて HTTP 429 で本文未取得 | 未確認 | https://international.kef.com/products/ls50-meta |

### 2.2 リビジョン

| 項目 | 内容 | 分類 |
| --- | --- | --- |
| リビジョン識別子 | 公式文書・第三者測定のいずれにも記載なし。ドライバー世代 "12th Generation Uni-Q with MAT" の表記のみ | 確認済み(不存在) |
| 公式文書間の差異 | 2020 白書: 7.2 kg、奥行 278 mm。2025 Info sheet: 7.8 kg、奥行 280.5 mm | 確認済み(差異の理由は**未確認**) |
| 判断 | 差異が仕様改訂・計測方法・記載誤りのいずれかは不明。`Product.revision = null`(警告)で登録し、第三者測定の試料がどの時期の個体かは「不明」と記録する。KEF への照会を次アクションとする | 提案(D-11, D-14) |

### 2.3 公式仕様値(一次資料: KEF Info sheet 08.2025 / R&D 白書 2020)

| 項目 | 公式記載 | 条件の記載 | モデル上の扱い |
| --- | --- | --- | --- |
| 感度 | "Sensitivity (2.83V/1m) 85 dB" | **2.83 V/1 m** と明記。環境・帯域平均法は未記載 | `sensitivity`(新 MetricId、D-10)、`inputSignal: '2.83 V'`、`method` に距離 1 m |
| 公称 / 最小インピーダンス | "Nominal impedance 8Ω (min. 3.5Ω)" | 最小となる周波数は未記載 | `nominalImpedance` / `minimumImpedance`(周波数未記録 → 警告) |
| 周波数特性 | "(±3dB) 79 Hz - 28 kHz"、"Frequency range (-6dB) 47 Hz - 45 kHz" | 許容差あり、環境未記載 | 範囲値(D-07) |
| 推奨アンプ出力 | "40-100 W" | — | 参考情報、相性診断に使わない |
| クロスオーバー | "2.1 kHz" | — | `crossoverFrequency` |
| 最大出力 | "106 dB" | 条件未記載 | 参考情報 |
| 歪み | "Harmonic distortion (90dB, 1m) <0.4% 175 Hz - 20 kHz <0.1% 300 Hz - 10 kHz" | 条件あり(90 dB, 1 m) | 現行 MetricId 外。表示のみ |
| 寸法・質量 | 302 × 200 × 280.5 mm、7.8 kg(2025) / 278 mm、7.2 kg(2020) | — | 差異を記録 |

### 2.4 第三者測定の所在(数値は転記せず、所在と条件のみ)

| 発行元 | 測定系・条件 | 感度の基準 | 試料リビジョン | 取得状況 |
| --- | --- | --- | --- | --- |
| SoundStage! / NRC(2020-11-15) | NRC 無響室、2 m 測定を 1 m 換算、Listening Window 300 Hz–3 kHz 平均 | 2.83 V/1 m と明記 | 記載なし | 確認済み(転載禁止条項あり) |
| Erin's Audio Corner(2023-12-22) | Klippel NFS、CTA-2034、歪み 86/96 dB@1 m、エージング済み | 駆動電圧はページに明記なし(spinorama.org の再掲では 2.83 V) | 記載なし | 確認済み |
| Hi-Fi News Lab Report(KEF assets 配布の転載 PDF) | 1 kHz / Mean / IEC の 3 系統で感度、最小インピーダンスと位相極値、THD | 2.83 V/1 m と明記 | 記載なし | 確認済み(号・筆者は推定) |
| Stereophile(John Atkinson) | — | スニペットのみ | — | **未確認**(403) |
| Audio Science Review(スレッド 25574) | Klippel NFS(spinorama.org の記載) | — | — | **未確認**(403) |

各測定の感度は平均帯域・方法が異なり(メーカー 85 dB、NRC 83.2 dB、HFN 84.6/84.6/82.4 dB、Erin 83 dB)、**同じ「2.83 V/1 m」でも平均方法が違えば直接比較できない**。これは MEASUREMENT_REQUIREMENTS §3 の課題 3・6 の実例であり、方法を条件キーに含める(G4)必要性を示す。

### 2.5 未確認・リスク

| 事項 | 状態 | 次のアクション |
| --- | --- | --- |
| 7.2 kg / 7.8 kg、278 / 280.5 mm の差異 | 未確認 | KEF へ照会(仕様改訂か記載差か) |
| 公式製品ページ本文、uk/us 公式価格 | 未確認(429) | ブラウザで人手確認 |
| Stereophile / ASR の本文・条件・規約 | 未確認(403) | ブラウザで人手確認。スニペットの数値は採用しない |
| HFN レポートの号・筆者 | 推定 | 誌面で確認 |
