<script lang="ts">
	import { userStore } from '$lib/stores/userStore';
	import { config } from '$lib/stores/configStore';
	import { todayISO } from '$lib/utils/formatter';

	let { onsuccess, onclose }: { onsuccess: () => void; onclose: () => void } = $props();

	let tipe: 'Income' | 'Expense' = $state('Expense');
	let tanggal = $state(todayISO());
	let kategori = $state('');
	let nominal = $state('');
	let catatan = $state('');
	let loading = $state(false);
	let errorMsg = $state('');

	const categories = $derived(tipe === 'Expense' ? $config.expenseCategories : $config.incomeCategories);

	$effect(() => {
		void tipe;
		kategori = '';
	});

	const activeUser = $derived($userStore === 'Global' ? ($config.users[0] ?? 'Papa') : $userStore);

	async function handleSubmit() {
		errorMsg = '';
		if (!tanggal || !tipe || !kategori || !nominal) {
			errorMsg = 'Harap isi semua field yang wajib diisi.';
			return;
		}
		loading = true;
		try {
			const res = await fetch('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					tanggal, tipe, kategori,
					nominal: Number(nominal),
					user: activeUser,
					catatan
				})
			});
			const data = await res.json();
			if (!res.ok || !data.success) throw new Error(data.error ?? 'Gagal menyimpan');
			onsuccess();
			resetForm();
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : 'Terjadi kesalahan';
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		tipe = 'Expense'; tanggal = todayISO(); kategori = ''; nominal = ''; catatan = ''; errorMsg = '';
	}
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Form Transaksi">
	<div class="modal fade-up">
		<div class="modal-header">
			<div>
				<h2>Transaksi Baru</h2>
				<p class="subtitle">User aktif: <strong>{activeUser}</strong></p>
			</div>
			<button class="close-btn" onclick={onclose} aria-label="Tutup">✕</button>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="field">
				<span class="field-label">Tipe Transaksi</span>
				<div class="type-toggle">
					<button type="button" class="type-btn" class:active-expense={tipe === 'Expense'} onclick={() => tipe = 'Expense'}>↓ Pengeluaran</button>
					<button type="button" class="type-btn" class:active-income={tipe === 'Income'} onclick={() => tipe = 'Income'}>↑ Pemasukan</button>
				</div>
			</div>

			<div class="grid-2">
				<div class="field">
					<label class="field-label" for="tanggal">Tanggal <span class="req">*</span></label>
					<input id="tanggal" type="date" bind:value={tanggal} max={todayISO()} required />
				</div>
				<div class="field">
					<label class="field-label" for="nominal">Nominal (IDR) <span class="req">*</span></label>
					<input id="nominal" type="number" bind:value={nominal} min="1" placeholder="50000" required />
				</div>
			</div>

			<div class="field">
				<label class="field-label" for="kategori">Kategori <span class="req">*</span></label>
				<select id="kategori" bind:value={kategori} required>
					<option value="" disabled>Pilih kategori...</option>
					{#each categories as cat}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
			</div>

			<div class="field">
				<label class="field-label" for="catatan">Catatan (opsional)</label>
				<textarea id="catatan" bind:value={catatan} rows="2" maxlength="200" placeholder="Deskripsi singkat..."></textarea>
			</div>

			{#if errorMsg}
				<div class="error">{errorMsg}</div>
			{/if}

			<button type="submit" class="submit-btn" disabled={loading}>
				{loading ? 'Menyimpan...' : '💾 Simpan Transaksi'}
			</button>
		</form>
	</div>
</div>

<style>
	.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; }
	.modal { background: #111827; border: 1px solid var(--border-bright); border-radius: 24px; padding: 28px; width: 100%; max-width: 480px; box-shadow: 0 24px 80px rgba(0,0,0,0.6); }
	.modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
	h2 { font-size: 1.3rem; font-weight: 700; margin: 0 0 4px; color: var(--text-primary); }
	.subtitle { font-size: 0.8rem; color: var(--text-muted); margin: 0; }
	.subtitle strong { color: #a5b4fc; }
	.close-btn { background: rgba(255,255,255,0.06); border: 1px solid var(--border); color: var(--text-secondary); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.close-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }
	.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
	.field-label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.03em; }
	.req { color: var(--accent-rose); }
	.type-toggle { display: flex; gap: 8px; }
	.type-btn { flex: 1; padding: 10px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text-secondary); font-family: var(--font-sans); font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
	.type-btn.active-expense { background: rgba(244,63,94,0.15); border-color: var(--accent-rose); color: #fda4af; }
	.type-btn.active-income { background: rgba(16,185,129,0.15); border-color: var(--accent-emerald); color: #6ee7b7; }
	.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
	input, select, textarea { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 10px; color: var(--text-primary); font-family: var(--font-sans); font-size: 0.9rem; padding: 10px 12px; width: 100%; transition: border-color 0.2s; outline: none; }
	input:focus, select:focus, textarea:focus { border-color: var(--accent-indigo); }
	select option { background: #1e293b; }
	textarea { resize: none; }
	.error { background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.3); border-radius: 10px; padding: 10px 14px; font-size: 0.8rem; color: #fda4af; margin-bottom: 12px; }
	.submit-btn { width: 100%; padding: 12px; background: var(--gradient-primary); border: none; border-radius: 12px; color: #fff; font-family: var(--font-sans); font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(99,102,241,0.4); margin-top: 4px; }
	.submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(99,102,241,0.5); }
	.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
