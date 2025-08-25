import type { PageLoad } from './$types';
import type { DashboardData, WaterfallItem, PieCategory } from '$lib/types';

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();
  
  // Sample data matching the HTML example format
  const monthlyData = [
    { month: 'Jan', income: 5000, expenses: 4200, savings: 800 },
    { month: 'Feb', income: 5200, expenses: 4500, savings: 700 },
    { month: 'Mar', income: 5100, expenses: 4100, savings: 1000 },
    { month: 'Apr', income: 5300, expenses: 4600, savings: 700 },
    { month: 'May', income: 5150, expenses: 4300, savings: 850 },
    { month: 'Jun', income: 5400, expenses: 4700, savings: 700 }
  ];

  const expenseCategories: PieCategory[] = [
    { name: 'Housing', value: 1800, color: '#FF6B6B', percentage: 38.3 },
    { name: 'Food', value: 800, color: '#4ECDC4', percentage: 17.0 },
    { name: 'Transportation', value: 600, color: '#45B7D1', percentage: 12.8 },
    { name: 'Utilities', value: 400, color: '#96CEB4', percentage: 8.5 },
    { name: 'Entertainment', value: 300, color: '#FECA57', percentage: 6.4 },
    { name: 'Healthcare', value: 250, color: '#FF9FF3', percentage: 5.3 },
    { name: 'Other', value: 550, color: '#A8E6CF', percentage: 11.7 }
  ];

  const waterfallData: WaterfallItem[] = [
    { name: 'Income', value: 5200, cumulative: 5200, type: 'income', color: '#10B981' },
    { name: 'Housing', value: -1800, cumulative: 3400, type: 'expense', color: '#FF6B6B' },
    { name: 'Food', value: -800, cumulative: 2600, type: 'expense', color: '#4ECDC4' },
    { name: 'Transport', value: -600, cumulative: 2000, type: 'expense', color: '#45B7D1' },
    { name: 'Utilities', value: -400, cumulative: 1600, type: 'expense', color: '#96CEB4' },
    { name: 'Entertainment', value: -300, cumulative: 1300, type: 'expense', color: '#FECA57' },
    { name: 'Healthcare', value: -250, cumulative: 1050, type: 'expense', color: '#FF9FF3' },
    { name: 'Other', value: -550, cumulative: 500, type: 'expense', color: '#A8E6CF' },
    { name: 'Net Savings', value: 500, cumulative: 500, type: 'net', color: '#8B5CF6' }
  ];

  // Calculate metrics
  const totalIncome = monthlyData.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = monthlyData.reduce((sum, d) => sum + d.expenses, 0);
  const totalSavings = monthlyData.reduce((sum, d) => sum + d.savings, 0);

  const dashboardData: DashboardData = {
    waterfall: waterfallData,
    pie: expenseCategories,
    trends: monthlyData,
    currentView: 'waterfall'
  };

  return {
    ...data,
    dashboard: dashboardData,
    metrics: {
      income: totalIncome,
      expenses: totalExpenses,
      savings: totalSavings,
      totalIncome,
      totalExpenses,
      netSavings: totalSavings,
      savingsRate: (totalSavings / totalIncome) * 100
    }
  };
};
