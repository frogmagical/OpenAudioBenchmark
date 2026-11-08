> 付録の扱い: 調査ワーカーの取得ログ。第三者測定の**数値は転記しない**方針(SOURCE_INVENTORY §2.2、D-16)に従い、リードが本文収録前に測定値の記述を削除した。項目の存在・条件・引用(条件文のみ)を残す。

# KEF LS50 Meta ソース台帳(検証済み一次情報の棚卸し)

取得日はすべて 2026-11-08。分類は 確認済み(取得し引用あり)/ 推定(根拠を明記)/ 未確認(取得できず)。引用は原文のまま25語以内。
取得できなかったページは、代替経路を試した結果も含めて「未確認」とし、末尾の未確認事項に次のアクションを記す。

## 0. 取得状況の要約

| 発行元 | 状況 | 備考 |
| --- | --- | --- |
| KEF 製品ページ(international/jp/uk/us/ca/ap) | 未確認 | 全サブドメインの /products/ls50-meta が HTTP 429(Too Many Requests)。Shopify 商品JSON(jp, international)と規約・MAT・ランディングページは取得成功 |
| KEF 公式PDF(Info sheet 08.2025、R&D白書 2020) | 確認済み | 販売店サイト(stassen.nl、richersounds.com)が掲載するKEF文書。stdlib抽出のため一部文字化けあり |
| Stereophile(本文・測定・規約) | 未確認 | 全URLが HTTP 403。検索スニペットのみ(本文未取得) |
| Audio Science Review(本文・規約) | 未確認 | 全URLが HTTP 403。検索スニペットと spinorama.org の参照情報のみ |
| Erin's Audio Corner(レビュー・データ利用ポリシー) | 確認済み | 取得成功 |
| SoundStage!/NRC(レビュー・測定) | 確認済み | 取得成功 |
| Hi-Fi News(KEF が自社 assets で配布する転載PDF) | 確認済み | Lab Report 数値は読めた。号・筆者は一部推定 |

## 1. 製品識別

