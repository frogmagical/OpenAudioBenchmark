# SMSL AO300 PRO 情報源インベントリ(検証済み)

取得日: 2026-11-08。分類は「確認済み」=当日取得し引用あり、「推定」=取得内容からの推論(理由を併記)、「未確認」=取得できず、または検索スニペットのみ。

## 要旨

- 製造元 S.M.S.L(Foshan Shuangmusanlin technology Co., Ltd.)の公式サイトに「AO300 PRO」という製品ページが存在する。製品名は公式表記で「AO300 PRO」(大文字 PRO)。
- 無印「AO300」は過去に存在した(公式サイトに AO300 用マニュアル PDF が残る)が、現行の公式製品一覧(AMP カテゴリ・Legacy Models)には掲載されていない。欧州小売では「discontinued」表示。
- 公式製品ページには数値仕様(出力・THD+N・SNR・寸法)が掲載されておらず、公式マニュアル PDF はフォント埋め込みのためテキスト抽出不可。数値仕様の一次情報は 未確認。小売サイト記載値のみ確認済み。
- 第三者測定(ASR 等)は見つからなかった。ASR サイトは HTTP 403 で閲覧不可のため「存在しない」とは断定できず 未確認。
- 再利用許諾を明示した情報源はない。公式サイトは「All Rights Reserved」、Audiophonics と Aoshida は複製禁止を明記。

## 1. 製品同定

