<script lang="ts">
	import { userStore } from '$lib/stores/userStore';
	import { config } from '$lib/stores/configStore';

	// Dynamic users from config: Global + all configured users
	const allUsers = $derived(['Global', ...$config.users]);

	const avatarFor = (name: string) => {
		const idx = $config.users.indexOf(name);
		const emojis = ['👨', '👩', '👧', '👦', '🧑', '👴', '👵'];
		if (name === 'Global') return '🌐';
		return emojis[idx % emojis.length] ?? '👤';
	};
</script>

<div class="switcher">
	{#each allUsers as user}
		<button
			class="tab"
			class:active={$userStore === user}
			onclick={() => userStore.select(user as 'Global' | 'Papa' | 'Mama' | 'Ara')}
			aria-pressed={$userStore === user}
		>
			<span class="avatar">{avatarFor(user)}</span>
			<span class="name">{user}</span>
		</button>
	{/each}
</div>

<style>
	.switcher { display: flex; gap: 6px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 14px; padding: 5px; flex-wrap: wrap; }
	.tab { display: flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 10px; border: none; background: transparent; color: var(--text-secondary); font-family: var(--font-sans); font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
	.tab:hover { background: rgba(255,255,255,0.06); color: var(--text-primary); }
	.tab.active { background: var(--gradient-primary); color: #fff; box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35); }
	.avatar { font-size: 1rem; line-height: 1; }
	.name { font-weight: 600; }
</style>
