export interface WaterfallItem {
  name: string;
  value: number;
  cumulative: number;
  type: 'income' | 'expense' | 'net';
  color: string;
}

export interface PieCategory {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface TrendPoint {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface DashboardData {
  waterfall: WaterfallItem[];
  pie: PieCategory[];
  trends: TrendPoint[];
  currentView: 'waterfall' | 'pie' | 'trends';
}

export interface TransactionFormData {
  account_id: string;
  category_id: string | null;  // Required but nullable
  amount: string;
  transaction_date: string;
  description: string;
  memo?: string;
  is_cleared: boolean;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  is_active: boolean;
  currency: string;
}

export type CategoryType = 'immediate_obligations' | 'true_expenses' | 'quality_of_life' | 'just_for_fun' | 'income';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  is_active: boolean;
  budget?: number;
}

export interface Transaction {
  id: string;
  family_id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  amount: number;
  transaction_date: string;
  description: string;
  memo: string | null;
  is_cleared: boolean;
  created_at: string;
  account: {
    name: string;
    type: string;
  };
  category: {
    name: string;
    type: string;
  };
}

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
}

export interface App {
  PageData: {
    settings?: {
      currency: string;
    };
    metrics: {
      transactions: Transaction[];
      monthlySummary: MonthlySummary[];
      income: number;
      expenses: number;
      savings: number;
    };
    dashboard?: DashboardData;
  };
}
