import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSheetData } from '$lib/utils/sheets';
import type { Summary } from '$lib/types/transaction';

// GET /api/summary
// Query: user, year, month (all optional — if none, returns all-time summary)
export const GET: RequestHandler = async ({ url }) => {
	try {
		const paramUser = url.searchParams.get('user');
		const paramYear = url.searchParams.get('year');
		const paramMonth = url.searchParams.get('month');

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
			// month only (unlikely but safe) — filter by current year
			const yr = new Date().getFullYear();
			const prefix = `${yr}-${String(Number(paramMonth)).padStart(2, '0')}`;
			data = data.filter((t) => t.tanggal.startsWith(prefix));
		}

		// Calculate summary
		let totalIncome = 0;
		let totalExpense = 0;
		const byCategory: Record<string, number> = {};
		const byUser: Record<string, number> = {};

		for (const t of data) {
			if (t.tipe === 'Income') {
				totalIncome += t.nominal;
			} else {
				totalExpense += t.nominal;
				byCategory[t.kategori] = (byCategory[t.kategori] ?? 0) + t.nominal;
			}
			if (t.tipe === 'Expense') {
				byUser[t.user] = (byUser[t.user] ?? 0) + t.nominal;
			}
		}

		const summary: Summary = {
			totalIncome,
			totalExpense,
			balance: totalIncome - totalExpense,
			byCategory,
			byUser
		};

		return json(summary);
	} catch (err) {
		console.error('[GET /api/summary]', err);
		return json({ error: 'Gagal menghitung summary' }, { status: 500 });
	}
};