| 項目 | 内容 | 分類 | URL | 取得日 | 引用 |
| --- | --- | --- | --- | --- | --- |
| 公式製品ページ | 各地域の /products/ls50-meta は 429 で取得不能。Shopify JSON は取得可 | 未確認 | https://international.kef.com/products/ls50-meta ほか jp/uk/us/ca/ap | 2026-11-08 | (HTTP 429 Too Many Requests, Retry-After: 60) |
| 公式製品JSON(international) | 商品名 LS50 Meta、公開日 2020-09-22、6バリアント | 確認済み | https://international.kef.com/products/ls50-meta.json | 2026-11-08 | "published_at": "2020-09-22T19:09:31+08:00" |
| 公式ランディングページ | 仕様の一部と現行4色を記載 | 確認済み | https://international.kef.com/pages/ls50-meta | 2026-11-08 | "we offer a choice of four finishes, Carbon Black, Mineral White, Moss Green and Sand Shell." |
| 発表日 | 2020年9月22日(KEF Japan プレスリリースの日付行) | 確認済み | https://kyodonewsprwire.jp/release/202009214611 | 2026-11-08 | "2020年9月22日 英国 ケント州 メイドストーン" |
| 日本発売日 | 2020年10月2日 | 確認済み | 同上 | 2026-11-08 | "店頭販売開始: LS50 Meta 及びS2フロアスタンド 10月2日(金)" |
| 発売時仕上げ(4色) | カーボンブラック/チタニウムグレイ/ミネラルホワイト/ロイヤルブルー(特別版) | 確認済み | 同上 | 2026-11-08 | "4色のマット仕上げ展開:カーボンブラック/ チタニウムグレイ / ミネラルホワイト / スペシャルエディション・ロイヤルブルー" |
| 追加仕上げ(2025) | Moss Green と Sand Shell を追加。ハードウェア変更の記載なし | 確認済み | https://eu.kef.com/blogs/news/ls50-new-finishes-moss-green-sand | 2026-11-08 | "introducing two new finishes for our iconic LS50 collection." (投稿日 "August 12, 2025") |
| 現行バリアント(international JSON) | Moss Green / Sand Shell / Carbon Black / Titanium Grey / Mineral White / Royal Blue Special Edition | 確認済み | https://international.kef.com/products/ls50-meta.json | 2026-11-08 | 変数名 title の6件(価格は §5) |
| 現行バリアント(jp JSON) | モス・グリーン / サンド・シェル / Carbon Black / Titanium Grey の4件 | 確認済み | https://jp.kef.com/products/ls50-meta.json | 2026-11-08 | "updated_at": "2026-11-08T19:08:50+09:00" |
| リビジョン識別子 | 製品リビジョン表記は見つからず。ドライバー世代の表記のみ | 確認済み(不存在) | https://international.kef.com/pages/ls50-meta | 2026-11-08 | 比較表に "12th Generation Uni-Q with MAT" 対 "11th Generation Uni-Q" |
| 仕様値の版差(要注意) | 2020年白書は質量 7.2kg・奥行 278mm、2025年 Info sheet は 7.8kg・280.5mm。リビジョン表記なし | 確認済み(差分の存在) | §2 参照 | 2026-11-08 | 白書 "Weight 7.2kg (15.8 lb)" / Info sheet "7.8 kg (17.2 lbs.)" |
| LS50(2012)との関係(KEF) | KEF は「LS50 の後継・強化」と表現、2012年の明記なし | 確認済み | https://international.kef.com/pages/ls50-meta | 2026-11-08 | "enhancements over the legendary LS50 include Driver Performance Optimisation" |
| LS50(2012)との関係(第三者) | LS50 は2012年発売、Meta は同価格で置き換え | 確認済み | https://www.soundstagehifi.com/index.php/equipment-reviews/1502-kef-ls50-meta-loudspeakers | 2026-11-08 | "the same price the LS50, which it replaces, sold for in 2012" |
| LS50 Wireless II との区別 | 同時発表の別製品。内蔵アンプ付きアクティブ機で、本件の対象外 | 確認済み | https://kyodonewsprwire.jp/release/202009214611 | 2026-11-08 | "ツイーター100W Class A/Bとウーファー280W Class Dで合計380Wの内蔵アンプ出力" |
| 同上(KEF international) | ワイヤレス一体型として案内 | 確認済み | https://international.kef.com/pages/ls50-meta | 2026-11-08 | "If you want an all-in-one wireless speaker system" |
| 英語版公式発表ページ | ap.kef.com / international.kef.com の blogs/news は 404、m.ap.kef.com はパスワード保護 | 未確認 | https://ap.kef.com/blogs/news/kef-reveals-the-ls50-collection | 2026-11-08 | (HTTP 404 / "Coming Soon") |

## 2. メーカー仕様

一次資料A: KEF Info sheet(文書内表記 "08.2025 | LS50 Meta"、販売店 stassen.nl 掲載、PDF更新日 2025-06-24)。
一次資料B: KEF R&D 白書 "KEF R&D LS50 Meta LS50 Wireless II"(richersounds.com 掲載、PDF内部ファイル名 KEF_LS50_LS50WII_WP_18.09.2020.indd)。
いずれも KEF の公式製品ページではなく、KEF 文書の第三者ホスティングである点に注意。

