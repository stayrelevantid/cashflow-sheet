<script lang="ts">
	import { onMount } from 'svelte';
	import { derived } from 'svelte/store';

	import { userStore } from '$lib/stores/userStore';
	import { transactions, summary, loading, error, period, refreshAll } from '$lib/stores/transactionStore';
	import { fetchConfig } from '$lib/stores/configStore';

	import ProfileSwitcher from '$lib/components/ProfileSwitcher.svelte';
	import PeriodFilter from '$lib/components/PeriodFilter.svelte';
	import KPICard from '$lib/components/KPICard.svelte';
	import TransactionForm from '$lib/components/TransactionForm.svelte';
	import TransactionList from '$lib/components/TransactionList.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import PieChart from '$lib/components/charts/PieChart.svelte';
	import BarChart from '$lib/components/charts/BarChart.svelte';

	let showForm = $state(false);
	let showSettings = $state(false);

	// Re-fetch when user or period changes
	$effect(() => {
		refreshAll($userStore, $period);
	});

	onMount(() => {
		fetchConfig();
		refreshAll($userStore, $period);
	});

	function handleSuccess() {
		showForm = false;
		refreshAll($userStore, $period);
	}

	const periodLabel = derived(period, (p) =>
		p === 'month' ? 'Bulan Ini' : p === 'year' ? 'Tahun Ini' : 'Semua Waktu'
	);
</script>

<svelte:head>
	<title>Family CashFlow-Sheet</title>
</svelte:head>

<div class="bg-mesh" aria-hidden="true"></div>