| 項目 | 内容 | 分類 | URL | 取得日 | 引用 |
| --- | --- | --- | --- | --- | --- |
| 公式製品名 | 公式サイトの製品ページ表記は「AO300 PRO」、副題「DAC&Power Amplifier」 | 確認済み | https://www.smsl-audio.com/portal/product/detail/id/931.html | 2026-11-08 | "AO300 PRO" / "DAC&Power Amplifier" |
| 製造元名 | フッターの権利表記 | 確認済み | 同上 | 2026-11-08 | "© 2009 Foshan Shuangmusanlin technology Co., Ltd. All Rights Reserved." |
| カラー | Black / Silver の2色 | 確認済み | 同上 | 2026-11-08 | "Black" / "Silver" |
| ハードウェア改版 | 公式ページにハードウェア revision 表記なし。ファームウェアのみ版数あり | 確認済み | 同上 | 2026-11-08 | "Firmware V1.21"(ファイル名 "AO300PROFW20260507.zip") |
| 公式マニュアル(PRO) | PDF 表紙に製品名と版数。本文はグリフ ID 埋め込みで抽出不可 | 確認済み | https://www.smsl-audio.com/upload/portal/download/AO300PROManual.pdf | 2026-11-08 | "AO300 PRO" / "Ver 1.0" / "subject to change without notice" |
| 公式マニュアル(無印 AO300) | 公式サイトに無印 AO300 のマニュアル PDF が存在(XMP タイトル "AO300"、文字列 "Ver 1.0")。本文抽出不可 | 確認済み | https://www.smsl-audio.com/upload/portal/download/AO300Manual.pdf | 2026-11-08 | XMP: "AO300" / 本文: "Ver 1.0" |
| 無印 AO300 の現行掲載 | 公式 AMP カテゴリ(16製品)に AO300 PRO はあるが無印 AO300・AO200・AO100 はない。Legacy Models(全25製品、AMP 絞込9製品)にもない | 確認済み | https://www.smsl-audio.com/portal/product/lists/id/4.html / https://www.smsl-audio.com/portal/product/history/cat_id/8.html / https://www.smsl-audio.com/portal/product/history/id/26/cat_id/8.html | 2026-11-08 | 一覧中 "AO300 PRO: /portal/product/detail/id/931.html"、AO300 単体の項目なし |
| 無印 AO300 の位置づけ | 公式ページが見つからず小売で生産終了表示のため、AO300 PRO は無印 AO300 の後継と推定 | 推定 | https://www.audiophonics.fr/en/integrated-amplifiers/smsl-ao300-class-d-amplifier-ma5332ms-headphone-amplifier-dac-cs43131-2x165w-4-32bit-768khz-dsd256-mqa-black-p-18242.html | 2026-11-08 | "This product is discontinued" / "Last items in stock !" |
| PRO と無印の差分(小売説明) | Audiophonics は「改良版」と説明し eARC を PRO の特徴として挙げる。ただし無印ページにも HDMI ARC 入力あり。差分の公式一覧は未取得 | 確認済み(小売の記述として) | https://www.audiophonics.fr/en/integrated-amplifiers/smsl-ao300-pro-black-p-21318.html | 2026-11-08 | "SMSL unveils an improved version" / "For the AO300 Pro model, SMSL has included an HDMI eARC input." |
| Bluetooth 版数 | 公式購入リンク先 Aoshida の商品名に Bluetooth 5.3 と記載。公式ページは版数なし("The latest Bluetooth") | 確認済み(小売) | https://aoshida-audio.com/products/smsl-ao300-pro | 2026-11-08 | "SMSL AO300 PRO Decoder & Power Amplifier & Headphone AMP 165W*2 Bluetooth 5.3 HDMI(eARC)" |
| 搭載チップ(公式) | アンプ IC は Infineon 製(型番の記載なし)、DAC は CS43131、USB は XMOS XU-316、電子ボリューム NJW1194、MQA 対応 | 確認済み | https://www.smsl-audio.com/portal/product/detail/id/931.html | 2026-11-08 | "Germany Infineon's new digital high-power amplifier chip" / "DAC chip CS43131" / "XMOS XU-316" / "NJW1194" |
| アンプ IC 型番 | MA5332MS は小売商品名のみに登場。公式ページに型番なし | 確認済み(小売) | https://www.audiophonics.fr/en/integrated-amplifiers/smsl-ao300-pro-black-p-21318.html | 2026-11-08 | "SMSL AO300 Pro Class D Amplifier MA5332MS Headphone Amplifier DAC CS43131 2x165W 4Ω" |
| 発表時期(PRO) | 日本語メディアが 2025-11-06 付で「正式発表」と報道。価格・国内発売日・代理店の記載なし | 確認済み | https://www.mimiaudio.jp/smsl-ao300-pro/ | 2026-11-08 | "2025年11月6日" / "SMSL、次世代オールインワンアンプ「AO300 PRO」を正式発表" |
| 発表時期(無印) | HiFiGo ブログ 2024-02-27 付 | 確認済み | https://hifigo.com/blogs/news/smsl-ao300 | 2026-11-08 | "SMSL AO300 is launched for $289"(日付 February 27, 2024) |
| AO シリーズの出自 | 無印 AO300 は Aoshida Audio とのコラボモデルと日本語ブログが記述。「AO」の語源は記載なし | 確認済み(個人ブログ) | https://analog-to-digital.seesaa.net/article/515442326.html | 2026-11-08 | "Aoshidaaudio(ASD)とのコラボモデルだ。" / "AOシリーズでAO200の上位機に当たる。" |
| 別ブランド表記 | Amazon/マニュアルサイトで「AOSHIDA AO300」表記が検索結果に出るが、ページ未取得 | 未確認 | https://manuals.plus/asin/B0CHRTDJMR(未取得) | 2026-11-08 | (検索結果タイトル "AOSHIDA AO300" のみ) |
| 後継・派生(AO200 MKII 等) | 公式製品一覧に AO200 MKII の掲載なし。AO10 は別製品。PRO 以外の派生は確認できず | 確認済み(不在の確認) | https://www.smsl-audio.com/portal/product/lists/id/4.html | 2026-11-08 | 一覧: "AO10: /portal/product/detail/id/934.html"、"AO300 PRO" |

## 2. メーカー仕様

公式製品ページには数値仕様がない。調査ワーカーの時点では公式マニュアル PDF がテキスト抽出不可のため「未確認」としていたが、**リードが後述の手順で仕様ページを画像化して目視確認し、確認済みに更新した**(下記「リードによる一次資料確認記録」)。小売サイトの転載値は参考情報であり、SOURCE_INVENTORY の方針により `Measurement` の出典には使わない。

### リードによる一次資料確認記録(2026-11-08)