| 項目 | 内容 | 分類 | URL | 取得日 | 引用 |
| --- | --- | --- | --- | --- | --- |
| 感度(A) | 85 dB、条件 2.83V/1m | 確認済み | https://www.stassen.nl/images/LS50%20Meta_Info_sheet_EN_20250624.pdf | 2026-11-08 | "Sensitivity (2.83V/1m) 85 dB" |
| 感度(B) | 85 dB SPL、条件 2.83V, 1m | 確認済み | https://www.richersounds.com/content/product_files/LS50META.pdf | 2026-11-08 | "Sensitivity (2.83V, 1m) 85dB SPL" |
| 公称/最小インピーダンス(A) | 8Ω(最小 3.5Ω)。Ω記号は抽出で欠落 | 確認済み | 同A | 2026-11-08 | "Nominal impedance 8 [Ω] (min. 3.5 [Ω])" |
| 公称/最小インピーダンス(B) | 8Ω / 3.5Ω | 確認済み | 同B | 2026-11-08 | "8Ω" / "3.5Ω"(見出し語は文字化け) |
| 周波数特性(A) | 79 Hz - 28 kHz(±3dB) | 確認済み | 同A | 2026-11-08 | "Frequency response (±3dB) 79 Hz - 28 kHz" |
| 周波数レンジ(A) | 47 Hz - 45 kHz(-6dB) | 確認済み | 同A | 2026-11-08 | "Frequency range (-6dB) 47 Hz - 45 kHz" |
| 室内低域目安(A) | 26 Hz(-6dB、typical in-room) | 確認済み | 同A | 2026-11-08 | "Typical in-room bass response (-6dB) 26 Hz" |
| 推奨アンプ出力(A) | 40-100 W | 確認済み | 同A | 2026-11-08 | "Amplifier power (recommended) 40-100 W" |
| クロスオーバー(A) | 2.1 kHz | 確認済み | 同A | 2026-11-08 | "Crossover frequency 2.1 kHz" |
| 最大出力(A) | 106 dB(距離条件の明記なし) | 確認済み | 同A | 2026-11-08 | "Maximum output 106 dB" |
| 最大出力(B) | 106dB。見出しは文字化けだが "Maximum SPL at 1m" と読める | 推定(文字化け復元) | 同B | 2026-11-08 | "106dB" |
| 高調波歪(A) | 90dB, 1m 条件 | 確認済み | 同A | 2026-11-08 | "Harmonic distortion (90dB, 1m) <0.4% 175 Hz - 20 kHz <0.1% 300 Hz - 10 kHz" |
| 寸法(A) | 302 x 200 x 280.5 mm(端子含む、1本あたり) | 確認済み | 同A | 2026-11-08 | "Dimension (H x W x D) with terminal* 302 x 200 x 280.5 mm" |
| 質量(A) | 7.8 kg(1本あたり) | 確認済み | 同A | 2026-11-08 | "Weight* 7.8 kg (17.2 lbs.)" / "* Measurement per unit" |
| 寸法・質量(B、2020) | H302/W200/D278mm、7.2kg。Aと差異あり | 確認済み | 同B | 2026-11-08 | "D: 278mm (10.9 in)" / "Weight 7.2kg (15.8 lb)" |
| ドライバー(A) | 25mm ベンテッドアルミドーム+MAT、130mm アルミコーン | 確認済み | 同A | 2026-11-08 | "HF: 25 mm (1 in.) vented aluminium dome with Metamaterial Absorption Technology" |
| 仕様変更の留保(A) | KEF は予告なく仕様変更の権利を留保 | 確認済み | 同A | 2026-11-08 | "KEF reserves the right, in line with continuing research and development, to amend or change specifications. E&OE." |
| 第三者による仕様転記(参考) | Hi-Fi+ 2022-02-15 の表は A と一致(質量 7.8kg、28.1cm) | 確認済み | https://hifiplus.com/articles/kef-ls50-meta-stand-mount-loudspeaker/3/ | 2026-11-08 | "Sensitivity (2.83V/1m): 85dB" / "Nominal impedance: 8Ω (min. 3.5Ω)" |
| 同上(SoundStage! 2020-11-15) | 歪の条件表記が "90dB/m" | 確認済み | https://www.soundstagehifi.com/index.php/equipment-reviews/1502-kef-ls50-meta-loudspeakers | 2026-11-08 | "Sensitivity: 85dB/2.83V/m" |
| 公式製品ページの仕様欄 | 取得不能(429) | 未確認 | https://international.kef.com/products/ls50-meta | 2026-11-08 | - |

## 3. 第三者測定

### 3-1. Stereophile(John Atkinson)

