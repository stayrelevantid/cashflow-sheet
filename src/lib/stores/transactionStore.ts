import { writable, derived } from 'svelte/store';
import type { Transaction, Summary } from '$lib/types/transaction';

// ─── Period Mode ──────────────────────────────────────────────────────────────
export type PeriodMode = 'bulan_ini' | 'bulan_lalu' | 'tahun_ini' | 'pilih_tahun' | 'pilih_bulan';

const now = new Date();

export const periodMode = writable<PeriodMode>('bulan_ini');
export const selectedYear = writable<number>(now.getFullYear());
export const selectedMonth = writable<number>(now.getMonth() + 1); // 1-12

/** Compute API query params from the current period mode + year/month */
export function buildPeriodParams(
	mode: PeriodMode,
	year: number,
	month: number
): Record<string, string> {
	const n = new Date();
	switch (mode) {
		case 'bulan_ini':
			return { year: String(n.getFullYear()), month: String(n.getMonth() + 1) };
		case 'bulan_lalu': {
			const prevMonth = n.getMonth() === 0 ? 12 : n.getMonth();
			const prevYear = n.getMonth() === 0 ? n.getFullYear() - 1 : n.getFullYear();
			return { year: String(prevYear), month: String(prevMonth) };
		}
		case 'tahun_ini':
			return { year: String(n.getFullYear()) };
		case 'pilih_tahun':
			return { year: String(year) };
		case 'pilih_bulan':
			return { year: String(year), month: String(month) };
		default:
			return {};
	}
}

/** Human-readable label for the active period */
export const MONTHS_ID = [
	'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
	'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// ─── State ────────────────────────────────────────────────────────────────────
export const transactions = writable<Transaction[]>([]);
export const summary = writable<Summary>({
	totalIncome: 0, totalExpense: 0, balance: 0, byCategory: {}, byUser: {}
});
export const loading = writable(false);
export const error = writable<string | null>(null);

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function fetchTransactions(
	user: string,
	mode: PeriodMode,
	year: number,
	month: number
) {
	loading.set(true);
	error.set(null);
	try {
		const params = new URLSearchParams();
		if (user !== 'Global') params.set('user', user);

		const periodParams = buildPeriodParams(mode, year, month);
		for (const [k, v] of Object.entries(periodParams)) params.set(k, v);

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

export async function fetchSummary(
	user: string,
	mode: PeriodMode,
	year: number,
	month: number
) {
	try {
		const params = new URLSearchParams();
		if (user !== 'Global') params.set('user', user);

		const periodParams = buildPeriodParams(mode, year, month);
		for (const [k, v] of Object.entries(periodParams)) params.set(k, v);

		const res = await fetch(`/api/summary?${params}`);
		const data = await res.json();
		if (res.ok) summary.set(data);
	} catch {
		// Silent fail
	}
}

export async function refreshAll(
	user: string,
	mode: PeriodMode,
	year: number,
	month: number
) {
	await Promise.all([
		fetchTransactions(user, mode, year, month),
		fetchSummary(user, mode, year, month)
	]);
}
