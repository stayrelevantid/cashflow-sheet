<script lang="ts">
	import { config, saveConfig, configLoading } from '$lib/stores/configStore';
	import type { AppConfig } from '$lib/stores/configStore';

	let { onclose }: { onclose: () => void } = $props();

	// Local editable copies
	let users = $state<string[]>([...$config.users]);
	let expenseCats = $state<string[]>([...$config.expenseCategories]);
	let incomeCats = $state<string[]>([...$config.incomeCategories]);

	let newUser = $state('');
	let newExpCat = $state('');
	let newIncCat = $state('');

	let saving = $state(false);
	let errorMsg = $state('');
	let successMsg = $state('');

	// ─── Users ────────────────────────────────────────────────────────────────
	function addUser() {
		const trimmed = newUser.trim();
		if (!trimmed || users.includes(trimmed)) return;
		users = [...users, trimmed];
		newUser = '';
	}
	function removeUser(u: string) {
		if (users.length <= 1) return;
		users = users.filter((x) => x !== u);
	}

	// ─── Expense Categories ───────────────────────────────────────────────────
	function addExpCat() {
		const trimmed = newExpCat.trim();
		if (!trimmed || expenseCats.includes(trimmed)) return;
		expenseCats = [...expenseCats, trimmed];
		newExpCat = '';
	}
	function removeExpCat(c: string) {
		if (expenseCats.length <= 1) return;
		expenseCats = expenseCats.filter((x) => x !== c);
	}

	// ─── Income Categories ────────────────────────────────────────────────────
	function addIncCat() {
		const trimmed = newIncCat.trim();
		if (!trimmed || incomeCats.includes(trimmed)) return;
		incomeCats = [...incomeCats, trimmed];
		newIncCat = '';
	}
	function removeIncCat(c: string) {
		if (incomeCats.length <= 1) return;
		incomeCats = incomeCats.filter((x) => x !== c);
	}

	// ─── Save ─────────────────────────────────────────────────────────────────
	async function handleSave() {
		saving = true;
		errorMsg = '';
		successMsg = '';

		const updated: AppConfig = {
			users,
			expenseCategories: expenseCats,
			incomeCategories: incomeCats
		};

		const result = await saveConfig(updated);
		saving = false;

		if (result.success) {
			successMsg = 'Konfigurasi berhasil disimpan!';
			setTimeout(() => { successMsg = ''; onclose(); }, 1200);
		} else {
			errorMsg = result.error ?? 'Gagal menyimpan';
		}
	}
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Pengaturan">
	<div class="modal fade-up">
		<div class="modal-header">
			<div>
				<h2>⚙️ Pengaturan</h2>
				<p class="subtitle">Kelola anggota & kategori transaksi</p>
			</div>
			<button class="close-btn" onclick={onclose} aria-label="Tutup">✕</button>
		</div>

		<div class="sections">
			<!-- ─── Users ─── -->
			<div class="section">
				<h3 class="section-title">👥 Anggota Keluarga</h3>
				<div class="chips">
					{#each users as u}
						<span class="chip">
							{u}
							<button class="chip-remove" onclick={() => removeUser(u)} title="Hapus {u}" disabled={users.length <= 1}>×</button>
						</span>
					{/each}
				</div>
				<div class="add-row">
					<input
						type="text"
						bind:value={newUser}
						placeholder="Nama anggota baru..."
						onkeydown={(e) => e.key === 'Enter' && addUser()}
						maxlength="30"
					/>
					<button class="add-btn" onclick={addUser} disabled={!newUser.trim()}>+ Tambah</button>
				</div>
			</div>

			<!-- ─── Expense Categories ─── -->
			<div class="section">
				<h3 class="section-title">📤 Kategori Pengeluaran</h3>
				<div class="chips">
					{#each expenseCats as c}
						<span class="chip expense">
							{c}
							<button class="chip-remove" onclick={() => removeExpCat(c)} title="Hapus {c}" disabled={expenseCats.length <= 1}>×</button>
						</span>
					{/each}
				</div>
				<div class="add-row">
					<input
						type="text"
						bind:value={newExpCat}
						placeholder="Kategori pengeluaran baru..."
						onkeydown={(e) => e.key === 'Enter' && addExpCat()}
						maxlength="30"
					/>
					<button class="add-btn" onclick={addExpCat} disabled={!newExpCat.trim()}>+ Tambah</button>
				</div>
			</div>

			<!-- ─── Income Categories ─── -->
			<div class="section">
				<h3 class="section-title">📥 Kategori Pemasukan</h3>
				<div class="chips">
					{#each incomeCats as c}
						<span class="chip income">
							{c}
							<button class="chip-remove" onclick={() => removeIncCat(c)} title="Hapus {c}" disabled={incomeCats.length <= 1}>×</button>
						</span>
					{/each}
				</div>
				<div class="add-row">
					<input
						type="text"
						bind:value={newIncCat}
						placeholder="Kategori pemasukan baru..."
						onkeydown={(e) => e.key === 'Enter' && addIncCat()}
						maxlength="30"
					/>
					<button class="add-btn" onclick={addIncCat} disabled={!newIncCat.trim()}>+ Tambah</button>
				</div>
			</div>
		</div>

		{#if errorMsg}<div class="alert error">{errorMsg}</div>{/if}
		{#if successMsg}<div class="alert success">✅ {successMsg}</div>{/if}

		<div class="footer">
			<button class="cancel-btn" onclick={onclose}>Batal</button>
			<button class="save-btn" onclick={handleSave} disabled={saving || $configLoading}>
				{saving ? 'Menyimpan...' : '💾 Simpan ke Google Sheet'}
			</button>
		</div>
	</div>
</div>

<style>
	.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; }

	.modal { background: #111827; border: 1px solid var(--border-bright); border-radius: 24px; padding: 28px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 80px rgba(0,0,0,0.6); }

	.modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
	h2 { font-size: 1.2rem; font-weight: 700; margin: 0 0 4px; color: var(--text-primary); }
	.subtitle { font-size: 0.8rem; color: var(--text-muted); margin: 0; }

	.close-btn { background: rgba(255,255,255,0.06); border: 1px solid var(--border); color: var(--text-secondary); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.close-btn:hover { background: rgba(255,255,255,0.1); }

	.sections { display: flex; flex-direction: column; gap: 20px; }

	.section { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
	.section-title { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin: 0 0 12px; letter-spacing: 0.03em; }

	.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; min-height: 32px; }

	.chip { display: inline-flex; align-items: center; gap: 4px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc; border-radius: 999px; padding: 4px 10px 4px 12px; font-size: 0.8rem; font-weight: 600; }
	.chip.expense { background: rgba(244,63,94,0.12); border-color: rgba(244,63,94,0.25); color: #fda4af; }
	.chip.income { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.25); color: #6ee7b7; }

	.chip-remove { background: none; border: none; color: inherit; cursor: pointer; font-size: 1rem; line-height: 1; padding: 0 2px; opacity: 0.6; transition: opacity 0.15s; }
	.chip-remove:hover:not(:disabled) { opacity: 1; }
	.chip-remove:disabled { cursor: not-allowed; opacity: 0.2; }

	.add-row { display: flex; gap: 8px; }

	input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-family: var(--font-sans); font-size: 0.85rem; padding: 8px 12px; outline: none; }
	input:focus { border-color: var(--accent-indigo); }

	.add-btn { padding: 8px 14px; background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.35); border-radius: 8px; color: #a5b4fc; font-family: var(--font-sans); font-size: 0.8rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
	.add-btn:hover:not(:disabled) { background: rgba(99,102,241,0.3); }
	.add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	.alert { border-radius: 10px; padding: 10px 14px; font-size: 0.82rem; margin-top: 12px; }
	.alert.error { background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.3); color: #fda4af; }
	.alert.success { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: #6ee7b7; }

	.footer { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }

	.cancel-btn { padding: 10px 18px; background: transparent; border: 1px solid var(--border); border-radius: 10px; color: var(--text-secondary); font-family: var(--font-sans); font-size: 0.875rem; cursor: pointer; }
	.cancel-btn:hover { border-color: var(--border-bright); color: var(--text-primary); }

	.save-btn { padding: 10px 20px; background: var(--gradient-primary); border: none; border-radius: 10px; color: #fff; font-family: var(--font-sans); font-size: 0.875rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 16px rgba(99,102,241,0.35); transition: all 0.2s; }
	.save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(99,102,241,0.5); }
	.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