| 項目 | 内容 | 分類 | URL | 取得日 | 引用 |
| --- | --- | --- | --- | --- | --- |
| 測定ページ | HTTP 403(www有無、node/261085 も同様) | 未確認 | https://www.stereophile.com/content/kef-ls50-meta-loudspeaker-measurements | 2026-11-08 | - |
| レビュー本文・仕様ページ | HTTP 403 | 未確認 | https://www.stereophile.com/content/kef-ls50-meta-loudspeaker / .../kef-ls50-meta-loudspeaker-specifications | 2026-11-08 | - |
| 掲載号 | Magzter 一覧で 2021年1月号とされる(本文未取得) | 未確認 | https://magzter.com/de/stories/Technology/Stereophile/KEF-LS50-Meta-LOUDSPEAKER | 2026-11-08 | (取得は分類器により拒否) |
| 感度(スニペット) | 検索スニペットに感度推定値の記載が見えるが、本文で未裏取り(数値は転記しない) | 未確認(検索スニペットのみ) | 同測定ページ | 2026-11-08 | (数値引用は方針により省略) |
| 図1(スニペット) | インピーダンス振幅・位相図の存在 | 未確認(検索スニペットのみ) | 同測定ページ | 2026-11-08 | "electrical impedance (solid) and phase (dashed) (2 ohms/vertical div.)" |
| EPDR(検索要約) | 検索要約に最小 EPDR の記載が見えるが本文未確認(数値は転記しない) | 未確認 | 同測定ページ | 2026-11-08 | - |
| 方法・機材・試料リビジョン | 不明 | 未確認 | 同測定ページ | 2026-11-08 | - |
| 注意 | 検索要約が 2026 年版 Recommended Components の記述として公称インピーダンス・EPDR 値を挙げたが、他モデルとの混同の疑い。採用しない(数値は転記しない) | 未確認(疑義) | https://www.stereophile.com/content/recommended-components-2026-edition-loudspeakers | 2026-11-08 | - |

### 3-2. Audio Science Review(amirm)

| 項目 | 内容 | 分類 | URL | 取得日 | 引用 |
| --- | --- | --- | --- | --- | --- |
| レビュースレッド | HTTP 403。スレッドID は 25574 が正(spinorama.org と検索結果が一致)。当初試した 17567 は別物の可能性 | 未確認 | https://www.audiosciencereview.com/forum/index.php?threads/kef-ls50-meta-review-speaker.25574/ | 2026-11-08 | 検索結果タイトル "KEF LS50 Meta Review (Speaker)" |
| 投稿者・日付 | 検索要約は「amirm、2021年開始」。本文未取得 | 未確認 | 同上 | 2026-11-08 | - |
| 測定系 | Klippel NFS(spinorama.org の記載) | 推定(第三者の記載) | https://www.spinorama.org/speakers/KEF%20LS50%20Meta/ASR/index_asr.html | 2026-11-08 | "Format of the data is generated by a Klippel NFS ." |
| 感度・駆動電圧・最小インピーダンス・試料リビジョン | 不明 | 未確認 | 同スレッド | 2026-11-08 | - |

### 3-3. Erin's Audio Corner

| 項目 | 内容 | 分類 | URL | 取得日 | 引用 |
| --- | --- | --- | --- | --- | --- |
| レビュー | 公開日 2023-12-22。ページ上に筆者名表示なし | 確認済み | https://www.erinsaudiocorner.com/loudspeakers/kef_ls50_meta/ | 2026-11-08 | "Friday, Dec 22, 2023" |
| 筆者 | データ利用ポリシー第2条に Erin Hardison の名 | 確認済み | https://www.erinsaudiocorner.com/measurement-data-policy/ | 2026-11-08 | (第2条: 帰属先として Erin Hardison / Erin's Audio Corner) |
| 測定系 | Klippel NFS | 確認済み | レビューURL | 2026-11-08 | "All data collected using Klippel's Near-Field Scanner." |
| 測定項目 | CTA-2034 スピン、PIR、水平/垂直コンター、インピーダンス、ステップ・群遅延、歪(86/96dB@1m)、圧縮、マルチトーン | 確認済み | レビューURL | 2026-11-08 | 歪: "86 dB and 96 dB @ 1m" |
| 感度(実測) | 軸上平均感度の記載あり(数値は転記しない)。駆動電圧・距離はページに明記なし | 確認済み(条件は未記載) | レビューURL | 2026-11-08 | (数値引用は方針により省略) |
| 同(第三者再掲) | spinorama.org は 2.83V/1m、300Hz-3kHz 平均の感度値を再掲(数値は転記しない) | 推定(第三者の記載) | https://www.spinorama.org/speakers/KEF%20LS50%20Meta/ErinsAudioCorner/index_eac-v1-0-degree.html | 2026-11-08 | "Origin of the data is ErinsAudioCorner." |
| 最小インピーダンス | 最小インピーダンスとその周波数帯の記載あり(数値は転記しない) | 確認済み | レビューURL | 2026-11-08 | (数値引用は方針により省略) |
| 条件 | 基準点ツイーター、0°主体・15°追加、エージング済み | 確認済み | レビューURL | 2026-11-08 | "Speaker was broken in." |
| 試料リビジョン | 記載なし | 確認済み(不存在) | レビューURL | 2026-11-08 | - |
| 価格記載 | 執筆時 MSRP 約 $1600/pair | 確認済み | レビューURL | 2026-11-08 | "As of this writeup MSRP is approximately $1600/pair." |

