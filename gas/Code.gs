// ============================================================
// Google Apps Script - カウンセリングシート API
// ============================================================
//
// 【セットアップ手順】
// 1. Google Apps Script (https://script.google.com) で新規プロジェクト作成
// 2. このコードを貼り付け
// 3. 下記の SHEET_CONFIG にスプレッドシートIDを設定
// 4. デプロイ → ウェブアプリ → アクセス権「全員」で公開
// 5. 公開URLをSPAの GAS_URL 定数に設定
// ============================================================

// ━━━ 設定 ━━━
const SHEET_CONFIG = {
  lumiss: {
    spreadsheetId: '1wMHMc7KeARs4sMNnGrjfX8rgSw_h2gVoXTFdaDZJqAM',
    sheetName: 'LUMISS',
  },
  ssin: {
    spreadsheetId: '1wMHMc7KeARs4sMNnGrjfX8rgSw_h2gVoXTFdaDZJqAM',
    sheetName: 'SSIN',
  }
};

// ━━━ カラムマッピング（スプシの列順 A〜AY、共通51列） ━━━
// LUMISS・SSIN共にGoogleフォームの列構造が同一
const SHARED_COLUMNS = [
  'timestamp',              // A: タイムスタンプ
  'name',                   // B: お名前
  'address',                // C: 住所
  'phone',                  // D: 電話番号
  'birthday',               // E: 生年月日
  'occupation',             // F: 職業
  'how_found',              // G: 知ったきっかけ
  'reason_chose',           // H: 選んだ理由
  'reason_from_other',      // I: 他サロンからの理由
  'dissatisfaction_reason', // J: 不満の理由
  'visit_frequency',        // K: 利用頻度
  'interested_menu',        // L: 興味のあるメニュー
  'column_51',              // M: Column 51（Googleフォーム内部列）
  // --- アイブロウ系 ---
  'treatment_planned',      // N: 施術予定
  'last_brow_care_timing',  // O: 最後の眉手入れ
  'brow_self_care',         // P: 眉の自己処理
  'facial_cosmetic_surgery',// Q: 美容整形経験/予定
  'allergy_brow',           // R: アレルギー（眉）
  'skin_concern_brow',      // S: お肌状態（眉）
  'brow_color_bleach',      // T: 眉カラー/脱色
  'brow_design_image',      // U: 眉デザインイメージ
  'desired_impression_brow',// V: 見られたい印象
  'brow_makeup_items',      // W: 眉メイクアイテム
  'sns_photo_ok_brow',      // X: SNS写真使用（眉）
  'consent_brow',           // Y: 施術同意（眉）
  // --- ラッシュリフト系 ---
  'glue_allergy_history',   // Z: グルーかぶれ経験
  'eye_surgery_history',    // AA: 目元整形/レーシック
  'allergy_lash',           // AB: アレルギー（ラッシュ）
  'skin_concern_lash',      // AC: お肌状態（ラッシュ）
  'eye_appearance_pref',    // AD: 目の見え方の希望
  'lash_design_image',      // AE: ラッシュデザインイメージ
  'homecare_product_lash',  // AF: ホームケア商品（ラッシュ）
  'sns_photo_ok_lash',      // AG: SNS写真使用（ラッシュ）
  'consent_lash',           // AH: 施術同意（ラッシュ）
  // --- アイブロウ+ラッシュリフト併用系 ---
  'eye_surgery_history_combo',    // AI: 目元整形（併用）
  'allergy_combo',                // AJ: アレルギー（併用）
  'skin_concern_combo',           // AK: お肌状態（併用）
  'brow_self_care_combo',         // AL: 眉自己処理（併用）
  'last_brow_care_timing_combo',  // AM: 最後の眉手入れ（併用）
  'brow_color_bleach_combo',      // AN: 眉カラー/脱色（併用）
  'brow_design_image_combo',      // AO: 眉デザイン（併用）
  'desired_impression_combo',     // AP: 印象（併用）
  'brow_makeup_items_combo',      // AQ: 眉メイク（併用）
  'glue_allergy_history_combo',   // AR: グルーかぶれ（併用）
  'contact_lens',                 // AS: コンタクトレンズ
  'eye_appearance_pref_combo',    // AT: 目の見え方（併用）
  'lash_design_image_combo',      // AU: ラッシュデザイン（併用）
  'homecare_product_combo',       // AV: ホームケア（併用）
  'sns_photo_ok_combo',           // AW: SNS写真（併用）
  'consent_combo',                // AX: 施術同意（併用）
  'first_visit_homecare',         // AY: 初回限定ホームケア
];

const COLUMN_MAP = {
  lumiss: SHARED_COLUMNS,
  ssin: SHARED_COLUMNS,
};