| 手順 | 内容 |
| --- | --- |
| 対象 | 公式マニュアル PDF 2 件(AO300PROManual.pdf 28 ページ、AO300Manual.pdf 25 ページ)。URL は §1 のとおり |
| 方法 | PyMuPDF 1.28.2 で全ページを 90 dpi の PNG に描画し、仕様ページをリードが目視で読み取った(フォント埋め込みのためテキスト抽出は不可)。画像は著作物の複製にあたるためリポジトリには含めない |
| 仕様ページ | PRO: p.13(英語 "Specifications")、p.22(日本語「技術仕様」)。無印: p.20(日本語「技術仕様」) |
| 読み取った文字列(PRO p.13/p.22) | "Input: HDMI(eARC)/RCA/BT/USB/Optical/Coaxial"、"THD+N: 0.003%"、"SNR: 107dB"、"Channel separation: 98dB"、"Input Sensitivity / Input Impedance: 280mV/22kΩ"、"Output Power: 165Wx2(4Ω) / 85Wx2(8Ω)"、"Power Consumption: 40W(Normal Volume)"、"Size: 219X42X185mm(WxHxD)"、"Weight: 1.49kg/3.3lbs"。注記 "SMSL reserves the right to make improvements which may result in specification or feature changes without notice." |
| 読み取った文字列(無印 p.20) | 同一項目で "HDMI(ARC)"、"1.52kg/3.35lbs"。他の数値は PRO と同一 |
| 確認できなかったこと | 出力電力の歪み基準、THD+N の測定条件、SNR の重み付け、測定帯域はいずれのページにも記載なし |
| 位置づけ | 分類は「確認済み(リード目視、画像照合)」。OCR による機械抽出ではないため、転記誤りの可能性は残る。第三者による再確認を推奨 |


| 項目 | 内容 | 分類 | URL | 取得日 | 引用 |
| --- | --- | --- | --- | --- | --- |
| 公式ページの数値仕様 | 出力・THD+N・SNR・寸法・重量いずれも記載なし | 確認済み(不在) | https://www.smsl-audio.com/portal/product/detail/id/931.html | 2026-11-08 | 仕様節なし。特徴文のみ("Support MQA decoding;" 等) |
| 定格出力(PRO、小売) | 4Ω 165W×2、8Ω 85W×2。THD 条件の記載なし | 確認済み(小売) | https://www.audiophonics.fr/en/integrated-amplifiers/smsl-ao300-pro-black-p-21318.html | 2026-11-08 | "2x165W @ 4Ω" / "2x85W @ 8Ω" |
| THD+N(PRO、小売) | 0.003%。測定条件なし | 確認済み(小売) | 同上 | 2026-11-08 | "0.003%" |
| SNR(PRO、小売) | 107dB。重み付け記載なし | 確認済み(小売) | 同上 | 2026-11-08 | "107dB" |
| チャンネルセパレーション・入力感度(PRO、小売) | 98dB、280mV/22kΩ | 確認済み(小売) | 同上 | 2026-11-08 | "98dB" / "280mV / 22kΩ" |
| 入力(PRO、小売) | RCA、同軸、光、USB-C、HDMI eARC、Bluetooth。光・同軸は 24bit/192kHz | 確認済み(小売) | 同上 | 2026-11-08 | "1x HDMI eARC" / "PCM 24bit 192kHz" |
| 出力(PRO、小売) | スピーカー端子、サブウーファー出力、4.4mm バランス、6.35mm | 確認済み(小売) | 同上 | 2026-11-08 | "1x 4.4mm balanced headphone jack output" / "1x Single-ended 6.35mm headphone output" |
| 寸法・重量(PRO、小売) | 219×42×185mm、1.5kg | 確認済み(小売) | 同上 | 2026-11-08 | "219 x 42 x 185mm" / "1.5kg" |
| 寸法・THD(PRO、別小売) | Soundimports も同寸法・同 THD 値。負荷・条件なし | 確認済み(小売) | https://www.soundimports.eu/en/smsl-ao300pro.html | 2026-11-08 | "2 x 165W" / "0.003%" / "219X42X185mm (WxHxD)" |
| 重量の不一致 | muzix.eu は 2.2kg と表示(梱包重量の可能性、ページは出荷重量か不明)。Bluetooth 欄が "No" で本文と矛盾 | 確認済み(矛盾の記録) | https://www.muzix.eu/fr/S-M-S-L/DAC/SMSL-AO300PRO-BLACK/SMSL-AO300-PRO-Desktop-DAC-Headphone-Amplifier-and-Class-D-Stereo-Amplifier-Bluetooth-5-3-LDAC-aptX-HD-DSD256-MQA-eARC-32bit-768kHz-2x165W-4-Ohm | 2026-11-08 | "2,2 kg/piece" / "Bluetooth 5.3 with LDAC/aptX HD" |
| 無印 AO300 の仕様(小売) | 出力・THD+N・SNR は PRO と同値。重量 1.52kg、HDMI は ARC | 確認済み(小売) | https://www.audiophonics.fr/en/integrated-amplifiers/smsl-ao300-class-d-amplifier-ma5332ms-headphone-amplifier-dac-cs43131-2x165w-4-32bit-768khz-dsd256-mqa-black-p-18242.html | 2026-11-08 | "2x165W @ 4Ω" / "0.003%" / "107dB" / "1* HDMI ARC" / "1.52kg" |
| THD+N の条件(無印、レビュー転載) | Soundphile Review は 1kHz 条件を付記。出力の THD 条件なし | 確認済み(レビュー転載) | https://www.soundphilereview.com/reviews/smsl-ao300-review-44755/ | 2026-11-08 | "THD+N (@1 kHz)" "< 0.003%" / "> 107 dB" / "165 W p.c. (4 Ω)" |
| 出力の THD 条件(例: 1% / 10%) | いかなる情報源にも記載なし | 未確認 | — | 2026-11-08 | — |
| PRO と無印の仕様差 | 小売転載値は同一。差分は eARC(ARC から)と Bluetooth 5.3 表記のみと推定。公式比較表は未取得 | 推定 | 上記 Audiophonics 2ページ、Aoshida | 2026-11-08 | 上記引用参照 |
| Linsoul 掲載仕様・価格 | HTTP 429 で取得不可(4回試行) | 未確認 | https://www.linsoul.com/products/smsl-ao300-pro | 2026-11-08 | — |
| HiFiGo 掲載仕様・価格 | HTTP 429 で取得不可(3回試行) | 未確認 | https://hifigo.com/products/smsl-ao300-pro | 2026-11-08 | — |

