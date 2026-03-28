import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConfig, saveConfig } from '$lib/utils/sheets';

// GET /api/config → returns { users, expenseCategories, incomeCategories }
export const GET: RequestHandler = async () => {
	try {
		const config = await getConfig();
		return json(config);
	} catch (err) {
		console.error('[GET /api/config]', err);
		return json({ error: 'Gagal memuat konfigurasi' }, { status: 500 });
	}
};

// PUT /api/config → saves { users, expenseCategories, incomeCategories }
export const PUT: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Validate
		if (!Array.isArray(body.users) || !Array.isArray(body.expenseCategories) || !Array.isArray(body.incomeCategories)) {
			return json({ success: false, error: 'Format data tidak valid' }, { status: 400 });
		}

		const clean = {
			users: body.users.map((u: string) => String(u).trim()).filter(Boolean),
			expenseCategories: body.expenseCategories.map((c: string) => String(c).trim()).filter(Boolean),
			incomeCategories: body.incomeCategories.map((c: string) => String(c).trim()).filter(Boolean)
		};

		if (clean.users.length === 0) return json({ success: false, error: 'Minimal 1 user diperlukan' }, { status: 400 });
		if (clean.expenseCategories.length === 0) return json({ success: false, error: 'Minimal 1 kategori pengeluaran diperlukan' }, { status: 400 });
		if (clean.incomeCategories.length === 0) return json({ success: false, error: 'Minimal 1 kategori pemasukan diperlukan' }, { status: 400 });

		await saveConfig(clean);
		return json({ success: true });
	} catch (err) {
		console.error('[PUT /api/config]', err);
		return json({ success: false, error: 'Gagal menyimpan konfigurasi' }, { status: 500 });
	}
};
