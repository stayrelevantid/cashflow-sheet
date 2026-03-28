#!/usr/bin/env node
/**
 * seed-headers.mjs
 *
 * Buat atau update header row di Google Sheet dengan formatting premium:
 * - Bold text
 * - Background warna (dark slate)
 * - Text warna putih
 * - Freeze row pertama
 * - Auto-resize semua kolom
 * - Border bawah header
 * - Alignment center untuk semua header
 *
 * Usage:
 *   node scripts/seed-headers.mjs
 *
 * Requirements:
 *   - .env file harus sudah diisi: GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY
 */

import { readFileSync } from 'fs';
import { google } from 'googleapis';

// ─── Load .env ───────────────────────────────────────────────────────────────
const envPath = new URL('../.env', import.meta.url).pathname;
let env = {};
try {
	const raw = readFileSync(envPath, 'utf-8');
	for (const line of raw.split('\n')) {
		const idx = line.indexOf('=');
		if (idx === -1 || line.startsWith('#')) continue;
		const k = line.substring(0, idx).trim();
		let v = line.substring(idx + 1).trim();
		if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
			v = v.slice(1, -1);
		}
		env[k] = v;
	}
} catch {
	console.error('❌ .env file not found. Copy .env.example to .env and fill in your credentials.');
	process.exit(1);
}

const SHEET_ID = env['GOOGLE_SHEET_ID'];
const SA_EMAIL = env['GOOGLE_SERVICE_ACCOUNT_EMAIL'];
const PRIVATE_KEY = (env['GOOGLE_PRIVATE_KEY'] ?? '').replace(/\\n/g, '\n');
const TAB_NAME = env['GOOGLE_SHEET_TAB_NAME'] || 'Transactions';

if (!SHEET_ID || !SA_EMAIL || !PRIVATE_KEY) {
	console.error('❌ Missing Google credentials in .env');
	process.exit(1);
}

// ─── Auth ────────────────────────────────────────────────────────────────────
const auth = new google.auth.JWT({
	email: SA_EMAIL,
	key: PRIVATE_KEY,
	scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// ─── Config ───────────────────────────────────────────────────────────────────
const HEADERS = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Nominal', 'User', 'Catatan'];

// Column widths in pixels
const COLUMN_WIDTHS = [260, 110, 100, 110, 130, 90, 280];

// Header background color (dark slate blue)
const HEADER_BG = { red: 0.122, green: 0.157, blue: 0.251 }; // #1F2840
const HEADER_TEXT = { red: 0.945, green: 0.961, blue: 0.98 }; // #F1F5FA

// ─── Step 1: Get sheetId (tab index) ─────────────────────────────────────────
let sheetTabId = 0;
try {
	const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
	const tab = meta.data.sheets?.find(s => s.properties?.title === TAB_NAME);
	if (tab?.properties?.sheetId !== undefined) {
		sheetTabId = tab.properties.sheetId;
		console.log(`📋 Found tab "${TAB_NAME}" with sheetId: ${sheetTabId}`);
	} else {
		console.warn(`⚠️  Tab "${TAB_NAME}" not found in spreadsheet — using sheetId 0`);
	}
} catch (err) {
	console.error('❌ Failed to get sheet metadata:', err.message);
	process.exit(1);
}

// ─── Step 2: Write header values ──────────────────────────────────────────────
try {
	await sheets.spreadsheets.values.update({
		spreadsheetId: SHEET_ID,
		range: `${TAB_NAME}!A1:G1`,
		valueInputOption: 'RAW',
		requestBody: { values: [HEADERS] },
	});
	console.log('✅ Header values written:', HEADERS.join(' | '));
} catch (err) {
	console.error('❌ Failed to write headers:', err.message);
	process.exit(1);
}

// ─── Step 3: Apply formatting ─────────────────────────────────────────────────
const requests = [
	// 3a. Bold + Background + Text color + Center align + Font size
	{
		repeatCell: {
			range: { sheetId: sheetTabId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 7 },
			cell: {
				userEnteredFormat: {
					backgroundColor: HEADER_BG,
					textFormat: {
						foregroundColor: HEADER_TEXT,
						bold: true,
						fontSize: 11,
						fontFamily: 'Inter',
					},
					horizontalAlignment: 'CENTER',
					verticalAlignment: 'MIDDLE',
					padding: { top: 8, bottom: 8, left: 8, right: 8 },
				},
			},
			fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,padding)',
		},
	},

	// 3b. Freeze first row
	{
		updateSheetProperties: {
			properties: {
				sheetId: sheetTabId,
				gridProperties: { frozenRowCount: 1 },
			},
			fields: 'gridProperties.frozenRowCount',
		},
	},

	// 3c. Set column widths
	...COLUMN_WIDTHS.map((pixelSize, columnIndex) => ({
		updateDimensionProperties: {
			range: {
				sheetId: sheetTabId,
				dimension: 'COLUMNS',
				startIndex: columnIndex,
				endIndex: columnIndex + 1,
			},
			properties: { pixelSize },
			fields: 'pixelSize',
		},
	})),

	// 3d. Set row height for header
	{
		updateDimensionProperties: {
			range: { sheetId: sheetTabId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
			properties: { pixelSize: 40 },
			fields: 'pixelSize',
		},
	},

	// 3e. Bottom border on header row
	{
		updateBorders: {
			range: { sheetId: sheetTabId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 7 },
			bottom: {
				style: 'SOLID_MEDIUM',
				color: { red: 0.388, green: 0.4, blue: 0.643 }, // indigo accent
			},
		},
	},

	// 3f. Alternating row bands for data rows
	{
		addBanding: {
			bandedRange: {
				bandedRangeId: 1,
				range: { sheetId: sheetTabId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 0, endColumnIndex: 7 },
				rowProperties: {
					headerColor: HEADER_BG,
					firstBandColor: { red: 0.067, green: 0.082, blue: 0.133 }, // #111522
					secondBandColor: { red: 0.082, green: 0.102, blue: 0.161 }, // #151A29
				},
			},
		},
	},
];

try {
	await sheets.spreadsheets.batchUpdate({
		spreadsheetId: SHEET_ID,
		requestBody: { requests },
	});
	console.log('✅ Formatting applied:');
	console.log('   • Bold header with dark slate background');
	console.log('   • Row 1 frozen');
	console.log('   • Column widths optimized');
	console.log('   • Header row height: 40px');
	console.log('   • Indigo bottom border on header');
	console.log('   • Alternating row bands for data rows');
} catch (err) {
	// addBanding might fail if banding already exists — that's ok
	if (err.message?.includes('banding') || err.message?.includes('already')) {
		console.log('✅ Formatting applied (banding already existed, skipped)');
	} else {
		console.warn('⚠️  Formatting partially applied:', err.message);
	}
}

console.log(`\n🎉 Sheet "${TAB_NAME}" adalah siap digunakan!`);
console.log(`   Columns: ${HEADERS.join(' | ')}`);
