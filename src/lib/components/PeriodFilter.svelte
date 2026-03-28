<script lang="ts">
	import { periodMode, selectedYear, selectedMonth, MONTHS_ID } from '$lib/stores/transactionStore';
	import type { PeriodMode } from '$lib/stores/transactionStore';

	const now = new Date();
	const currentYear = now.getFullYear();

	// Generate year options: 3 years back to next year
	const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i);
	// Month options
	const monthOptions = MONTHS_ID.map((label, i) => ({ value: i + 1, label }));

	const MODES: { value: PeriodMode; label: string }[] = [
		{ value: 'bulan_ini',   label: 'Bulan Ini' },
		{ value: 'bulan_lalu',  label: 'Bulan Lalu' },
		{ value: 'tahun_ini',   label: 'Tahun Ini' },
		{ value: 'pilih_tahun', label: 'Pilih Tahun' },
		{ value: 'pilih_bulan', label: 'Pilih Bulan' },
	];

	function onModeChange(e: Event) {
		periodMode.set((e.target as HTMLSelectElement).value as PeriodMode);
	}

	function onYearChange(e: Event) {
		selectedYear.set(Number((e.target as HTMLSelectElement).value));
	}

	function onMonthChange(e: Event) {
		selectedMonth.set(Number((e.target as HTMLSelectElement).value));
	}
</script>

<div class="filter-bar">
	<!-- Primary mode select -->
	<div class="select-wrap">
		<select class="filter-select" onchange={onModeChange} value={$periodMode} id="period-mode-select">
			{#each MODES as m}
				<option value={m.value}>{m.label}</option>
			{/each}
		</select>
	</div>

	<!-- Year picker — shown for pilih_tahun and pilih_bulan -->
	{#if $periodMode === 'pilih_tahun' || $periodMode === 'pilih_bulan'}
		<div class="select-wrap secondary">
			<select class="filter-select" onchange={onYearChange} value={$selectedYear} id="period-year-select">
				{#each yearOptions as y}
					<option value={y}>{y}</option>
				{/each}
			</select>
		</div>
	{/if}

	<!-- Month picker — shown for pilih_bulan only -->
	{#if $periodMode === 'pilih_bulan'}
		<div class="select-wrap secondary">
			<select class="filter-select" onchange={onMonthChange} value={$selectedMonth} id="period-month-select">
				{#each monthOptions as m}
					<option value={m.value}>{m.label}</option>
				{/each}
			</select>
		</div>
	{/if}
</div>

<style>
	.filter-bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

	.select-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}
	.select-wrap::after {
		content: '▾';
		position: absolute;
		right: 10px;
		font-size: 0.7rem;
		color: var(--text-muted);
		pointer-events: none;
	}

	.filter-select {
		appearance: none;
		background: rgba(255,255,255,0.04);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--text-primary);
		font-family: var(--font-sans);
		font-size: 0.82rem;
		font-weight: 600;
		padding: 8px 28px 8px 12px;
		cursor: pointer;
		outline: none;
		transition: all 0.15s;
	}
	.filter-select:hover,
	.filter-select:focus { border-color: var(--accent-indigo); background: rgba(99,102,241,0.08); }
	.filter-select option { background: #1e293b; font-weight: 500; }

	.select-wrap.secondary .filter-select {
		font-size: 0.8rem;
		color: #a5b4fc;
		border-color: rgba(99,102,241,0.3);
		background: rgba(99,102,241,0.08);
	}
</style>