### 3-4. SoundStage! / NRC

| 項目 | 内容 | 分類 | URL | 取得日 | 引用 |
| --- | --- | --- | --- | --- | --- |
| 測定ページ | 作成日 2020-11-15、NRC で独立測定 | 確認済み | https://www.soundstagenetwork.com/index.php?option=com_content&view=article&id=2421:nrc-measurements-kef-ls50-meta-loudspeakers&catid=77:loudspeaker-measurements&Itemid=153 | 2026-11-08 | "All loudspeaker measurements are performed independently at the National Research Council of Canada." |
| 感度 | 感度の記載あり(数値は転記しない)。条件: 2.83V/1m、リスニングウィンドウ 300Hz-3kHz 平均 | 確認済み | 同上 | 2026-11-08 | "(averaged 300Hz-3kHz on Listening Window, 2.83V/1m)" |
| 測定項目 | 軸上/軸外(15-75°)、リスニングウィンドウ、THD+N、リニアリティ偏差、インピーダンス振幅、電気位相 | 確認済み | 同上 | 2026-11-08 | "@ 90dB, 50Hz - 10kHz (measured @ 2m)" |
| 条件 | 2m で測定し 1m に換算、ツイーター軸、グリルなし | 確認済み | 同上 | 2026-11-08 | "Microphone measuring position: tweeter axis" |
| 最小インピーダンス | 数値記載なし(図のみ) | 確認済み(不存在) | 同上 | 2026-11-08 | - |
| 試料リビジョン | 記載なし | 確認済み(不存在) | 同上 | 2026-11-08 | - |
| レビュー | Doug Schneider、作成日 2020-11-15 | 確認済み | https://www.soundstagehifi.com/index.php/equipment-reviews/1502-kef-ls50-meta-loudspeakers | 2026-11-08 | "Written by Doug Schneider." |

### 3-5. Hi-Fi News Lab Report(KEF 配布の転載PDF)

| 項目 | 内容 | 分類 | URL | 取得日 | 引用 |
| --- | --- | --- | --- | --- | --- |
| 文書 | KEF assets 上の Hi-Fi News 転載。LS50 と LS50 Meta の新品試料を同条件で比較 | 確認済み | https://assets.kef.com/pdf_doc/LS50Meta/HFN_June_KEF_LS50_Meta.pdf | 2026-11-08 | "new samples of both the LS50 and LS50 Meta were tested 'back-to-back' under identical lab conditions." |
| 号・筆者 | ファイル名から6月号。本文に "will be ten years old in 2022" とあり 2021年6月号と推定。Lab は "PM"(Paul Miller)と推定 | 推定 | 同上 | 2026-11-08 | "LS50 which (terrifyingly) will be ten years old in 2022" |
| 感度 | 1kHz / Mean / IEC の 3 系統で感度を記載(数値は転記しない)。条件: SPL/1m/2.83V | 確認済み | 同上 | 2026-11-08 | "Sensitivity (SPL/1m/2.83V – 1kHz/Mean/IEC)" |
| インピーダンス | 最小・最大インピーダンスとその周波数の記載あり(数値は転記しない)。表と本文で最小値の周波数表記が不一致 | 確認済み(表内不一致あり) | 同上 | 2026-11-08 | (数値引用は方針により省略) |
| 位相 | 位相の最小・最大とその周波数の記載あり(数値は転記しない) | 確認済み | 同上 | 2026-11-08 | "Impedance phase: minimum & maximum (20Hz–20kHz)" |
| 応答誤差 | ペア差・応答誤差の記載あり(数値は転記しない) | 確認済み | 同上 | 2026-11-08 | (数値引用は方針により省略) |
| THD | THD の記載あり(3 条件、数値は転記しない) | 確認済み | 同上 | 2026-11-08 | (数値引用は方針により省略) |
| 試料リビジョン | 記載なし(「新品試料」のみ) | 確認済み(不存在) | 同上 | 2026-11-08 | - |