// ━━━ 日本語ラベル（SPA表示用・共通） ━━━
const SHARED_LABELS = {
  timestamp: '受付日時',
  name: 'お名前',
  address: '住所',
  phone: '電話番号',
  birthday: '生年月日',
  occupation: '職業',
  how_found: '知ったきっかけ',
  reason_chose: '選んだ理由',
  reason_from_other: '他サロンからの理由',
  dissatisfaction_reason: '不満の理由',
  visit_frequency: '利用頻度',
  interested_menu: '興味のあるメニュー',
  column_51: '備考',
  treatment_planned: '施術予定',
  last_brow_care_timing: '最後の眉手入れ',
  brow_self_care: '眉の自己処理',
  facial_cosmetic_surgery: '美容整形経験/予定',
  allergy_brow: 'アレルギー（眉）',
  skin_concern_brow: 'お肌の気になるところ（眉）',
  brow_color_bleach: '眉カラー/脱色',
  brow_design_image: '眉デザインイメージ',
  desired_impression_brow: '見られたい印象（眉）',
  brow_makeup_items: '眉メイクアイテム',
  sns_photo_ok_brow: 'SNS写真使用（眉）',
  consent_brow: '施術同意（眉）',
  glue_allergy_history: 'グルーかぶれ経験',
  eye_surgery_history: '目元整形/レーシック',
  allergy_lash: 'アレルギー（ラッシュ）',
  skin_concern_lash: 'お肌の気になるところ（ラッシュ）',
  eye_appearance_pref: '目の見え方の希望',
  lash_design_image: 'ラッシュデザインイメージ',
  homecare_product_lash: 'ホームケア商品（ラッシュ）',
  sns_photo_ok_lash: 'SNS写真使用（ラッシュ）',
  consent_lash: '施術同意（ラッシュ）',
  eye_surgery_history_combo: '目元整形経験（併用）',
  allergy_combo: 'アレルギー（併用）',
  skin_concern_combo: 'お肌状態（併用）',
  brow_self_care_combo: '眉自己処理（併用）',
  last_brow_care_timing_combo: '最後の眉手入れ（併用）',
  brow_color_bleach_combo: '眉カラー/脱色（併用）',
  brow_design_image_combo: '眉デザイン（併用）',
  desired_impression_combo: '印象（併用）',
  brow_makeup_items_combo: '眉メイク（併用）',
  glue_allergy_history_combo: 'グルーかぶれ（併用）',
  contact_lens: 'コンタクトレンズ',
  eye_appearance_pref_combo: '目の見え方（併用）',
  lash_design_image_combo: 'ラッシュデザイン（併用）',
  homecare_product_combo: 'ホームケア（併用）',
  sns_photo_ok_combo: 'SNS写真（併用）',
  consent_combo: '施術同意（併用）',
  first_visit_homecare: '初回限定ホームケア',
};

const LABELS = {
  lumiss: SHARED_LABELS,
  ssin: SHARED_LABELS,
};

// ━━━ メインAPI ━━━
function doGet(e) {
  const params = e.parameter;
  const salon = params.salon || 'lumiss';
  const action = params.action || 'list';
  const limit = parseInt(params.limit) || 50;
  const offset = parseInt(params.offset) || 0;
  const search = params.search || '';

  // サロンパラメータの検証
  if (!SHEET_CONFIG[salon]) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Unknown salon: ' + salon }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  let result;

  try {
    switch (action) {
      case 'labels':
        result = { success: true, data: LABELS[salon] || {} };
        break;

      case 'detail':
        const rowIndex = parseInt(params.row);
        if (isNaN(rowIndex)) {
          result = { success: false, error: 'row parameter is required' };
        } else {
          result = getDetail(salon, rowIndex);
        }
        break;

      case 'list':
      default:
        result = getList(salon, limit, offset, search);
        break;
    }
  } catch (err) {
    result = { success: false, error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ━━━ 一覧取得 ━━━
function getList(salon, limit, offset, search) {
  const config = SHEET_CONFIG[salon];
  if (!config) return { success: false, error: 'Unknown salon: ' + salon };

  const ss = SpreadsheetApp.openById(config.spreadsheetId);
  const sheet = ss.getSheetByName(config.sheetName);
  if (!sheet) return { success: false, error: 'Sheet not found: ' + config.sheetName };

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [], total: 0 };

  const allRows = [];

  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    if (!row[1] || String(row[1]).trim() === '') continue;

    if (search) {
      const rowStr = row.join(' ').toLowerCase();
      if (!rowStr.includes(search.toLowerCase())) continue;
    }

    const record = { _rowIndex: i };
    record.timestamp = formatDateTime(row[0]);    // A
    record.name = row[1] || '';                   // B
    record.phone = row[3] || '';                  // D
    record.birthday = formatDateOnly(row[4]);     // E
    record.how_found = row[6] || '';              // G
    record.visit_frequency = row[10] || '';       // K
    record.treatment_planned = row[13] || '';     // N

    allRows.push(record);
  }

  const total = allRows.length;
  const paginated = allRows.slice(offset, offset + limit);

  return {
    success: true,
    data: paginated,
    total: total,
    salon: salon,
    limit: limit,
    offset: offset,
  };
}

// ━━━ 詳細取得 ━━━
function getDetail(salon, rowIndex) {
  const config = SHEET_CONFIG[salon];
  if (!config) return { success: false, error: 'Unknown salon' };

  const ss = SpreadsheetApp.openById(config.spreadsheetId);
  const sheet = ss.getSheetByName(config.sheetName);
  const data = sheet.getDataRange().getValues();

  if (rowIndex < 1 || rowIndex >= data.length) {
    return { success: false, error: 'Row not found' };
  }

  const row = data[rowIndex];
  const columns = COLUMN_MAP[salon];
  const labels = LABELS[salon];
  const record = {};

  columns.forEach((key, idx) => {
    if (idx < row.length) {
      let val = row[idx];
      if (key === 'timestamp') val = formatDateTime(val);
      if (key === 'birthday') val = formatDateOnly(val);
      record[key] = { value: val || '', label: labels[key] || key };
    }
  });

  return { success: true, data: record, salon: salon, rowIndex: rowIndex };
}

// ━━━ ユーティリティ ━━━
function formatDateTime(val) {
  if (!val) return '';
  try {
    const d = (val instanceof Date) ? val : new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');
  } catch (e) {
    return String(val);
  }
}

function formatDateOnly(val) {
  if (!val) return '';
  try {
    const d = (val instanceof Date) ? val : new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy/MM/dd');
  } catch (e) {
    return String(val);
  }
}

// ━━━ CORS対応（必要に応じて） ━━━
function doPost(e) {
  return doGet(e);
}
