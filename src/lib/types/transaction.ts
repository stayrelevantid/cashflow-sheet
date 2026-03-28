export type TransactionType = 'Income' | 'Expense';

export type UserName = 'Papa' | 'Mama' | 'Ara' | 'Global';

export const VALID_USERS: UserName[] = ['Papa', 'Mama', 'Ara'];
export const ALL_USERS: UserName[] = ['Global', 'Papa', 'Mama', 'Ara'];

export const EXPENSE_CATEGORIES = [
	'Makan',
	'Transportasi',
	'Jajan',
	'Belanja',
	'Pendidikan',
	'Lain'
] as const;

export const INCOME_CATEGORIES = ['Gaji', 'Bonus', 'Freelance', 'Lain'] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type Category = ExpenseCategory | IncomeCategory;

export interface Transaction {
	id: string;
	tanggal: string; // ISO 8601: YYYY-MM-DD
	tipe: TransactionType;
	kategori: string;
	nominal: number;
	user: string;
	catatan: string;
}

export interface TransactionInput {
	tanggal: string;
	tipe: TransactionType;
	kategori: string;
	nominal: number;
	user: string;
	catatan?: string;
}

export interface Summary {
	totalIncome: number;
	totalExpense: number;
	balance: number;
	byCategory: Record<string, number>;
	byUser: Record<string, number>;
}
