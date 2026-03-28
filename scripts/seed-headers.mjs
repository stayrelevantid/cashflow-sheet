#!/usr/bin/env node
/**
 * seed-headers.mjs
 *
 * Setup Google Sheet untuk Family CashFlow-Sheet:
 * 1. Buat/update tab "Transactions" dengan header row berformat
 * 2. Buat/update tab "Config" dengan default Users & Categories
 *
 * Usage:
 *   node scripts/seed-headers.mjs
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
		if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
		env[k] = v;
	}
} catch {
	console.error('❌ .env file not found.');
	process.exit(1);
}

const SHEET_ID = env['GOOGLE_SHEET_ID'];
const SA_EMAIL = env['GOOGLE_SERVICE_ACCOUNT_EMAIL'];
const PRIVATE_KEY = (env['GOOGLE_PRIVATE_KEY'] ?? '').replace(/\\n/g, '\n');
const TRANSACTIONS_TAB = env['GOOGLE_SHEET_TAB_NAME'] || 'Transactions';
const CONFIG_TAB = 'Config';

if (!SHEET_ID || !SA_EMAIL || !PRIVATE_KEY) { console.error('❌ Missing credentials'); process.exit(1); }

const auth = new google.auth.JWT({ email: SA_EMAIL, key: PRIVATE_KEY, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
const sheets = google.sheets({ version: 'v4', auth });

// ─── Helpers ─────────────────────────────────────────────────────────────────
const LIGHT_WHITE    = { red: 1,     green: 1,     blue: 1     }; // #FFFFFF
const LIGHT_GRAY     = { red: 0.973, green: 0.976, blue: 0.984 }; // #F8F9FB
const HEADER_BG      = { red: 0.239, green: 0.305, blue: 0.533 }; // #3D4E88 — indigo
const HEADER_TEXT    = { red: 1,     green: 1,     blue: 1     };
const HEADER_BORDER  = { red: 0.161, green: 0.204, blue: 0.42  }; // darker indigo

// ─── Get or create sheet tab ──────────────────────────────────────────────────
async function getOrCreateTab(tabName) {
	const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
	const existing = meta.data.sheets?.find(s => s.properties?.title === tabName);
	if (existing) {
		console.log(`📋 Tab "${tabName}" found (sheetId: ${existing.properties.sheetId})`);
		return existing.properties.sheetId;
	}
	// Create tab
	const res = await sheets.spreadsheets.batchUpdate({
		spreadsheetId: SHEET_ID,
		requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] }
	});
	const newId = res.data.replies?.[0]?.addSheet?.properties?.sheetId;
	console.log(`✨ Tab "${tabName}" created (sheetId: ${newId})`);
	return newId;
}

// ─── Format header row ────────────────────────────────────────────────────────
async function formatHeader(sheetTabId, colCount, colWidths) {
	const requests = [
		// Bold, bg, text color, center, padding
		{
			repeatCell: {
				range: { sheetId: sheetTabId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: colCount },
				cell: {
					userEnteredFormat: {
						backgroundColor: HEADER_BG,
						textFormat: { foregroundColor: HEADER_TEXT, bold: true, fontSize: 11 },
						horizontalAlignment: 'CENTER',
						verticalAlignment: 'MIDDLE',
						padding: { top: 8, bottom: 8, left: 8, right: 8 },
					},
				},
				fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,padding)',
			},
		},
		// Freeze row 1
		{ updateSheetProperties: { properties: { sheetId: sheetTabId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
		// Column widths
		...colWidths.map((pixelSize, columnIndex) => ({
			updateDimensionProperties: {
				range: { sheetId: sheetTabId, dimension: 'COLUMNS', startIndex: columnIndex, endIndex: columnIndex + 1 },
				properties: { pixelSize },
				fields: 'pixelSize',
			},
		})),
		// Header row height 42px
		{ updateDimensionProperties: { range: { sheetId: sheetTabId, dimension: 'ROWS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 42 }, fields: 'pixelSize' } },
		// Bottom border on header
		{
			updateBorders: {
				range: { sheetId: sheetTabId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: colCount },
				bottom: { style: 'SOLID_MEDIUM', color: HEADER_BORDER },
			},
		},
	];

	// Alternating LIGHT row bands for data rows
	try {
		await sheets.spreadsheets.batchUpdate({
			spreadsheetId: SHEET_ID,
			requestBody: { requests: [{ deleteBanding: { bandedRangeId: sheetTabId + 1 } }] }
		});
	} catch { /* ignore if banding doesn't exist */ }

	requests.push({
		addBanding: {
			bandedRange: {
				range: { sheetId: sheetTabId, startRowIndex: 1, endRowIndex: 2000, startColumnIndex: 0, endColumnIndex: colCount },
				rowProperties: {
					firstBandColor:  LIGHT_WHITE,
					secondBandColor: LIGHT_GRAY,
				},
			},
		},
	});

	await sheets.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests } });
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 1: Transactions tab
// ════════════════════════════════════════════════════════════════════════════
console.log('\n📄 Setting up Transactions tab...');
const TXN_HEADERS   = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Nominal', 'User', 'Catatan'];
const TXN_WIDTHS    = [260, 110, 100, 120, 130, 90, 280];