## 4. ライセンス・利用規約

| 発行元 | 内容 | 分類 | URL | 取得日 | 引用 |
| --- | --- | --- | --- | --- | --- |
| KEF(international) | 事前の書面同意なしの複製・再利用を禁止 | 確認済み | https://international.kef.com/pages/terms-and-conditions | 2026-11-08 | "You may not, in whole or in part, use, transfer, download or otherwise reproduce any part of the Site without our prior written consent." |
| KEF(international) | 再利用禁止・全権利留保 | 確認済み | 同上 | 2026-11-08 | "Re-use of any of the foregoing is strictly prohibited and we reserve all our rights." |
| KEF(jp) | 同趣旨の日本語条項 | 確認済み | https://jp.kef.com/pages/terms-and-conditions | 2026-11-08 | "事前の書面による同意なしに、サイトの一部または全部を使用、転送、ダウンロード、または複製することはできません。" |
| KEF(us) | 同趣旨 | 確認済み | https://us.kef.com/pages/terms-and-conditions | 2026-11-08 | "Copyright © 2026, KEF US. All rights reserved." |
| KEF(PDF) | 仕様変更の留保(再利用条項なし) | 確認済み | Info sheet(§2 A) | 2026-11-08 | "E&OE." |
| Stereophile | 規約ページ取得不能(403)。フッター表記は検索スニペットのみ | 未確認 | https://www.stereophile.com/terms-use | 2026-11-08 | (スニペット) "© 2024 Stereophile AVTech Media Americas Inc., USA All rights reserved." |
| Audio Science Review | 規約ページ取得不能(403) | 未確認 | https://www.audiosciencereview.com/forum/index.php?help/terms/ | 2026-11-08 | - |
| Erin's Audio Corner(フッター) | 無断複製・商用再配布を禁止 | 確認済み | https://www.erinsaudiocorner.com/loudspeakers/kef_ls50_meta/ | 2026-11-08 | "may not be reproduced or commercially redistributed without permission" / "© 2026 Erin's Audio Corner. All rights reserved." |
| Erin's Audio Corner(データ利用ポリシー) | 一般ライセンス不付与、グラフのデジタイズ・DB化を制限、帰属だけでは許諾にならない | 確認済み | https://www.erinsaudiocorner.com/measurement-data-policy/ | 2026-11-08 | "No general license is granted for the reproduction, redistribution, commercial exploitation" |
| 同上 | 帰属≠許諾 | 確認済み | 同上 | 2026-11-08 | "Attribution alone does not constitute permission for uses that otherwise require authorization." |
| 同上 | 事実・生数値に独占権は主張しないが、表現・編集物・ソフトに権利主張(第5条) | 確認済み | 同上 | 2026-11-08 | (第5条要旨。原文引用は取得要約のため略) |
| SoundStage!/NRC | 測定データ・図の複製を全面禁止 | 確認済み | NRC測定URL(§3-4) | 2026-11-08 | "Reproduction in any format is not permitted." |
| spinorama.org(再掲データ) | CC BY-NC-SA 4.0、ただし測定元の条件が優先 | 確認済み | https://www.spinorama.org/speakers/KEF%20LS50%20Meta/ASR/index_asr.html | 2026-11-08 | "Measurement data license: CC BY-NC-SA 4.0 unless otherwise stated for a specific measurement." / "Measurement-specific terms take precedence." |

いずれの発行元も再利用許可を明示していない。KEF・Erin's・SoundStage! は明示的に禁止。Stereophile・ASR は規約未取得のため、許可の有無を判断しない。

## 5. 価格

