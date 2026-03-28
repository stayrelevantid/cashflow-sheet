import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSheetData } from '$lib/utils/sheets';
import type { Summary } from '$lib/types/transaction';

// ─── GET /api/summary ────────────────────────────────────────────────────────
// Query params: user (string), period ("month" | "year" | "all")
export const GET: RequestHandler = async ({ url }) => {
	try {
		const paramUser = url.searchParams.get('user');
		const paramPeriod = url.searchParams.get('period') ?? 'month'; // default: bulan ini

		let data = await getSheetData();

		// Filter by user
		if (paramUser && paramUser !== 'Global') {
			data = data.filter((t) => t.user === paramUser);
		}

		// Filter by period
		if (paramPeriod === 'month') {
			const currentMonth = new Date().toISOString().substring(0, 7); // "YYYY-MM"
			data = data.filter((t) => t.tanggal.startsWith(currentMonth));
		} else if (paramPeriod === 'year') {
			const currentYear = new Date().getFullYear().toString();
			data = data.filter((t) => t.tanggal.startsWith(currentYear));
		}
		// "all" — no date filter

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
				// byCategory: group expense by category
				byCategory[t.kategori] = (byCategory[t.kategori] ?? 0) + t.nominal;
			}

			// byUser: group expense by user
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
		console.error('[GET /api/summary] Error:', err);
		return json({ error: 'Gagal menghitung summary' }, { status: 500 });
	}
};
