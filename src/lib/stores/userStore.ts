import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type ActiveUser = 'Global' | 'Papa' | 'Mama' | 'Ara';
export const ALL_USERS: ActiveUser[] = ['Global', 'Papa', 'Mama', 'Ara'];

const STORAGE_KEY = 'cashflow_selected_user';

function getInitialUser(): ActiveUser {
	if (browser) {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored && ALL_USERS.includes(stored as ActiveUser)) {
			return stored as ActiveUser;
		}
	}
	return 'Global';
}

function createUserStore() {
	const { subscribe, set } = writable<ActiveUser>(getInitialUser());

	return {
		subscribe,
		select(user: ActiveUser) {
			if (browser) localStorage.setItem(STORAGE_KEY, user);
			set(user);
		}
	};
}

export const userStore = createUserStore();
