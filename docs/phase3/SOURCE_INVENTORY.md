# Phase 3 — 出典一覧と利用条件

取得日はすべて 2026-11-08。分類: **確認済み** = 取得し引用あり、**推定** = 推論、**未確認** = 取得不可またはスニペットのみ。本書は**メタデータとリンクのみ**を管理し、図表・生データは保存・転載しない。

## 結論

> **仕様事実の記述に関する留保(PL 判断 2026-11-08)**: 本書に記載したメーカー公称値は、製品同定と設計検討に必要な最小限の事実を引用元を明示して記したものであり、再配布データセットへの数値取り込みとは別論点である。この構成は技術 PL の受入を得ているが、法的許諾・規約適合性の判断ではない。数値の包括的転記、表・図の再現は行わない。D-15 の PM/法務判断および公開審査は維持し、利用条件の確認結果によって本資料の記述を調整する可能性がある。

| 製品 | 一次資料 | 独立測定 | 利用許諾 |
| --- | --- | --- | --- |
| SMSL AO300 PRO | 公式製品ページ・公式マニュアル(Ver 1.0)で仕様値を確認 | **確認できず**(ASR は 403 で検索不能、集約サイトは「独立測定なし」と明記) | 再利用を明示的に許諾した出典は**なし**。公式は All Rights Reserved、小売 2 社は複製禁止 |
| KEF LS50 Meta | KEF Info sheet(2025-08)・R&D 白書(2020-09)・KEF Japan プレスリリース・公式 Shopify JSON で仕様と価格を確認 | NRC/SoundStage!、Erin's Audio Corner、Hi-Fi News(転載 PDF)を確認。Stereophile・ASR は 403 で未確認 | KEF 規約は書面同意なしの複製・再利用を禁止。NRC "Reproduction in any format is not permitted."、Erin's は "No general license is granted"。spinorama.org は CC BY-NC-SA 4.0 だが測定元の条件が優先 |

公開データセットでは、数値の**事実引用 + 出典リンク**に留め、図表・表の転載や生データの保存は行わない(ADR-0007 P7、DATA_GAP G3)。許諾 `unknown` の出典に基づく数値は公開ビルドで伏せる。**帰結**: 両製品とも再利用許諾が明示された出典は存在しないため、D-15(メーカー公称値の事実引用の可否)が未決のままでは、パイロット 2 製品の公開ビルドに表示できる数値はゼロで、出典リンクのみになる。

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
| SRC-SMSL-MANUAL-PRO | manufacturer | AO300 PRO、Manual Ver 1.0 | **なし**(出力の歪み基準・SNR 重み付け・帯域が未記載) | 事実引用の可否は **PM/法務判断待ち(D-15)**。許諾不明を法的禁止とは断定しない | 不可(All Rights Reserved) | 不可 | 不可 | 公式サイト "All Rights Reserved"; マニュアル "subject to change without notice" |
| SRC-SMSL-PAGE | manufacturer | AO300 PRO | — | 同上 | 不可 | 不可 | 不可 | 同上 |
| SRC-AUDIOPHONICS-PRO | retailer(公称値の転載) | AO300 PRO | なし | **使用しない**(複製禁止条項。付録の引用は調査ログであり、データ出典にはしない) | 不可 | 不可 | 不可 | 第12条 "Any total or partial reproduction of this content is strictly prohibited" |
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

### 2.1 出典一覧

