<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Transaction } from '$lib/types/transaction';
	import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js';
	import type { TooltipItem } from 'chart.js';

	Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

	let { data = [] }: { data: Transaction[] } = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let chart: Chart | null = null;

	function buildChartData(transactions: Transaction[]) {
		const expenses = transactions.filter(t => t.tipe === 'Expense');
		const grouped: Record<string, number> = {};
		for (const t of expenses) {
			grouped[t.tanggal] = (grouped[t.tanggal] ?? 0) + t.nominal;
		}
		const sorted = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
		return {
			labels: sorted.map(([d]) => d.substring(5)),
			values: sorted.map(([, v]) => v)
		};
	}

	function initChart() {
		if (!canvas) return;
		if (chart) chart.destroy();
		const { labels, values } = buildChartData(data);
		const ctx = canvas.getContext('2d')!;
		const gradient = ctx.createLinearGradient(0, 0, 0, 200);
		gradient.addColorStop(0, 'rgba(99,102,241,0.3)');
		gradient.addColorStop(1, 'rgba(99,102,241,0)');

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels,
				datasets: [{
					label: 'Pengeluaran',
					data: values,
					borderColor: '#6366f1',
					backgroundColor: gradient,
					borderWidth: 2.5,
					pointRadius: 4,
					pointBackgroundColor: '#6366f1',
					pointBorderColor: '#0a0b14',
					pointBorderWidth: 2,
					tension: 0.4,
					fill: true,
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { tooltip: { callbacks: { label: (ctx: TooltipItem<'line'>) => `Rp ${Number(ctx.raw).toLocaleString('id-ID')}` } } },
				scales: {
					x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } } },
					y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { family: 'Inter', size: 11 }, callback: (v) => `Rp ${Number(v).toLocaleString('id-ID')}` } }
				}
			}
		});
	}

	$effect(() => {
		if (canvas && data.length > 0) {
			initChart();
		} else if (canvas && data.length === 0 && chart) {
			chart.destroy(); chart = null;
		}
	});

	onDestroy(() => chart?.destroy());
</script>

<div class="chart-wrap">
	{#if data.length === 0}
		<div class="empty">Belum ada data pengeluaran</div>
	{:else}
		<canvas bind:this={canvas}></canvas>
	{/if}
</div>

<style>
	.chart-wrap { height: 220px; position: relative; width: 100%; }
	canvas { width: 100% !important; height: 100% !important; }
	.empty { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.875rem; }
</style>
