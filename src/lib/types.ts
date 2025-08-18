// Database enum types
export type UserRole = 'admin' | 'member' | 'viewer';
export type AccountType = 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan';
export type CategoryType = 'immediate_obligations' | 'true_expenses' | 'quality_of_life' | 'just_for_fun' | 'income';
export type GoalType = 'emergency_fund' | 'sinking_fund' | 'debt_payoff' | 'savings_goal';
export type FrequencyType = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';

// Core entity interfaces matching database schema
export interface Family {
	id: string; // UUID
	name: string;
	created_at: string; // ISO timestamp
	settings: {
		currency: string;
		date_format: string;
		start_of_week: number;
		timezone: string;
	};
}

export interface User {
	id: string; // UUID - matches auth.users.id
	family_id: string; // UUID
	email: string;
	role: UserRole;
	display_name: string | null;
	created_at: string; // ISO timestamp
	last_seen: string; // ISO timestamp
}

export interface Account {
	id: string; // UUID
	family_id: string; // UUID
	name: string;
	type: AccountType;
	balance: number; // Decimal as number
	is_active: boolean;
	created_at: string; // ISO timestamp
}

export interface Category {
	id: string; // UUID
	family_id: string; // UUID
	name: string;
	type: CategoryType;
	description: string | null;
	budget_amount: number; // Decimal as number
	color: string; // Hex color code
	priority_order: number;
	is_active: boolean;
	parent_id: string | null; // UUID or null
	created_at: string; // ISO timestamp
}

export interface Transaction {
	id: string; // UUID
	family_id: string; // UUID
	account_id: string; // UUID
	category_id: string | null; // UUID or null
	user_id: string | null; // UUID or null
	amount: number; // Decimal as number
	transaction_date: string; // Date string YYYY-MM-DD
	description: string;
	memo: string | null;
	is_cleared: boolean;
	created_at: string; // ISO timestamp
}

export interface Budget {
	id: string; // UUID
	family_id: string; // UUID
	category_id: string; // UUID
	month_year: string; // Format: 'YYYY-MM'
	allocated_amount: number; // Decimal as number
	spent_amount: number; // Decimal as number
	available_amount: number; // Computed: allocated - spent
	updated_at: string; // ISO timestamp
}

export interface Goal {
	id: string; // UUID
	family_id: string; // UUID
	name: string;
	type: GoalType;
	target_amount: number; // Decimal as number
	target_date: string | null; // Date string YYYY-MM-DD or null
	current_amount: number; // Decimal as number
	is_completed: boolean;
	created_at: string; // ISO timestamp
}

export interface RecurringTransaction {
	id: string; // UUID
	family_id: string; // UUID
	name: string;
	template_data: TransactionTemplate;
	frequency: FrequencyType;
	next_due_date: string; // Date string YYYY-MM-DD
	last_created: string | null; // Date string YYYY-MM-DD or null
	is_active: boolean;
}

export interface TransactionTemplate {
	account_id: string;
	category_id: string | null;
	amount: number;
	description: string;
	memo?: string;
}

// Form data types for user input
export interface TransactionFormData {
	account_id: string;
	category_id: string | null;
	amount: string; // String for form input, convert to number
	transaction_date: string; // Date input value
	description: string;
	memo?: string;
	is_cleared?: boolean;
}

export interface BudgetFormData {
	category_id: string;
	month_year: string; // 'YYYY-MM'
	allocated_amount: string; // String for form input
}

export interface CategoryFormData {
	name: string;
	type: CategoryType;
	description?: string;
	budget_amount?: string; // String for form input
	color?: string;
	parent_id?: string | null;
}

export interface AccountFormData {
	name: string;
	type: AccountType;
	balance?: string; // String for form input
}

export interface GoalFormData {
	name: string;
	type: GoalType;
	target_amount: string; // String for form input
	target_date?: string; // Date input value
}

