import { google } from 'googleapis';
import {
	GOOGLE_PRIVATE_KEY,
	GOOGLE_SERVICE_ACCOUNT_EMAIL,
	GOOGLE_SHEET_ID,
	GOOGLE_SHEET_TAB_NAME
} from '$env/static/private';

const CONFIG_TAB = 'Config';
const TRANSACTIONS_TAB = GOOGLE_SHEET_TAB_NAME || 'Transactions';

function getAuthClient() {
	return new google.auth.JWT({
		email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
		key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
		scopes: ['https://www.googleapis.com/auth/spreadsheets']
	});
}

function getSheetsClient() {
	return google.sheets({ version: 'v4', auth: getAuthClient() });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

const SHEET_COLUMNS = ['id', 'tanggal', 'tipe', 'kategori', 'nominal', 'user', 'catatan'] as const;

export type TransactionEntry = {
	id: string;
	tanggal: string;
	tipe: 'Income' | 'Expense';
	kategori: string;
	nominal: number;
	user: string;
	catatan: string;
};

import type { Transaction } from '$lib/types/transaction';

export async function getSheetData(): Promise<Transaction[]> {
	const sheets = getSheetsClient();

	const response = await sheets.spreadsheets.values.get({
		spreadsheetId: GOOGLE_SHEET_ID,
		range: `${TRANSACTIONS_TAB}!A1:G`
	});

	const rows = response.data.values;
	if (!rows || rows.length === 0) return [];

	// Auto-detect header row
	const HEADER_INDICATORS = ['id', 'ID', 'Tanggal', 'tanggal'];
	const hasHeader = HEADER_INDICATORS.some(
		(h) =>
			String(rows[0]?.[0] ?? '').toLowerCase() === h.toLowerCase() ||
			String(rows[0]?.[1] ?? '').toLowerCase() === 'tanggal'
	);
	const dataRows = hasHeader ? rows.slice(1) : rows;

	return dataRows
		.filter((row) => row.length > 0 && row[0])
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

export async function appendRow(transaction: Transaction): Promise<void> {
	const sheets = getSheetsClient();

	const values = SHEET_COLUMNS.map((col) => {
		const val = transaction[col];
		return val !== undefined && val !== null ? String(val) : '';
	});

	await sheets.spreadsheets.values.append({
		spreadsheetId: GOOGLE_SHEET_ID,
		range: `${TRANSACTIONS_TAB}!A:G`,
		valueInputOption: 'USER_ENTERED',
		requestBody: { values: [values] }
	});
}

// ─── Config (Users & Categories) ─────────────────────────────────────────────

export interface AppConfig {
	users: string[];
	expenseCategories: string[];
	incomeCategories: string[];
}

const DEFAULT_CONFIG: AppConfig = {
	users: ['Papa', 'Mama', 'Ara'],
	expenseCategories: ['Makan', 'Transportasi', 'Jajan', 'Belanja', 'Pendidikan', 'Lain'],
	incomeCategories: ['Gaji', 'Bonus', 'Freelance', 'Lain']
};

/**
 * Read users & categories from the "Config" tab.
 * Falls back to DEFAULT_CONFIG if tab doesn't exist or is empty.
 */
export async function getConfig(): Promise<AppConfig> {
	const sheets = getSheetsClient();

	try {
		const res = await sheets.spreadsheets.values.get({
			spreadsheetId: GOOGLE_SHEET_ID,
			range: `${CONFIG_TAB}!A1:E50`
		});

		const rows = res.data.values ?? [];
		if (rows.length === 0) return DEFAULT_CONFIG;

		// Column A: Users (row 0 = header "Users", rows 1+ = values)
		const users = rows
			.slice(1)
			.map((r) => String(r[0] ?? '').trim())
			.filter((v) => v && v.toLowerCase() !== 'users');

		// Column C: Expense Categories
		const expenseCategories = rows
			.slice(1)
			.map((r) => String(r[2] ?? '').trim())
			.filter((v) => v && v.toLowerCase() !== 'expense categories');

		// Column E: Income Categories
		const incomeCategories = rows
			.slice(1)
			.map((r) => String(r[4] ?? '').trim())
			.filter((v) => v && v.toLowerCase() !== 'income categories');

		return {
			users: users.length > 0 ? users : DEFAULT_CONFIG.users,
			expenseCategories: expenseCategories.length > 0 ? expenseCategories : DEFAULT_CONFIG.expenseCategories,
			incomeCategories: incomeCategories.length > 0 ? incomeCategories : DEFAULT_CONFIG.incomeCategories
		};
	} catch {
		return DEFAULT_CONFIG;
	}
}

/**
 * Write the full config back to the "Config" tab.
 */
export async function saveConfig(config: AppConfig): Promise<void> {
	const sheets = getSheetsClient();

	const maxRows = Math.max(config.users.length, config.expenseCategories.length, config.incomeCategories.length);

	// Build column arrays (header + values)
	const userCol = ['Users', ...config.users];
	const expenseCol = ['Expense Categories', ...config.expenseCategories];
	const incomeCol = ['Income Categories', ...config.incomeCategories];

	// Pad to same length
	while (userCol.length <= maxRows) userCol.push('');
	while (expenseCol.length <= maxRows) expenseCol.push('');
	while (incomeCol.length <= maxRows) incomeCol.push('');

	// Build rows: each row is [user, '', expCat, '', incCat]
	const rows = Array.from({ length: maxRows + 1 }, (_, i) => [
		userCol[i] ?? '',
		'',
		expenseCol[i] ?? '',
		'',
		incomeCol[i] ?? ''
	]);

	// Clear existing data first
	await sheets.spreadsheets.values.clear({
		spreadsheetId: GOOGLE_SHEET_ID,
		range: `${CONFIG_TAB}!A1:E100`
	});

	await sheets.spreadsheets.values.update({
		spreadsheetId: GOOGLE_SHEET_ID,
		range: `${CONFIG_TAB}!A1:E${rows.length}`,
		valueInputOption: 'RAW',
		requestBody: { values: rows }
	});
}

export async function seedHeaders(): Promise<void> {
	const sheets = getSheetsClient();
	const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Nominal', 'User', 'Catatan'];

	await sheets.spreadsheets.values.update({
		spreadsheetId: GOOGLE_SHEET_ID,
		range: `${TRANSACTIONS_TAB}!A1:G1`,
		valueInputOption: 'RAW',
		requestBody: { values: [headers] }
	});
}
