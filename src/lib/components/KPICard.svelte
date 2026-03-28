<script lang="ts">
	import { formatRupiah } from '$lib/utils/formatter';

	let { label, value = 0, type = 'balance', delay = 0 }: {
		label: string;
		value?: number;
		type?: 'income' | 'expense' | 'balance';
		delay?: number;
	} = $props();

	const config = {
		income:  { icon: '↑', gradient: 'var(--gradient-income)',  glow: 'rgba(16,185,129,0.2)', badge: 'Pemasukan'    },
		expense: { icon: '↓', gradient: 'var(--gradient-expense)', glow: 'rgba(244,63,94,0.2)',  badge: 'Pengeluaran'  },
		balance: { icon: '⚖', gradient: 'var(--gradient-primary)', glow: 'rgba(99,102,241,0.2)', badge: 'Saldo'        }
	};

	const cfg = $derived(config[type]);
	const isNegative = $derived(type === 'balance' && value < 0);
</script>

<div class="card fade-up" style="animation-delay: {delay}ms; --glow: {cfg.glow};">
	<div class="top">
		<span class="badge">{cfg.badge}</span>
		<div class="icon-wrap" style="background: {cfg.gradient};">{cfg.icon}</div>
	</div>
	<div class="value" class:negative={isNegative}>{formatRupiah(value)}</div>
	<div class="label">{label}</div>
	<div class="bar" style="background: {cfg.gradient};"></div>
</div>

<style>
	.card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 20px;
		padding: 24px;
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
		backdrop-filter: blur(16px);
	}
	.card:hover { border-color: var(--border-bright); transform: translateY(-2px); box-shadow: 0 12px 40px var(--glow); }
	.top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
	.badge { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 999px; border: 1px solid var(--border); }
	.icon-wrap { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 700; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
	.value { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.03em; margin-bottom: 4px; }
	.value.negative { color: var(--accent-rose); }
	.label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
	.bar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; opacity: 0.6; }
</style>
