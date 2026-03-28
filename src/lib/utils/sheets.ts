import { google } from 'googleapis';
import { GOOGLE_PRIVATE_KEY, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SHEET_ID, GOOGLE_SHEET_TAB_NAME } from '$env/static/private';
import type { Transaction } from '$lib/types/transaction';

const SHEET_COLUMNS = ['id', 'tanggal', 'tipe', 'kategori', 'nominal', 'user', 'catatan'] as const;
const TAB_NAME = GOOGLE_SHEET_TAB_NAME || 'Transactions';

/**
 * Create an authenticated Google API client using Service Account credentials.
 */
function getAuthClient() {
	const privateKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

	return new google.auth.JWT({
		email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
		key: privateKey,
		scopes: ['https://www.googleapis.com/auth/spreadsheets']
	});
}

/**
 * Fetch all transactions from the Google Sheet.
 * Skips the first row (headers).
 */
export async function getSheetData(): Promise<Transaction[]> {
	const auth = getAuthClient();
	const sheets = google.sheets({ version: 'v4', auth });

	const response = await sheets.spreadsheets.values.get({
		spreadsheetId: GOOGLE_SHEET_ID,
		range: `${TAB_NAME}!A1:G` // Read from row 1 to be safe
	});

	const rows = response.data.values;
	if (!rows || rows.length === 0) {
		return [];
	}

	// Auto-detect header row: skip first row if it looks like a header
	const HEADER_INDICATORS = ['id', 'ID', 'Tanggal', 'tanggal', 'Tipe', 'tipe'];
	const hasHeader = HEADER_INDICATORS.some((h) => String(rows[0]?.[0] ?? '').toLowerCase() === h.toLowerCase() || String(rows[0]?.[1] ?? '').toLowerCase() === 'tanggal');
	const dataRows = hasHeader ? rows.slice(1) : rows;

	return dataRows
		.filter((row) => row.length > 0 && row[0]) // skip empty rows
		.map((row) => ({
			id: row[0] ?? '',
			tanggal: row[1] ?? '',
			tipe: (row[2] as Transaction['tipe']) ?? 'Expense',
			kategori: row[3] ?? '',
			nominal: Number(row[4]) || 0,
			user: row[5] ?? '',
			catatan: row[6] ?? ''
		}));
}

/**
 * Append a new transaction row to the Google Sheet.
 */
export async function appendRow(transaction: Transaction): Promise<void> {
	const auth = getAuthClient();
	const sheets = google.sheets({ version: 'v4', auth });

	const values = SHEET_COLUMNS.map((col) => {
		const val = transaction[col];
		return val !== undefined && val !== null ? String(val) : '';
	});

	await sheets.spreadsheets.values.append({
		spreadsheetId: GOOGLE_SHEET_ID,
		range: `${TAB_NAME}!A:G`,
		valueInputOption: 'USER_ENTERED',
		requestBody: {
			values: [values]
		}
	});
}

/**
 * Seed the header row in the sheet (run once during setup).
 */
export async function seedHeaders(): Promise<void> {
	const auth = getAuthClient();
	const sheets = google.sheets({ version: 'v4', auth });

	const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Nominal', 'User', 'Catatan'];

	await sheets.spreadsheets.values.update({
		spreadsheetId: GOOGLE_SHEET_ID,
		range: `${TAB_NAME}!A1:G1`,
		valueInputOption: 'RAW',
		requestBody: {
			values: [headers]
		}
	});
}