| 項目 | 内容 | 分類 | URL | 取得日 | 引用 |
| --- | --- | --- | --- | --- | --- |
| 日本・発売時(KEF Japan) | 145,000円(税抜き)。ペア/1本の明記は引用範囲に見当たらず | 確認済み(単位は未確認) | https://kyodonewsprwire.jp/release/202009214611 | 2026-11-08 | "価格(税抜き)" / "LS50 Meta 145,000円" |
| 日本・現行(jp.kef.com 商品JSON) | 全4バリアント 187000 JPY。税込/税抜・ペア/1本の表記は JSON に無し | 確認済み(税・単位は未確認) | https://jp.kef.com/products/ls50-meta.json | 2026-11-08 | 各 variant "price": 187000(通貨 JPY) |
| 日本・税表記の根拠 | 特商法ページ相当に消費税の記載なし | 未確認 | https://jp.kef.com/policies/legal-notice | 2026-11-08 | (ページは一般規約のみ) |
| international(EUR) | 全6バリアント 1199.00 EUR。税・単位の表記なし | 確認済み(税・単位は未確認) | https://international.kef.com/products/ls50-meta.json | 2026-11-08 | 各 variant "price": "1199.00"(price_currency EUR) |
| 米国・発売時(第三者) | $1499.99/pair | 確認済み(第三者記載) | https://www.soundstagehifi.com/index.php/equipment-reviews/1502-kef-ls50-meta-loudspeakers | 2026-11-08 | "sells for $1499.99/pair" |
| 米国・現行(公式) | us.kef.com 取得不能(429) | 未確認 | https://us.kef.com/products/ls50-meta.json | 2026-11-08 | - |
| 英国(第三者) | £999(2021-04-28)、£1,000 per pair(2022-02-15) | 確認済み(第三者記載) | https://www.stereonet.com/uk/reviews/kef-ls50-meta-loudspeakers-review/ ; https://hifiplus.com/articles/kef-ls50-meta-stand-mount-loudspeaker/3/ | 2026-11-08 | "Price: £1,000 per pair" |
| 英国・現行(公式) | uk.kef.com 取得不能(429) | 未確認 | https://uk.kef.com/products/ls50-meta.json | 2026-11-08 | - |

## 未確認事項と次のアクション

| 未確認事項 | 原因 | 次のアクション |
| --- | --- | --- |
| KEF 公式製品ページの仕様欄・価格表示(税込表記、ペア単位) | 全地域 /products/ls50-meta が 429 | 時間を置いて再取得。代替として取得済みの KEF Info sheet(08.2025)を一次仕様とし、出所が販売店ホスティングである旨を注記 |
| 2020年白書(7.2kg/278mm)と2025年 Info sheet(7.8kg/280.5mm)の差 | 文書間の不一致。リビジョン表記なし | KEF への照会、または 2020-2021 年の公式製品ページのアーカイブ確認。推測で統一しない |
| Stereophile 測定(方法・機材・感度・インピーダンス・EPDR・掲載号・試料) | HTTP 403 | ユーザー側ブラウザで取得し所在・条件を追加。検索スニペットの数値は本文確認まで採用せず、転記もしない |
| Stereophile 利用規約 | HTTP 403 | 同上 |
| ASR レビュー(投稿者・日付・条件・感度基準・最小インピーダンス) | HTTP 403 | 同上。スレッドIDは 25574 を使用 |
| ASR 利用規約 | HTTP 403 | 同上 |
| Erin's Audio Corner のスピン測定駆動電圧 | ページに明記なし(spinorama.org は 2.83V/1m と記載) | Erin's 側の方法論ページを確認、または本人へ照会 |
| Hi-Fi News の掲載号・筆者名 | 転載PDFの該当部が文字化け | hifinews.com(403)を別経路で確認。現状は 2021年6月号・Lab: Paul Miller を推定扱い |
| KEF 英語版公式発表ページ | 404 / パスワード保護 | KEF の現行ニュース一覧から再検索。発表日は KEF Japan リリース(2020-09-22)で代替済み |
| 日本の現行価格の税区分・単位 | JSON に税・単位情報なし | jp.kef.com 製品ページ本文の「税込」「ペア」表記を再取得時に確認 |

## 付記(取得物の所在)

- 測定グラフ・大きな表は転記していない(存在と測定条件のみ記録)
