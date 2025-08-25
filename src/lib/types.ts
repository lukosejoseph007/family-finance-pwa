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

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  is_active: boolean;
  budget?: number;
}

export interface Transaction {
  category: string;
  amount: number;
  type: 'income' | 'expense' | 'net';
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
