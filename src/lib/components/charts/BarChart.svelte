<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
	import type { TooltipItem } from 'chart.js';

	Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

	let { byUser = {} }: { byUser: Record<string, number> } = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let chart: Chart | null = null;

	const USER_COLORS: Record<string, string> = {
		Papa: '#3b82f6',
		Mama: '#ec4899',
		Ara: '#f59e0b'
	};

	function initChart() {
		if (!canvas) return;
		if (chart) chart.destroy();
		const labels = Object.keys(byUser);
		const values = Object.values(byUser);
		if (labels.length === 0) return;

		chart = new Chart(canvas.getContext('2d')!, {
			type: 'bar',
			data: {
				labels,
				datasets: [{
					label: 'Total Pengeluaran',
					data: values,
					backgroundColor: labels.map(l => USER_COLORS[l] ?? '#6366f1'),
					borderRadius: 8,
					borderSkipped: false,
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					tooltip: { callbacks: { label: (ctx: TooltipItem<'bar'>) => ` Rp ${Number(ctx.raw).toLocaleString('id-ID')}` } }
				},
				scales: {
					x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } },
					y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { family: 'Inter', size: 11 }, callback: (v) => `Rp ${Number(v).toLocaleString('id-ID')}` } }
				}
			}
		});
	}

	$effect(() => {
		if (canvas && Object.keys(byUser).length > 0) {
			initChart();
		} else if (canvas && Object.keys(byUser).length === 0 && chart) {
			chart.destroy(); chart = null;
		}
	});

	onDestroy(() => chart?.destroy());
</script>

<div class="chart-wrap">
	{#if Object.keys(byUser).length === 0}
		<div class="empty">Belum ada data perbandingan</div>
	{:else}
		<canvas bind:this={canvas}></canvas>
	{/if}
</div>

<style>
	.chart-wrap { height: 220px; position: relative; }
	canvas { width: 100% !important; height: 100% !important; }
	.empty { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.875rem; }
</style>
