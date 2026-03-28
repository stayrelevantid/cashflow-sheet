#!/usr/bin/env node
/**
 * seed-headers.mjs
 *
 * Run this script ONCE during initial project setup to create the header row
 * in the Google Sheet's Transactions tab.
 *
 * Usage:
 *   node scripts/seed-headers.mjs
 *
 * Requirements:
 *   - .env file must be populated with GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL,
 *     and GOOGLE_PRIVATE_KEY.
 */

import { readFileSync } from 'fs';
import { google } from 'googleapis';

// Load .env manually (no dotenv import needed in newer Node versions if NODE_OPTIONS=--env-file)
const envPath = new URL('../.env', import.meta.url).pathname;
let env = {};
try {
	const raw = readFileSync(envPath, 'utf-8');
	for (const line of raw.split('\n')) {
		const [key, ...rest] = line.split('=');
		if (key && !key.startsWith('#')) {
			env[key.trim()] = rest.join('=').trim();
		}
	}
} catch {
	console.error('❌ .env file not found. Copy .env.example to .env and fill in your credentials.');
	process.exit(1);
}

const GOOGLE_SHEET_ID = env['GOOGLE_SHEET_ID'];
const GOOGLE_SERVICE_ACCOUNT_EMAIL = env['GOOGLE_SERVICE_ACCOUNT_EMAIL'];
const GOOGLE_PRIVATE_KEY = (env['GOOGLE_PRIVATE_KEY'] ?? '').replace(/\\n/g, '\n').replace(/^"|"$/g, '');
const GOOGLE_SHEET_TAB_NAME = env['GOOGLE_SHEET_TAB_NAME'] || 'Transactions';

if (!GOOGLE_SHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
	console.error('❌ Missing Google credentials in .env');
	process.exit(1);
}

const auth = new google.auth.JWT({
	email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
	key: GOOGLE_PRIVATE_KEY,
	scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Nominal', 'User', 'Catatan'];

try {
	await sheets.spreadsheets.values.update({
		spreadsheetId: GOOGLE_SHEET_ID,
		range: `${GOOGLE_SHEET_TAB_NAME}!A1:G1`,
		valueInputOption: 'RAW',
		requestBody: { values: [headers] },
	});
	console.log(`✅ Header row seeded to tab "${GOOGLE_SHEET_TAB_NAME}"`);
	console.log('   Columns:', headers.join(' | '));
} catch (err) {
	console.error('❌ Failed to seed headers:', err.message);
	process.exit(1);
}