| ID(提案) | 発行元 | 種別 | 一次/二次 | 内容 | URL | 公開日 | 取得日 | 分類 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRC-KEF-INFOSHEET-2025 | KEF(販売店ホスティング PDF) | manufacturer | 一次 | Info sheet: 感度・インピーダンス・周波数特性・歪み・寸法・質量 | https://www.stassen.nl/images/LS50%20Meta_Info_sheet_EN_20250624.pdf | 文書表記 08.2025、ファイル名日付 2025-06-24(差異理由未確認) | 2026-11-08 | 確認済み |
| SRC-KEF-WP-2020 | KEF(販売店ホスティング PDF) | manufacturer | 一次 | R&D 白書(2020-09-18 版)。質量 7.2 kg、奥行 278 mm | https://www.richersounds.com/content/product_files/LS50META.pdf | 2020-09 | 2026-11-08 | 確認済み |
| SRC-KEF-PR-JP-2020 | KEF Japan(共同通信 PR Wire) | manufacturer | 一次 | 発表 2020-09-22、国内発売 2020-10-02、"価格(税抜き)" 145,000 円(ペア / 1 本の明記は引用範囲に無く**未確認**) | https://kyodonewsprwire.jp/release/202009214611 | 2020-09-22 | 2026-11-08 | 確認済み(価格単位は未確認) |
| SRC-KEF-SHOP-INTL / -JP | KEF(Shopify 商品 JSON) | manufacturer | 一次 | 1199.00 EUR(6 仕上げ)/ 187000 JPY(4 仕上げ、2026-11-08 更新)。税・ペア単位の明記なし | https://international.kef.com/products/ls50-meta.json ; https://jp.kef.com/products/ls50-meta.json | — | 2026-11-08 | 確認済み |
| SRC-KEF-BLOG-2025 | KEF EU | manufacturer | 一次 | 新仕上げ 2025-08-12 | https://eu.kef.com/blogs/news/ls50-new-finishes-moss-green-sand | 2025-08-12 | 2026-11-08 | 確認済み |
| SRC-NRC-2020 | SoundStage! / NRC | independent-lab | 一次 | 無響室測定、感度 2.83 V/1 m、Listening Window 平均 | https://www.soundstagenetwork.com/index.php?option=com_content&view=article&id=2421 | 2020-11-15 | 2026-11-08 | 確認済み |
| SRC-EAC-2023 | Erin's Audio Corner(Erin Hardison) | independent-lab | 一次 | Klippel NFS、CTA-2034、インピーダンス、歪み、圧縮 | https://www.erinsaudiocorner.com/loudspeakers/kef_ls50_meta/ | 2023-12-22 | 2026-11-08 | 確認済み |
| SRC-HFN-2021 | Hi-Fi News(KEF assets 上の転載 PDF) | editorial(Lab Report は測定) | 一次(測定)・配布は二次 | 感度 3 系統、最小インピーダンスと位相極値、THD | https://assets.kef.com/pdf_doc/LS50Meta/HFN_June_KEF_LS50_Meta.pdf | 2021-06(推定) | 2026-11-08 | 確認済み(号・筆者は推定) |
| SRC-SPINORAMA | spinorama.org(集約) | other | 二次 | ASR / EAC データの再掲(CC BY-NC-SA 4.0、測定元の条件が優先) | https://www.spinorama.org/speakers/KEF%20LS50%20Meta/ASR/index_asr.html | — | 2026-11-08 | 確認済み |
| — | Stereophile(John Atkinson) | independent-lab | 一次 | 測定ページ・仕様ページ・規約 | https://www.stereophile.com/content/kef-ls50-meta-loudspeaker-measurements | 2021-01(推定) | 2026-11-08 | **未確認**(403) |
| — | Audio Science Review(amirm) | independent-lab | 一次 | スレッド 25574 | https://www.audiosciencereview.com/forum/index.php?threads/kef-ls50-meta-review-speaker.25574/ | 2021(推定) | 2026-11-08 | **未確認**(403) |
| — | KEF 公式製品ページ | manufacturer | 一次 | 本文・uk/us 価格 | https://international.kef.com/products/ls50-meta | — | 2026-11-08 | 未確認(429) |

### 2.2 出典ごとの分類と利用条件

| 出典 | 証拠種別 | 対象・版 | 測定条件の記載 | 数値引用 | 図表転載 | 生データ保存 | 再配布 | 根拠(引用) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KEF 公式文書(Info sheet / 白書 / PR / JSON) | manufacturer | LS50 Meta(リビジョン表記なし) | 感度は 2.83 V/1 m、歪みは 90 dB/1 m。環境・平均法は未記載 | 事実引用の可否は **PM/法務判断待ち(D-15)** | 不可 | 不可 | 不可 | KEF 規約: 書面同意なしの複製・再利用を禁止 https://international.kef.com/pages/terms-and-conditions |
| SRC-NRC-2020 | observed | 試料リビジョン記載なし | 無響室、2 m→1 m 換算、2.83 V、300 Hz–3 kHz 平均 | **使用しない**(転載禁止) | 不可 | 不可 | 不可 | "Reproduction in any format is not permitted." |
| SRC-EAC-2023 | observed | 試料リビジョン記載なし | Klippel NFS、エージング済み、駆動電圧はページ未記載 | 個別許諾が必要 | 不可 | 不可 | 不可 | データ利用ポリシー "No general license is granted..." https://www.erinsaudiocorner.com/measurement-data-policy/ |
| SRC-HFN-2021 | observed(出版社の Lab Report。`Source.kind` は editorial となり、DATA_MODEL の independent-lab 区分と一致しない点に注意) | 記載なし | 1 kHz / Mean / IEC、2.83 V/1 m | 不可(出版社著作物、転載 PDF) | 不可 | 不可 | 不可 | 許諾文なし(KEF assets 上の配布は KEF と HFN 間の取り決めで、第三者に及ばない) |
| SRC-SPINORAMA | 再掲 | — | — | 条件付き(非商用・継承)だが測定元条件が優先 | 同左 | 同左 | 同左 | CC BY-NC-SA 4.0 + "測定元の条件が優先" |
| Stereophile / ASR | observed | — | — | 未確認 | 未確認 | 未確認 | 未確認 | 規約 403 |

**利用許諾の結論(KEF)**: 第三者測定はいずれも許諾が明示されていないか転載禁止であり、**数値の転記は行わず、所在・条件・リンクのみ**を管理する。メーカー公称値は一次資料の事実引用に限定する。第三者測定を数値として扱うには個別の許諾照会(案 B)か自前測定(案 C)が必要。

### 2.3 代替案

§1.3 と同じ(A: 公式値の事実引用+リンク、B: 許諾照会、C: 自前測定)。KEF については B の照会先候補が Erin's Audio Corner(データ利用ポリシーに連絡手段あり)と SoundStage!/NRC。

## 3. 付録

調査ワーカーの生の台帳(全 URL・引用・取得失敗ログ)は `appendix/` に収録。
- `appendix/SMSL_AO300_PRO_source_inventory_raw.md`
- `appendix/KEF_LS50_Meta_source_inventory_raw.md`