<main>
	<!-- Header -->
	<header>
		<div class="logo">
			<span class="logo-icon">💰</span>
			<div>
				<h1>CashFlow<span class="highlight">Sheet</span></h1>
				<p class="tagline">Keuangan keluarga, transparan &amp; real-time</p>
			</div>
		</div>
		<div class="header-right">
			<ProfileSwitcher />
			<button class="settings-btn" onclick={() => showSettings = true} id="btn-settings" title="Pengaturan">
				⚙️
			</button>
			<button class="add-btn" onclick={() => showForm = true} id="btn-add-transaction">
				<span>+</span> Transaksi
			</button>
		</div>
	</header>

	<!-- Filters -->
	<section class="filters">
		<div class="filter-info">
			<span class="user-context">
				{$userStore === 'Global' ? '🌐 Semua Anggota'
					: $userStore === 'Papa' ? '👨 Papa'
					: $userStore === 'Mama' ? '👩 Mama'
					: '👧 Ara'}
			</span>
			<span class="period-label">· {$periodLabel}</span>
		</div>
		<PeriodFilter />
	</section>

	{#if $error}
		<div class="alert-error">
			⚠ {$error} — pastikan credentials Google Sheets sudah diisi di <code>.env</code>
		</div>
	{/if}

	<!-- KPI Cards -->
	<section class="kpi-grid" aria-label="Ringkasan keuangan">
		<KPICard label="Total Saldo"       value={$summary.balance}      type="balance"  delay={0}   />
		<KPICard label="Total Pemasukan"   value={$summary.totalIncome}  type="income"   delay={80}  />
		<KPICard label="Total Pengeluaran" value={$summary.totalExpense} type="expense"  delay={160} />
	</section>

	<!-- Charts -->
	<section class="charts-grid" aria-label="Grafik keuangan">
		<div class="glass chart-card wide">
			<div class="card-header">
				<h2 class="card-title">📈 Tren Pengeluaran</h2>
				{#if $loading}<span class="spinner"></span>{/if}
			</div>
			<LineChart data={$transactions} />
		</div>
		<div class="glass chart-card">
			<div class="card-header"><h2 class="card-title">🧩 Distribusi Kategori</h2></div>
			<PieChart byCategory={$summary.byCategory} />
		</div>
		<div class="glass chart-card">
			<div class="card-header"><h2 class="card-title">👨‍👩‍👧 Perbandingan Anggota</h2></div>
			<BarChart byUser={$summary.byUser} />
		</div>
	</section>

	<!-- Transaction List -->
	<section class="glass transactions-section" aria-label="Daftar transaksi">
		<div class="card-header">
			<h2 class="card-title">📋 Riwayat Transaksi</h2>
			<span class="count-badge">{$transactions.length} transaksi</span>
		</div>
		{#if $loading}
			<div class="loading-state">
				<span class="spinner large"></span>
				<span>Memuat data...</span>
			</div>
		{:else}
			<TransactionList transactions={$transactions} />
		{/if}
	</section>
</main>

{#if showForm}
	<TransactionForm onsuccess={handleSuccess} onclose={() => showForm = false} />
{/if}

{#if showSettings}
	<SettingsModal onclose={() => showSettings = false} />
{/if}

<style>
	.bg-mesh {
		position: fixed; inset: 0; z-index: -1;
		background:
			radial-gradient(ellipse 80% 50% at 20% -10%, rgba(99,102,241,0.18) 0%, transparent 60%),
			radial-gradient(ellipse 60% 40% at 80% 110%, rgba(139,92,246,0.12) 0%, transparent 60%),
			var(--bg-base);
	}

	main { max-width: 1200px; margin: 0 auto; padding: 24px 20px 60px; }

	header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
	.logo { display: flex; align-items: center; gap: 12px; }
	.logo-icon { font-size: 2rem; line-height: 1; filter: drop-shadow(0 0 12px rgba(99,102,241,0.6)); }
	h1 { font-size: 1.5rem; font-weight: 800; margin: 0; letter-spacing: -0.02em; color: var(--text-primary); }
	.highlight { color: #818cf8; }
	.tagline { font-size: 0.75rem; color: var(--text-muted); margin: 0; font-weight: 400; }
	.header-right { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
	.add-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: var(--gradient-primary); border: none; border-radius: 12px; color: #fff; font-family: var(--font-sans); font-size: 0.875rem; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(99,102,241,0.35); white-space: nowrap; }
	.add-btn span { font-size: 1.3rem; line-height: 1; }
	.add-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(99,102,241,0.5); }
	.settings-btn { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: rgba(255,255,255,0.06); border: 1px solid var(--border); border-radius: 12px; font-size: 1.1rem; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
	.settings-btn:hover { background: rgba(255,255,255,0.1); border-color: var(--border-bright); transform: rotate(30deg); }

	.filters { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
	.filter-info { display: flex; align-items: center; gap: 6px; }
	.user-context { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
	.period-label { font-size: 0.85rem; color: var(--text-muted); }

	.alert-error { background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.25); border-radius: 12px; padding: 12px 16px; font-size: 0.82rem; color: #fda4af; margin-bottom: 20px; }

	.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }

	.charts-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 16px; margin-bottom: 20px; }
	.chart-card { padding: 20px; }
	.chart-card.wide { grid-column: 1; }

	.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
	.card-title { font-size: 0.875rem; font-weight: 700; color: var(--text-secondary); margin: 0; letter-spacing: 0.02em; }
	.count-badge { font-size: 0.7rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 3px 10px; border-radius: 999px; border: 1px solid var(--border); }

	.transactions-section { padding: 20px; }
	.loading-state { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 48px; color: var(--text-muted); font-size: 0.875rem; }

	.spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; }
	.spinner.large { width: 24px; height: 24px; }
	@keyframes spin { to { transform: rotate(360deg); } }

	@media (max-width: 900px) {
		.charts-grid { grid-template-columns: 1fr 1fr; }
		.chart-card.wide { grid-column: 1 / -1; }
	}
	@media (max-width: 640px) {
		.kpi-grid { grid-template-columns: 1fr; }
		.charts-grid { grid-template-columns: 1fr; }
		header { flex-direction: column; align-items: flex-start; }
		.header-right { width: 100%; }
		.add-btn { flex: 1; justify-content: center; }
	}
</style>
