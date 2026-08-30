/**
 * ATLANTIC BOAT RENTALS — booking backend
 * ----------------------------------------
 * Paste this whole file into script.google.com (a new Apps Script project),
 * then follow SETUP-BOOKING-SYSTEM.md to connect it to a Google Sheet and
 * deploy it as a Web App.
 *
 * What it does:
 *  - doPost({action:"create"})   -> saves a new booking from the site's form (public, no token)
 *  - doGet({token})              -> returns the full list of bookings as JSON (worker dashboard only)
 *  - doPost({action:"finalize"}) -> flips a booking's status Pending <-> Finalized (worker dashboard only)
 */

// 1) Change this to your own sheet's name (must match exactly).
const SHEET_NAME = 'Bookings';

// 1b) Paste your spreadsheet's ID here (the long string in its URL between /d/ and /edit).
//     Leave this blank ONLY if this script is bound to the Sheet via Extensions > Apps Script.
const SHEET_ID = '';

// 2) Change this to a password only you and your crew know.
//    This is what protects the dashboard — anyone with this string can read booking info.
const WORKER_TOKEN = 'CHANGE-THIS-TO-YOUR-OWN-SECRET';

const HEADERS = ['ID', 'Submitted', 'Date Requested', 'Experience', 'Guests', 'Name', 'Phone', 'Notes', 'Status', 'Finalized At'];

function getSheet_() {
  const ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const params = e.parameter || {};
  const action = params.action || 'create';
  const sheet = getSheet_();

  if (action === 'create') {
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      data = params; // fallback if sent as form-encoded
    }

    // Honeypot: if the hidden "company" field got filled in, it's a bot — pretend success, save nothing.
    if (data.company) return json_({ ok: true });

    if (!data.name || !data.phone || !data.date) {
      return json_({ ok: false, error: 'Missing required fields.' });
    }

    const id = Utilities.getUuid();
    sheet.appendRow([
      id,
      new Date(),
      data.date || '',
      data.experience || '',
      data.guests || '',
      data.name || '',
      data.phone || '',
      data.notes || '',
      'Pending',
      ''
    ]);
    return json_({ ok: true, id: id });
  }

  if (action === 'finalize') {
    if (params.token !== WORKER_TOKEN) return json_({ ok: false, error: 'Unauthorized' });
    const id = params.id;
    const newStatus = params.status === 'pending' ? 'Pending' : 'Finalized';
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === id) {
        sheet.getRange(i + 1, 9).setValue(newStatus);
        sheet.getRange(i + 1, 10).setValue(newStatus === 'Finalized' ? new Date() : '');
        return json_({ ok: true });
      }
    }
    return json_({ ok: false, error: 'Booking not found' });
  }

  return json_({ ok: false, error: 'Unknown action' });
}

function doGet(e) {
  const params = e.parameter || {};
  if (params.token !== WORKER_TOKEN) return json_({ ok: false, error: 'Unauthorized' });

  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const bookings = rows.slice(1)
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] instanceof Date ? row[i].toISOString() : row[i]; });
      return obj;
    })
    .filter((b) => b.ID)
    .reverse(); // newest first

  return json_({ ok: true, bookings: bookings });
}
