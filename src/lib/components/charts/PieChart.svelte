<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
	import type { TooltipItem } from 'chart.js';

	Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

	let { byCategory = {} }: { byCategory: Record<string, number> } = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let chart: Chart | null = null;

	const PALETTE = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f59e0b','#10b981','#06b6d4','#3b82f6'];

	function initChart() {
		if (!canvas) return;
		if (chart) chart.destroy();
		const labels = Object.keys(byCategory);
		const values = Object.values(byCategory);
		if (labels.length === 0) return;

		chart = new Chart(canvas.getContext('2d')!, {
			type: 'doughnut',
			data: {
				labels,
				datasets: [{
					data: values,
					backgroundColor: PALETTE.slice(0, labels.length),
					borderColor: '#0a0b14',
					borderWidth: 3,
					hoverOffset: 8,
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '65%',
				plugins: {
					legend: {
						position: 'bottom',
						labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 16, boxWidth: 12, borderRadius: 4 }
					},
					tooltip: {
						callbacks: {
							label: (ctx: TooltipItem<'doughnut'>) => ` ${ctx.label}: Rp ${Number(ctx.raw).toLocaleString('id-ID')}`
						}
					}
				}
			}
		});
	}

	$effect(() => {
		if (canvas && Object.keys(byCategory).length > 0) {
			initChart();
		} else if (canvas && Object.keys(byCategory).length === 0 && chart) {
			chart.destroy(); chart = null;
		}
	});

	onDestroy(() => chart?.destroy());
</script>

<div class="chart-wrap">
	{#if Object.keys(byCategory).length === 0}
		<div class="empty">Belum ada data kategori</div>
	{:else}
		<canvas bind:this={canvas}></canvas>
	{/if}
</div>

<style>
	.chart-wrap { height: 260px; position: relative; }
	canvas { width: 100% !important; height: 100% !important; }
	.empty { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.875rem; }
</style>
