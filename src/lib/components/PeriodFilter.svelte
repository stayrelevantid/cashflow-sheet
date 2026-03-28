<script lang="ts">
	import { period } from '$lib/stores/transactionStore';
	import type { Period } from '$lib/stores/transactionStore';

	const options: { value: Period; label: string }[] = [
		{ value: 'month', label: 'Bulan Ini' },
		{ value: 'year', label: 'Tahun Ini' },
		{ value: 'all', label: 'Semua' }
	];
</script>

<div class="filter-wrap">
	{#each options as opt}
		<button
			class="filter-btn"
			class:active={$period === opt.value}
			onclick={() => period.set(opt.value)}
		>
			{opt.label}
		</button>
	{/each}
</div>

<style>
	.filter-wrap { display: flex; gap: 4px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 10px; padding: 4px; }
	.filter-btn { padding: 6px 14px; border-radius: 7px; border: none; background: transparent; color: var(--text-secondary); font-family: var(--font-sans); font-size: 0.8rem; font-weight: 500; cursor: pointer; transition: all 0.15s ease; }
	.filter-btn:hover { color: var(--text-primary); }
	.filter-btn.active { background: rgba(99,102,241,0.25); color: #a5b4fc; font-weight: 600; }
</style>