## 3. 第三者測定

| 項目 | 内容 | 分類 | URL | 取得日 | 引用 |
| --- | --- | --- | --- | --- | --- |
| Audio Science Review(AO300 / AO300 PRO) | site: 検索・通常検索・拡張検索のいずれでもスレッド未検出。サイト本体は HTTP 403 で閲覧不可のため不在は断定不可 | 未確認 | https://www.audiosciencereview.com/forum/ (403) | 2026-11-08 | — |
| Frieve Audio Review(集約サイト) | 第三者測定が存在しないと明記。評価はメーカー仕様依拠。参照 [1] は公式 AO300 PRO ページ。独立測定機関ではない | 確認済み | https://audioreview.frieve.com/products/en/smsl-ao300/ | 2026-11-08 | "no independent third-party measurements are available for verification." / "March 14, 2026" |
| Soundphile Review(無印 AO300) | 著者 Riccardo Robecchi、2023-12-15 公開(2024-04-21 更新)。試聴のみで測定器の記載なし。製品は Aoshida 提供 | 確認済み(主観レビュー、測定なし) | https://www.soundphilereview.com/reviews/smsl-ao300-review-44755/ | 2026-11-08 | "SMSL AO300" / 15 December 2023 / 測定機器の記載なし |
| Headfonia(無印 AO300) | 検索結果に存在するがページは HTTP 403。スニペットの "0.003 ... 107dB" は仕様転載の可能性があるが本文未確認 | 未確認 | https://www.headfonia.com/smsl-ao300-review/ (403) | 2026-11-08 | — |
| Audiophile Heaven(無印 AO300) | 2023-11 公開の URL。ページは HTTP 403 | 未確認 | https://www.audiophile-heaven.com/2023/11/smsl-ao300-dac-headamp-integrated-stereo-amplifier-class-d-back-in-game.html (403) | 2026-11-08 | — |
| L7Audiolab | AO300 / AO300 PRO の測定は検索で検出されず | 未確認(不在未断定) | — | 2026-11-08 | — |
| Archimago(SMSL SA300) | 別製品(SA300)の測定。AO300 には適用不可。参考として所在のみ記録 | 確認済み(所在のみ、別製品) | https://archimago.blogspot.com/2020/11/measurements-smsl-sa300-infineon-merus.html | 2026-11-08 | (タイトル "Measurements: SMSL SA300 ... Infineon MERUS" 検索結果) |
| ASR による SMSL A300 | 別製品(A300)。Frieve 経由の間接言及のみ。ASR 原典は未取得 | 未確認 | — | 2026-11-08 | — |
| 測定条件・機器(APx555 等) | AO300 / PRO についての計測記事が取得できず、記載なし | 未確認 | — | 2026-11-08 | — |

