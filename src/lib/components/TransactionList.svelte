<script lang="ts">
	import type { Transaction } from '$lib/types/transaction';
	import { formatRupiah, formatDate } from '$lib/utils/formatter';

	let { transactions = [] }: { transactions: Transaction[] } = $props();

	const sorted = $derived([...transactions].sort((a, b) => b.tanggal.localeCompare(a.tanggal)));

	const userColors: Record<string, string> = { Papa: '#3b82f6', Mama: '#ec4899', Ara: '#f59e0b' };
	const categoryIcons: Record<string, string> = {
		Makan: '🍽', Transportasi: '🚗', Jajan: '🧃', Belanja: '🛍',
		Pendidikan: '📚', Lain: '📦', Gaji: '💼', Bonus: '🎁', Freelance: '💻'
	};
</script>

<div class="list-wrap">
	{#if sorted.length === 0}
		<div class="empty">
			<span class="empty-icon">📭</span>
			<p>Belum ada transaksi</p>
		</div>
	{:else}
		<div class="list">
			{#each sorted as t, i}
				<div class="row fade-up" style="animation-delay: {i * 30}ms">
					<div class="icon-wrap">{categoryIcons[t.kategori] ?? '💰'}</div>
					<div class="info">
						<span class="kategori">{t.kategori}</span>
						{#if t.catatan}<span class="catatan">{t.catatan}</span>{/if}
					</div>
					<div class="right">
						<span class="nominal" class:income={t.tipe === 'Income'} class:expense={t.tipe === 'Expense'}>
							{t.tipe === 'Income' ? '+' : '-'}{formatRupiah(t.nominal)}
						</span>
						<div class="meta">
							<span class="date">{formatDate(t.tanggal)}</span>
							<span class="user-badge" style="color: {userColors[t.user] ?? '#94a3b8'}">{t.user}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.empty { display: flex; flex-direction: column; align-items: center; padding: 48px 24px; color: var(--text-muted); gap: 8px; }
	.empty-icon { font-size: 2.5rem; }
	.empty p { font-size: 0.875rem; margin: 0; }
	.list { display: flex; flex-direction: column; gap: 2px; }
	.row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; transition: background 0.15s; }
	.row:hover { background: rgba(255,255,255,0.04); }
	.icon-wrap { width: 40px; height: 40px; background: rgba(255,255,255,0.06); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
	.info { flex: 1; min-width: 0; }
	.kategori { display: block; font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
	.catatan { display: block; font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.right { text-align: right; flex-shrink: 0; }
	.nominal { display: block; font-size: 0.9rem; font-weight: 700; margin-bottom: 2px; }
	.nominal.income { color: #6ee7b7; }
	.nominal.expense { color: #fda4af; }
	.meta { display: flex; gap: 8px; align-items: center; justify-content: flex-end; }
	.date { font-size: 0.7rem; color: var(--text-muted); }
	.user-badge { font-size: 0.7rem; font-weight: 600; }
</style>
