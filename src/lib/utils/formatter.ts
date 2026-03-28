/**
 * Format a number to Indonesian Rupiah currency string.
 * @example formatRupiah(50000) → "Rp 50.000"
 */
export function formatRupiah(amount: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}

/**
 * Format an ISO date string (YYYY-MM-DD) to a localized display string.
 * @example formatDate("2026-03-28") → "28 Maret 2026"
 */
export function formatDate(isoDate: string): string {
	const [year, month, day] = isoDate.split('-').map(Number);
	const date = new Date(year, month - 1, day);
	return date.toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

/**
 * Get today's date as ISO string (YYYY-MM-DD).
 */
export function todayISO(): string {
	return new Date().toISOString().split('T')[0];
}

/**
 * Get current month as YYYY-MM string.
 * @example getCurrentMonth() → "2026-03"
 */
export function getCurrentMonth(): string {
	return new Date().toISOString().substring(0, 7);
}

/**
 * Get current year as string.
 */
export function getCurrentYear(): string {
	return new Date().getFullYear().toString();
}
