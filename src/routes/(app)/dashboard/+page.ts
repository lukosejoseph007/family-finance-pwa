// Import transaction and category services
import { getTransactions } from '$lib/services/transactionService';
import { getActiveCategories, categoryTypeColors } from '$lib/services/categoryService';
import type { PageLoad } from './$types';
import type { DashboardData, WaterfallItem, PieCategory, CategoryType, Transaction } from '$lib/types';

export const load: PageLoad = async ({ parent }) => {
  const data = await parent();
  
  // Fetch real data from services
  const { transactions } = await getTransactions();
  const categories = await getActiveCategories();

  // Process monthly trends
  const monthlyData = transactions.reduce((acc: { month: string; income: number; expenses: number; savings: number }[], transaction: Transaction) => {
    const month = new Date(transaction.transaction_date).toLocaleString('default', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      if (transaction.amount > 0) existing.income += transaction.amount;
      else existing.expenses += Math.abs(transaction.amount);
      existing.savings = existing.income - existing.expenses;
    } else {
      acc.push({
        month,
        income: transaction.amount > 0 ? transaction.amount : 0,
        expenses: transaction.amount < 0 ? Math.abs(transaction.amount) : 0,
        savings: 0
      });
    }
    return acc;
  }, []);

  // Sort by month order
  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  monthlyData.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

  // Calculate metrics
  const totalIncome = monthlyData.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = monthlyData.reduce((sum, d) => sum + d.expenses, 0);
  const totalSavings = totalIncome - totalExpenses;

  // Generate expense categories
  const expenseCategories: PieCategory[] = categories
    .filter(cat => cat.type !== 'income')
    .map(category => {
      const categoryTransactions = transactions.filter((t: Transaction) => t.category_id === category.id);
      const total = categoryTransactions.reduce((sum, t: Transaction) => sum + Math.abs(t.amount), 0);
      return {
        name: category.name,
        value: total,
        color: categoryTypeColors[category.type as CategoryType] || '#FF6B6B',
        percentage: totalExpenses > 0 ? Number((total / totalExpenses * 100).toFixed(2)) : 0
      };
    })
    .filter(cat => cat.value > 0);

  // Generate waterfall data
  const waterfallData: WaterfallItem[] = [];
  let cumulative = 0;

  // Add income categories
  categories
    .filter(cat => cat.type === 'income')
    .forEach(category => {
      const categoryTransactions = transactions.filter((t: Transaction) => t.category_id === category.id);
      const total = categoryTransactions.reduce((sum, t: Transaction) => sum + t.amount, 0);
      if (total > 0) {
        waterfallData.push({
          name: category.name,
          value: total,
          cumulative: cumulative + total,
          type: 'income',
          color: categoryTypeColors[category.type as CategoryType] || '#10B981'
        });
        cumulative += total;
      }
    });

  // Add expense categories
  categories
    .filter(cat => cat.type !== 'income')
    .forEach(category => {
      const categoryTransactions = transactions.filter((t: Transaction) => t.category_id === category.id);
      const total = categoryTransactions.reduce((sum, t: Transaction) => sum + Math.abs(t.amount), 0);
      if (total > 0) {
        waterfallData.push({
          name: category.name,
          value: -total,
          cumulative: cumulative - total,
          type: 'expense',
          color: categoryTypeColors[category.type as CategoryType] || '#FF6B6B'
        });
        cumulative -= total;
      }
    });

  // Add net savings
  waterfallData.push({
    name: 'Net Savings',
    value: totalSavings,
    cumulative: totalSavings,
    type: 'net',
    color: '#8B5CF6'
  });

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