## 4. ライセンス・利用規約

いずれも再利用許諾を明示していない。「再利用可」と結論できる情報源はない。

| 項目 | 内容 | 分類 | URL | 取得日 | 引用 |
| --- | --- | --- | --- | --- | --- |
| S.M.S.L 公式サイト | 権利留保のみ。Terms/Privacy ページへのリンクなし | 確認済み | https://www.smsl-audio.com/portal/product/index.html | 2026-11-08 | "© 2009 Foshan Shuangmusanlin technology Co., Ltd. All Rights Reserved." |
| S.M.S.L マニュアル PDF | 利用条件の記載は抽出不可。表紙注記のみ | 未確認 | https://www.smsl-audio.com/upload/portal/download/AO300PROManual.pdf | 2026-11-08 | "The contents of this manual may be changed with the edition, and are subject to change without notice." |
| Audio Science Review 規約 | HTTP 403 で取得不可 | 未確認 | https://www.audiosciencereview.com/forum/index.php?help/terms/ (403) | 2026-11-08 | — |
| Audiophonics 販売条件 第12条 | 全部・一部の複製を禁止 | 確認済み | https://www.audiophonics.fr/en/content/3-terms-and-conditions-of-use | 2026-11-08 | "Any total or partial reproduction of this content is strictly prohibited and may constitute a copyright infringment." |
| Aoshida Audio 規約 | 複製・転載を禁止。個人利用・購入目的の閲覧のみ許容 | 確認済み | https://aoshida-audio.com/pages/terms-and-conditions | 2026-11-08 | "You may not use, reproduce, copy, modify, transmit, display, publish, sell" / "All rights not expressly granted are reserved." |
| Linsoul 規約 | 知的財産条項なし(保証期間の記述のみ)。フッターは権利表記のみ | 確認済み(条項不在) | https://www.linsoul.com/policies/terms-of-service | 2026-11-08 | "© 2026 LINSOUL" |
| Soundphile Review | フッター権利表記のみ。ライセンス文なし | 確認済み | https://www.soundphilereview.com/reviews/smsl-ao300-review-44755/ | 2026-11-08 | "Copyright © 2016 - 2026 Soundphile Review" |
| Frieve Audio Review | 権利留保のみ | 確認済み | https://audioreview.frieve.com/products/en/smsl-ao300/ | 2026-11-08 | "© 2026 Frieve - Audio Review. All rights reserved." |
| mimiオーディオ | 権利表記のみ | 確認済み | https://www.mimiaudio.jp/smsl-ao300-pro/ | 2026-11-08 | "© mimiオーディオ" |
| Soundimports / muzix.eu 規約 | 未取得 | 未確認 | — | 2026-11-08 | — |

## 5. 価格

公式サイトに価格表示なし。日本国内の正規価格は確認できず。マーケットプレイス(価格.com、Amazon.co.jp)は方針により参照していない。

