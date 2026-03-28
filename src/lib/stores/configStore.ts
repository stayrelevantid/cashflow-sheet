import { writable } from 'svelte/store';

export interface AppConfig {
	users: string[];
	expenseCategories: string[];
	incomeCategories: string[];
}

const DEFAULT: AppConfig = {
	users: ['Papa', 'Mama', 'Ara'],
	expenseCategories: ['Makan', 'Transportasi', 'Jajan', 'Belanja', 'Pendidikan', 'Lain'],
	incomeCategories: ['Gaji', 'Bonus', 'Freelance', 'Lain']
};

export const config = writable<AppConfig>(DEFAULT);
export const configLoading = writable(false);
export const configError = writable<string | null>(null);

/** Fetch config from API and update the store */
export async function fetchConfig(): Promise<void> {
	configLoading.set(true);
	configError.set(null);
	try {
		const res = await fetch('/api/config');
		if (!res.ok) throw new Error('Gagal memuat konfigurasi');
		const data: AppConfig = await res.json();
		if (data.users && data.expenseCategories && data.incomeCategories) {
			config.set(data);
		}
	} catch (e) {
		configError.set(e instanceof Error ? e.message : 'Error');
		config.set(DEFAULT); // fallback
	} finally {
		configLoading.set(false);
	}
}

/** Save config to API and update the store */
export async function saveConfig(updated: AppConfig): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch('/api/config', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updated)
		});
		const data = await res.json();
		if (data.success) {
			config.set(updated);
			return { success: true };
		}
		return { success: false, error: data.error };
	} catch (e) {
		return { success: false, error: e instanceof Error ? e.message : 'Error' };
	}
}
