import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSheetData, appendRow } from '$lib/utils/sheets';
import { validateTransaction } from '$lib/utils/validator';
import { generateId } from '$lib/utils/uuid';
import type { Transaction } from '$lib/types/transaction';

// ─── GET /api/transactions ───────────────────────────────────────────────────
// Query params: user, month (YYYY-MM), year (YYYY), type (Income|Expense)
export const GET: RequestHandler = async ({ url }) => {
	try {
		const paramUser = url.searchParams.get('user');
		const paramYear = url.searchParams.get('year');
		const paramMonth = url.searchParams.get('month');
		const paramType = url.searchParams.get('type');

		let data = await getSheetData();

		// Filter by user
		if (paramUser && paramUser !== 'Global') {
			data = data.filter((t) => t.user === paramUser);
		}

		// Filter by year
		if (paramYear) {
			data = data.filter((t) => t.tanggal.startsWith(paramYear));
		}

		// Filter by month (requires year too for YYYY-MM match)
		if (paramYear && paramMonth) {
			const prefix = `${paramYear}-${String(Number(paramMonth)).padStart(2, '0')}`;
			data = data.filter((t) => t.tanggal.startsWith(prefix));
		} else if (!paramYear && paramMonth) {
			const yr = new Date().getFullYear();
			const prefix = `${yr}-${String(Number(paramMonth)).padStart(2, '0')}`;
			data = data.filter((t) => t.tanggal.startsWith(prefix));
		}

		// Filter by transaction type
		if (paramType === 'Income' || paramType === 'Expense') {
			data = data.filter((t) => t.tipe === paramType);
		}

		return json({ data, total: data.length });
	} catch (err) {
		console.error('[GET /api/transactions] Error:', err);
		return json({ error: 'Gagal mengambil data transaksi' }, { status: 500 });
	}
};

// ─── POST /api/transactions ──────────────────────────────────────────────────
// Body: { tanggal, tipe, kategori, nominal, user, catatan? }
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const validation = validateTransaction(body);
		if (!validation.valid) {
			return json({ success: false, error: validation.error }, { status: 400 });
		}

		const transaction: Transaction = {
			id: generateId(),
			tanggal: body.tanggal,
			tipe: body.tipe,
			kategori: body.kategori.trim(),
			nominal: Number(body.nominal),
			user: body.user,
			catatan: body.catatan?.trim() ?? ''
		};

		await appendRow(transaction);

		return json({ success: true, id: transaction.id }, { status: 201 });
	} catch (err) {
		console.error('[POST /api/transactions] Error:', err);
		return json({ success: false, error: 'Gagal menyimpan transaksi' }, { status: 500 });
	}
};
