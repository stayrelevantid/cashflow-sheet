import { writable } from 'svelte/store';
import type { Transaction, Summary } from '$lib/types/transaction';

export type Period = 'month' | 'year' | 'all';

// ─── State ────────────────────────────────────────────────────────────────────
export const transactions = writable<Transaction[]>([]);
export const summary = writable<Summary>({
	totalIncome: 0,
	totalExpense: 0,
	balance: 0,
	byCategory: {},
	byUser: {}
});
export const loading = writable(false);
export const error = writable<string | null>(null);
export const period = writable<Period>('month');

// ─── Actions ──────────────────────────────────────────────────────────────────

/** Fetch all transactions with optional user + period filters */
export async function fetchTransactions(user: string, p: Period) {
	loading.set(true);
	error.set(null);
	try {
		const params = new URLSearchParams();
		if (user !== 'Global') params.set('user', user);

		if (p === 'month') {
			const now = new Date();
			params.set('month', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
		} else if (p === 'year') {
			params.set('year', String(new Date().getFullYear()));
		}

		const res = await fetch(`/api/transactions?${params}`);
		const data = await res.json();

		if (!res.ok) throw new Error(data.error ?? 'Gagal memuat data');
		transactions.set(data.data ?? []);
	} catch (e) {
		error.set(e instanceof Error ? e.message : 'Error tidak diketahui');
		transactions.set([]);
	} finally {
		loading.set(false);
	}
}

/** Fetch summary with optional user + period filters */
export async function fetchSummary(user: string, p: Period) {
	try {
		const params = new URLSearchParams({ period: p });
		if (user !== 'Global') params.set('user', user);

		const res = await fetch(`/api/summary?${params}`);
		const data = await res.json();
		if (res.ok) summary.set(data);
	} catch {
		// Silent fail — summary is supplementary
	}
}

/** Fetch both transactions and summary at once */
export async function refreshAll(user: string, p: Period) {
	await Promise.all([fetchTransactions(user, p), fetchSummary(user, p)]);
}
