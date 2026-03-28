import { VALID_USERS } from '$lib/types/transaction';
import type { TransactionInput } from '$lib/types/transaction';

export interface ValidationResult {
	valid: boolean;
	error?: string;
}

/**
 * Validate a transaction input payload from the POST /api/transactions request.
 */
export function validateTransaction(body: Partial<TransactionInput>): ValidationResult {
	if (!body.tanggal || typeof body.tanggal !== 'string') {
		return { valid: false, error: "Field 'tanggal' wajib diisi" };
	}

	// Validate date format YYYY-MM-DD
	const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
	if (!dateRegex.test(body.tanggal)) {
		return { valid: false, error: "Format 'tanggal' harus YYYY-MM-DD" };
	}

	// Date must not be in the future
	const today = new Date().toISOString().split('T')[0];
	if (body.tanggal > today) {
		return { valid: false, error: "Tanggal tidak boleh lebih dari hari ini" };
	}

	if (!body.tipe) {
		return { valid: false, error: "Field 'tipe' wajib diisi" };
	}

	if (body.tipe !== 'Income' && body.tipe !== 'Expense') {
		return { valid: false, error: "Field 'tipe' harus 'Income' atau 'Expense'" };
	}

	if (!body.kategori || typeof body.kategori !== 'string' || body.kategori.trim() === '') {
		return { valid: false, error: "Field 'kategori' wajib diisi" };
	}

	if (body.nominal === undefined || body.nominal === null) {
		return { valid: false, error: "Field 'nominal' wajib diisi" };
	}

	const nominal = Number(body.nominal);
	if (isNaN(nominal) || nominal < 1) {
		return { valid: false, error: "Field 'nominal' harus berupa angka positif minimal 1" };
	}

	if (!body.user || typeof body.user !== 'string') {
		return { valid: false, error: "Field 'user' wajib diisi" };
	}

	if (!(VALID_USERS as string[]).includes(body.user)) {
		return {
			valid: false,
			error: `Field 'user' harus salah satu dari: ${VALID_USERS.join(', ')}`
		};
	}

	if (body.catatan && body.catatan.length > 200) {
		return { valid: false, error: "Field 'catatan' maksimal 200 karakter" };
	}

	return { valid: true };
}