export interface FamilyFormData {
	name: string;
	settings?: Partial<Family['settings']>;
}

// API Response types
export interface SupabaseResponse<T> {
	data: T | null;
	error: Error | null;
}

export interface SupabaseListResponse<T> {
	data: T[] | null;
	error: Error | null;
	count?: number;
}

// Error types
export interface AppError {
	code: string;
	message: string;
	details?: unknown;
	timestamp: string;
}

export type ErrorCode = 
	| 'VALIDATION_ERROR'
	| 'PERMISSION_DENIED'
	| 'RESOURCE_NOT_FOUND'
	| 'DATABASE_ERROR'
	| 'NETWORK_ERROR'
	| 'AUTHENTICATION_ERROR'
	| 'BUDGET_INSUFFICIENT_FUNDS'
	| 'CATEGORY_HAS_TRANSACTIONS'
	| 'ACCOUNT_HAS_TRANSACTIONS';

export interface ValidationError {
	field: string;
	message: string;
	code: string;
}

export interface FormErrors {
	[field: string]: string | undefined;
}

// Family member with permissions
export interface FamilyMember extends User {
	is_current_user?: boolean;
	permissions: {
		can_edit_budget: boolean;
		can_create_transactions: boolean;
		can_manage_accounts: boolean;
		can_invite_members: boolean;
	};
}

// Utility type helpers
export type NewFamily = Omit<Family, 'id' | 'created_at'>;
export type UpdateFamily = Partial<Omit<Family, 'id' | 'created_at'>>;

export type NewUser = Omit<User, 'created_at' | 'last_seen'>;
export type UpdateUser = Partial<Omit<User, 'id' | 'created_at'>>;

export type NewAccount = Omit<Account, 'id' | 'created_at'>;
export type UpdateAccount = Partial<Omit<Account, 'id' | 'family_id' | 'created_at'>>;

export type NewCategory = Omit<Category, 'id'>;
export type UpdateCategory = Partial<Omit<Category, 'id' | 'family_id'>>;

export type NewTransaction = Omit<Transaction, 'id' | 'created_at'>;
export type UpdateTransaction = Partial<Omit<Transaction, 'id' | 'family_id' | 'created_at'>>;

export type NewBudget = Omit<Budget, 'id' | 'available_amount' | 'updated_at'>;
export type UpdateBudget = Partial<Omit<Budget, 'id' | 'family_id' | 'available_amount' | 'updated_at'>>;

export type NewGoal = Omit<Goal, 'id' | 'created_at'>;
export type UpdateGoal = Partial<Omit<Goal, 'id' | 'family_id' | 'created_at'>>;

// Reporting and Analytics types
export interface MonthlyReport {
	month_year: string; // Format: 'YYYY-MM'
	total_income: number;
	total_expenses: number;
	net_savings: number;
	savings_rate: number; // Percentage
	transaction_count: number;
}

export interface CategorySpending {
	category_id: string;
	category_name: string;
	category_type: CategoryType;
	budgeted_amount: number;
	spent_amount: number;
	remaining_amount: number;
	percentage_used: number; // Percentage of budget used
}

export interface NetWorthTrend {
	date: string; // ISO date string
	assets: number;
	liabilities: number;
	net_worth: number;
}

export interface SpendingTrend {
	month_year: string; // Format: 'YYYY-MM'
	category_type: string;
	amount: number; // Total spending for this category type in this month
}

export interface BudgetPerformance {
	on_track_categories: number;
	over_budget_categories: number;
	under_budget_categories: number;
	total_variance: number;
	performance_score: number; // Percentage score
}

export interface AuthUser {
    id: string;
    email?: string;
    user_metadata?: {
        display_name?: string;
        full_name?: string;
        avatar_url?: string;
    };
    identities?: Array<{
        provider: string;
        identity_data?: {
            name?: string;
            email?: string;
            picture?: string;
        };
    }>;
}