<script lang="ts">
	import { userStore } from '$lib/stores/userStore';
	import { config } from '$lib/stores/configStore';

	// Dynamic users from config: Global + all configured users
	const allUsers = $derived(['Global', ...$config.users]);

	const avatarFor = (name: string) => {
		if (name === 'Global') return '🌐';
		const idx = $config.users.indexOf(name);
		const emojis = ['👨', '👩', '👧', '👦', '🧑', '👴', '👵'];
		return emojis[idx % emojis.length] ?? '👤';
	};

	const labelFor = (name: string) => `${avatarFor(name)} ${name}`;

	function onChange(e: Event) {
		userStore.select((e.target as HTMLSelectElement).value as 'Global');
	}
</script>

<div class="select-wrap">
	<select class="user-select" onchange={onChange} value={$userStore} id="user-select">
		{#each allUsers as user}
			<option value={user}>{labelFor(user)}</option>
		{/each}
	</select>
</div>

<style>
	.select-wrap {
		position: relative;
		display: inline-flex;
		align-items: center;
	}
	.select-wrap::after {
		content: '▾';
		position: absolute;
		right: 12px;
		font-size: 0.75rem;
		color: var(--text-muted);
		pointer-events: none;
	}

	.user-select {
		appearance: none;
		background: rgba(99,102,241,0.12);
		border: 1px solid rgba(99,102,241,0.35);
		border-radius: 12px;
		color: #c7d2fe;
		font-family: var(--font-sans);
		font-size: 0.875rem;
		font-weight: 700;
		padding: 9px 36px 9px 14px;
		cursor: pointer;
		outline: none;
		transition: all 0.2s;
		min-width: 140px;
	}
	.user-select:hover,
	.user-select:focus {
		background: rgba(99,102,241,0.2);
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
	}
	.user-select option { background: #1e293b; font-weight: 500; color: #e2e8f0; }
</style>
