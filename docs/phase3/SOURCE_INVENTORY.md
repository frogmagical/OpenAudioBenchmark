# Phase 3 — 出典一覧と利用条件

取得日はすべて 2026-11-08。分類: **確認済み** = 取得し引用あり、**推定** = 推論、**未確認** = 取得不可またはスニペットのみ。本書は**メタデータとリンクのみ**を管理し、図表・生データは保存・転載しない。

## 結論

| 製品 | 一次資料 | 独立測定 | 利用許諾 |
| --- | --- | --- | --- |
| SMSL AO300 PRO | 公式製品ページ・公式マニュアル(Ver 1.0)で仕様値を確認 | **確認できず**(ASR は 403 で検索不能、集約サイトは「独立測定なし」と明記) | 再利用を明示的に許諾した出典は**なし**。公式は All Rights Reserved、小売 2 社は複製禁止 |
| KEF LS50 Meta | (KEF 調査ワーカーの結果 — §2) | — | — |

公開データセットでは、数値の**事実引用 + 出典リンク**に留め、図表・表の転載や生データの保存は行わない(ADR-0007 P7、DATA_GAP G3)。許諾 `unknown` の出典に基づく数値は公開ビルドで伏せる。

## 1. SMSL AO300 PRO

### 1.1 出典一覧

| ID(提案) | 発行元 | 種別 | 一次/二次 | 内容 | URL | 公開日 | 取得日 | 分類 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRC-SMSL-PAGE | S.M.S.L | manufacturer | 一次 | 製品ページ(特徴・チップ・FW V1.21、数値仕様なし) | https://www.smsl-audio.com/portal/product/detail/id/931.html | 不明 | 2026-11-08 | 確認済み |
| SRC-SMSL-MANUAL-PRO | S.M.S.L | manufacturer | 一次 | 公式マニュアル Ver 1.0、仕様ページ(出力・THD+N・SNR・寸法・重量) | https://www.smsl-audio.com/upload/portal/download/AO300PROManual.pdf | 不明(FW 配布 2026-05) | 2026-11-08 | 確認済み(仕様ページを画像で照合) |
| SRC-SMSL-MANUAL-AO300 | S.M.S.L | manufacturer | 一次 | 無印 AO300 マニュアル Ver 1.0(差分照合用) | https://www.smsl-audio.com/upload/portal/download/AO300Manual.pdf | 不明 | 2026-11-08 | 確認済み |
| SRC-MIMI-2025 | mimiオーディオ | editorial | 二次 | PRO 発表報道(2025-11-06) | https://www.mimiaudio.jp/smsl-ao300-pro/ | 2025-11-06 | 2026-11-08 | 確認済み |
| SRC-HIFIGO-BLOG | HiFiGo | retailer | 二次 | 無印 AO300 発売告知("$289"、2024-02-27) | https://hifigo.com/blogs/news/smsl-ao300 | 2024-02-27 | 2026-11-08 | 確認済み |
| SRC-AUDIOPHONICS-PRO | Audiophonics | retailer | 二次 | 仕様転載・価格(279,00 € 税込) | https://www.audiophonics.fr/en/integrated-amplifiers/smsl-ao300-pro-black-p-21318.html | — | 2026-11-08 | 確認済み |
| SRC-AOSHIDA | Aoshida Audio(公式購入リンク先) | retailer | 二次 | 価格 US$279.00(取得時 $245.52、税記載なし) | https://aoshida-audio.com/products/smsl-ao300-pro | — | 2026-11-08 | 確認済み |
| SRC-SOUNDIMPORTS | Soundimports | retailer | 二次 | 仕様転載・価格 €299,95(税区分不明) | https://www.soundimports.eu/en/smsl-ao300pro.html | — | 2026-11-08 | 確認済み |
| SRC-SOUNDPHILE | Soundphile Review | editorial | 二次 | 無印 AO300 の試聴レビュー(測定なし、THD+N "@1 kHz" 表記) | https://www.soundphilereview.com/reviews/smsl-ao300-review-44755/ | 2023-12-15 | 2026-11-08 | 確認済み |
| SRC-FRIEVE | Frieve Audio Review(集約) | other | 二次 | 「独立測定なし」と明記 | https://audioreview.frieve.com/products/en/smsl-ao300/ | 2026-03-14 | 2026-11-08 | 確認済み |
| — | Audio Science Review | independent-lab | — | AO300 / PRO のスレッド有無 | https://www.audiosciencereview.com/forum/ | — | 2026-11-08 | **未確認**(403) |
| — | Headfonia / Audiophile Heaven | editorial | — | 無印レビュー(測定有無不明) | (403) | — | 2026-11-08 | 未確認 |
| — | Linsoul / HiFiGo 製品ページ | retailer | — | 仕様・価格 | (429) | — | 2026-11-08 | 未確認 |

### 1.2 出典ごとの分類と利用条件

| 出典 | 証拠種別 | 対象型番・版 | 測定条件の記載 | 数値引用 | 図表転載 | 生データ保存 | 再配布 | 根拠(引用) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRC-SMSL-MANUAL-PRO | manufacturer | AO300 PRO、Manual Ver 1.0 | **なし**(出力の歪み基準・SNR 重み付け・帯域が未記載) | 事実引用は可能と判断(仕様値は事実)— 要 PL 確認 | 不可(All Rights Reserved) | 不可 | 不可 | 公式サイト "All Rights Reserved"; マニュアル "subject to change without notice" |
| SRC-SMSL-PAGE | manufacturer | AO300 PRO | — | 同上 | 不可 | 不可 | 不可 | 同上 |
| SRC-AUDIOPHONICS-PRO | manufacturer(転載) | AO300 PRO | なし | **使用しない**(複製禁止条項) | 不可 | 不可 | 不可 | 第12条 "Any total or partial reproduction of this content is strictly prohibited" |
| SRC-AOSHIDA | retailer(価格) | AO300 PRO | — | 価格の事実のみ、要確認 | 不可 | 不可 | 不可 | "You may not use, reproduce, copy, modify, transmit, display, publish, sell" |
| SRC-SOUNDPHILE / SRC-FRIEVE / SRC-MIMI-2025 | editorial / other | 無印 / PRO | なし | リンクと要旨のみ | 不可 | 不可 | 不可 | 権利表記のみ、許諾文なし |
| Audio Science Review | independent-lab | — | — | 未確認 | 未確認 | 未確認 | 未確認 | 規約ページ 403 |

**利用許諾の結論(SMSL)**: 明示的に再利用を許諾した出典はない。メーカー公称値を「出典付きの事実」として引用する範囲に限定し、図表・本文の転載は行わない。小売サイトの転載値は使わず、一次資料(公式マニュアル)のみを `Measurement` の出典とする。公開ビルドでは `Source.reuse.quoteFacts = 'unknown'` として扱い、リンクと「出典で確認」の表示に留める(PL 判断 D-09)。

### 1.3 代替案(許諾が不明な場合)

| 案 | 内容 | 利点 | 欠点 |
| --- | --- | --- | --- |
| A | 公式一次資料の仕様値のみ事実引用、他はリンク | 許諾リスク最小 | 第三者測定が使えず比較は保留のまま |
| B | 発行元へ引用許諾を照会 | 第三者測定を扱える可能性 | 回答待ち、個別管理が必要 |
| C | 自前測定(将来) | 許諾不要、条件を完全に記録できる | 機材・方法論の整備が必要。本工程の対象外 |

## 2. KEF LS50 Meta

(KEF 調査ワーカーの確認結果を反映して記載 — 後述)