const txnTabId = await getOrCreateTab(TRANSACTIONS_TAB);

await sheets.spreadsheets.values.update({
	spreadsheetId: SHEET_ID,
	range: `${TRANSACTIONS_TAB}!A1:G1`,
	valueInputOption: 'RAW',
	requestBody: { values: [TXN_HEADERS] },
});

await formatHeader(txnTabId, 7, TXN_WIDTHS);
console.log('✅ Transactions tab ready:', TXN_HEADERS.join(' | '));

// ════════════════════════════════════════════════════════════════════════════
// STEP 2: Config tab
// ════════════════════════════════════════════════════════════════════════════
console.log('\n⚙️  Setting up Config tab...');
const configTabId = await getOrCreateTab(CONFIG_TAB);

// Check if Config already has data (don't overwrite)
const existingConfig = await sheets.spreadsheets.values.get({
	spreadsheetId: SHEET_ID,
	range: `${CONFIG_TAB}!A1:G20`,
});
const hasData = existingConfig.data.values && existingConfig.data.values.length > 0;

if (!hasData) {
	// Write default config data
	await sheets.spreadsheets.values.batchUpdate({
		spreadsheetId: SHEET_ID,
		requestBody: {
			valueInputOption: 'RAW',
			data: [
				// Column A: Users
				{ range: `${CONFIG_TAB}!A1:A4`, values: [['Users'], ['Papa'], ['Mama'], ['Ara']] },
				// Column C: Expense Categories
				{ range: `${CONFIG_TAB}!C1:C7`, values: [['Expense Categories'], ['Makan'], ['Transportasi'], ['Jajan'], ['Belanja'], ['Pendidikan'], ['Lain']] },
				// Column E: Income Categories
				{ range: `${CONFIG_TAB}!E1:E5`, values: [['Income Categories'], ['Gaji'], ['Bonus'], ['Freelance'], ['Lain']] },
			],
		},
	});
	console.log('✅ Default config data written');
} else {
	console.log('ℹ️  Config tab already has data — skipping default data write');
}

// Format Config tab headers (row 1: Users, Expense Categories, Income Categories)
const configFormatRequests = [
	{
		repeatCell: {
			range: { sheetId: configTabId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 6 },
			cell: {
				userEnteredFormat: {
					backgroundColor: HEADER_BG,
					textFormat: { foregroundColor: HEADER_TEXT, bold: true, fontSize: 11 },
					horizontalAlignment: 'CENTER',
					verticalAlignment: 'MIDDLE',
				},
			},
			fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
		},
	},
	// Column widths for Config
	...[180, 20, 220, 20, 220].map((pixelSize, columnIndex) => ({
		updateDimensionProperties: {
			range: { sheetId: configTabId, dimension: 'COLUMNS', startIndex: columnIndex, endIndex: columnIndex + 1 },
			properties: { pixelSize },
			fields: 'pixelSize',
		},
	})),
	{ updateSheetProperties: { properties: { sheetId: configTabId, gridProperties: { frozenRowCount: 1 } }, fields: 'gridProperties.frozenRowCount' } },
];

await sheets.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests: configFormatRequests } });
console.log('✅ Config tab formatted');

console.log('\n🎉 Sheet setup complete!');
console.log('   Edit the Config tab directly in Google Sheets to add/remove users & categories,');
console.log('   or use the Settings panel in the app dashboard.');
