/**
 * IEEE University of Petra — Team Registration Backend
 * Google Apps Script Web App
 *
 * Run setupSheet() ONCE after pasting this file into the Apps Script editor.
 * Then deploy:  Deploy ▸ New deployment ▸ Web app
 *   - Execute as: Me
 *   - Who has access: Anyone
 * Copy the resulting Web App URL into your frontend .env as
 *   VITE_APPS_SCRIPT_URL=...
 */

const SHEET_NAME = 'Submissions';

const HEADERS = [
  'Timestamp',
  'Team Name',
  'Team Size',
  'Leader Name',
  'Leader ID',
  'Leader Major',
  'Leader Phone',
  'Member 2 Name',
  'Member 2 ID',
  'Member 2 Major',
  'Member 2 Phone',
  'Member 3 Name',
  'Member 3 ID',
  'Member 3 Major',
  'Member 3 Phone',
  'Language',
];

/**
 * Run this manually once to create / reset the header row.
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  sheet.clear();
  sheet
    .getRange(1, 1, 1, HEADERS.length)
    .setValues([HEADERS])
    .setFontWeight('bold')
    .setBackground('#00629B')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
}

/**
 * Browser/preflight check. Lets you confirm the deployment is reachable.
 */
function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, service: 'IEEE UoP Registration', version: 1 }),
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Main submission endpoint.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return _jsonResponse({ success: false, error: 'busy' });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return _jsonResponse({ success: false, error: 'empty_payload' });
    }

    const data = JSON.parse(e.postData.contents);

    const validation = _validate(data);
    if (!validation.ok) {
      return _jsonResponse({ success: false, error: validation.error });
    }

    const sheet = _getSheet();
    if (!sheet) {
      return _jsonResponse({ success: false, error: 'sheet_missing' });
    }

    if (_isDuplicate(sheet, data.leader.universityId)) {
      return _jsonResponse({ success: false, error: 'duplicate' });
    }

    const row = [
      new Date(),
      data.teamName,
      String(data.teamSize),
      data.leader.fullName,
      data.leader.universityId,
      data.leader.major,
      data.leader.phone,
      data.member2.fullName,
      data.member2.universityId,
      data.member2.major,
      data.member2.phone,
      data.member3 ? data.member3.fullName || '' : '',
      data.member3 ? data.member3.universityId || '' : '',
      data.member3 ? data.member3.major || '' : '',
      data.member3 ? data.member3.phone || '' : '',
      (data.meta && data.meta.language) || '',
    ];

    sheet.appendRow(row);

    return _jsonResponse({ success: true });
  } catch (err) {
    return _jsonResponse({ success: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {
      /* noop */
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function _getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME);
}

function _jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function _isDuplicate(sheet, leaderId) {
  if (!leaderId) return false;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  // Column 5 = Leader ID (1-indexed)
  const ids = sheet.getRange(2, 5, lastRow - 1, 1).getValues();
  const target = String(leaderId).trim();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === target) return true;
  }
  return false;
}

function _validate(data) {
  if (!data || typeof data !== 'object') return { ok: false, error: 'invalid_payload' };

  const teamName = (data.teamName || '').toString().trim();
  if (teamName.length < 2) return { ok: false, error: 'invalid_team_name' };

  const teamSize = String(data.teamSize || '');
  if (teamSize !== '2' && teamSize !== '3') return { ok: false, error: 'invalid_team_size' };

  if (!_validateMember(data.leader)) return { ok: false, error: 'invalid_leader' };
  if (!_validateMember(data.member2)) return { ok: false, error: 'invalid_member2' };
  if (teamSize === '3' && !_validateMember(data.member3))
    return { ok: false, error: 'invalid_member3' };

  return { ok: true };
}

function _validateMember(m) {
  if (!m || typeof m !== 'object') return false;
  const fullName = (m.fullName || '').toString().trim();
  const universityId = (m.universityId || '').toString().trim();
  const major = (m.major || '').toString().trim();
  const phone = (m.phone || '').toString().trim();
  if (fullName.length < 3) return false;
  if (!/^\d{9}$/.test(universityId)) return false;
  if (major.length < 1) return false;
  if (!/^(\+962|0)?7[789]\d{7}$/.test(phone)) return false;
  return true;
}