| 項目 | 内容 | 分類 | URL | 取得日 | 引用 |
| --- | --- | --- | --- | --- | --- |
| 公式サイト価格 | 価格表示なし。「Purchase Link」で Aoshida へ誘導 | 確認済み(不在) | https://www.smsl-audio.com/portal/product/detail/id/931.html | 2026-11-08 | "Purchase Link"(リンク先 https://aoshida-audio.com/products/smsl-ao300-pro) |
| Aoshida(公式購入リンク先) | 通常価格 US$279.00、取得時 12% OFF で $245.52。税の記載なし | 確認済み(小売) | https://aoshida-audio.com/products/smsl-ao300-pro | 2026-11-08 | "$245.52" / "$279.00" / "12% OFF" |
| Audiophonics(PRO、仏) | 279,00 € 税込、232,50 € 税抜 | 確認済み(小売) | https://www.audiophonics.fr/en/integrated-amplifiers/smsl-ao300-pro-black-p-21318.html | 2026-11-08 | "279,00 €" "tax incl." / "232,50 € tax excl." |
| Soundimports(PRO、蘭) | €299,95。税込・税抜の切替があり表示価格の税区分不明 | 確認済み(小売、税区分不明) | https://www.soundimports.eu/en/smsl-ao300pro.html | 2026-11-08 | "€299,95" |
| muzix.eu(PRO) | 289,19 Eur 税込、在庫切れ | 確認済み(小売) | 上記 muzix URL | 2026-11-08 | "289,19 Eur incl.VAT / 240,99 Eur excl.VAT" |
| 無印 AO300 発売時価格 | US$289(HiFiGo ブログ) | 確認済み(小売ブログ) | https://hifigo.com/blogs/news/smsl-ao300 | 2026-11-08 | "SMSL AO300 is launched for $289" |
| 無印 AO300(仏) | 259,00 € 税込、生産終了 | 確認済み(小売) | Audiophonics 無印ページ(上記) | 2026-11-08 | "259,00 €tax incl." / "This product is discontinued" |
| 日本国内価格・代理店 | 公式・国内代理店の円建て価格は未検出。mimiaudio 記事に価格なし。HiFiGo JP の X 投稿は未取得 | 未確認 | https://x.com/HifigoJp/status/1986031933839548630(未取得) | 2026-11-08 | — |
| Linsoul 価格 | HTTP 429。検索スニペットの "$279.00 USD" は未確認扱い | 未確認 | https://www.linsoul.com/products/smsl-ao300-pro | 2026-11-08 | — |

## 未確認事項と次のアクション

| 未確認事項 | 確認先 | 次のアクション |
| --- | --- | --- |
| 公式の数値仕様と測定条件(出力の THD 条件、SNR 重み付け) | 公式マニュアル PDF(PRO・無印) | 保存済み PDF(scratchpad/phase3/dl/)を OCR または pdftotext 導入環境で再抽出。公式画像仕様の有無を確認 |
| 無印 AO300 の公式ページの有無・削除時期 | smsl-audio.com、Wayback Machine | アーカイブで旧 URL を特定し、PRO との公式差分を確認 |
| ASR のレビュー・規約 | audiosciencereview.com | ブラウザ(人手)で検索。403 はボット対策のため WebFetch では不可 |
| Headfonia / Audiophile Heaven の本文(測定の有無、公開日) | 各サイト | ブラウザで本文確認。スニペット数値は採用しない |
| Linsoul / HiFiGo の仕様・価格 | 各サイト | 429 解消後に再取得。両サイトの Terms も確認 |
| 日本国内の正規価格・代理店 | SMSL 公式、国内代理店 | 代理店名の特定(mimiaudio 記事に記載なし)。マーケットプレイスは参照しない |
| Bluetooth 5.3 の公式裏付け | 公式ページ・マニュアル | 公式は "The latest Bluetooth" のみ。マニュアル抽出後に再確認 |
| PRO と無印の正式な差分 | 公式 | 公式比較資料がなければ「小売説明に基づく推定」のまま据え置く |

## 付録: 取得失敗ログ

| URL | 結果 |
| --- | --- |
| https://www.audiosciencereview.com/forum/index.php?help/terms/ | 403 |
| https://www.audiosciencereview.com/forum/ | 403(curl でも 403) |
| https://www.headfonia.com/smsl-ao300-review/ および /3/ | 403 |
| https://www.audiophile-heaven.com/2023/11/... | 403 |
| https://www.linsoul.com/products/smsl-ao300-pro | 429 ×4 |
| https://hifigo.com/products/smsl-ao300-pro | 429 ×3 |
| https://aoshida-audio.com/policies/terms-of-service | 404(/pages/terms-and-conditions で取得) |
| 公式 PDF 2件 | 取得成功、テキスト抽出不可(グリフ ID 埋め込み、抽出ツール未導入) |
