/**
 * Chart.js Utilities and Configuration
 * Provides common chart configurations and utilities for financial visualizations
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
  type ChartData,
  type ChartOptions
} from 'chart.js';

import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
);

// Color palette for financial charts
export const CHART_COLORS = {
  income: '#10B981',      // Green
  expense: '#EF4444',     // Red
  savings: '#3B82F6',     // Blue
  investment: '#8B5CF6',  // Purple
  debt: '#F59E0B',        // Orange
  budget: '#6B7280',      // Gray
  actual: '#1F2937'       // Dark gray
} as const;

export const CHART_BACKGROUNDS = {
  income: '#10B98120',
  expense: '#EF444420',
  savings: '#3B82F620',
  investment: '#8B5CF620',
  debt: '#F59E0B20',
  budget: '#6B728020',
  actual: '#1F293720'
} as const;

// Common chart options
export const DEFAULT_CHART_OPTIONS: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        font: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#374151',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: function(context) {
          const value = context.parsed.y;
          return `${context.dataset.label}: $${value.toLocaleString()}`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: '#E5E7EB'
      },
      ticks: {
        callback: function(value) {
          return '$' + (value as number).toLocaleString();
        },
        font: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 11
        }
      }
    },
    x: {
      grid: {
        color: '#E5E7EB'
      },
      ticks: {
        font: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 11
        }
      }
    }
  }
};

// Line chart specific options
export const LINE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      callbacks: {
        label: function(context: { dataset: { label: string }; parsed: { y: number } }) {
          const value = context.parsed.y;
          return `${context.dataset.label}: $${value.toLocaleString()}`;
        }
      }
    }
  },
  elements: {
    line: {
      tension: 0.1,
      borderWidth: 2
    },
    point: {
      radius: 4,
      hoverRadius: 6
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value: number) {
          return '$' + value.toLocaleString();
        }
      }
    }
  }
};

// Bar chart specific options
export const BAR_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      callbacks: {
        label: function(context: { dataset: { label: string }; parsed: { y: number } }) {
          const value = context.parsed.y;
          return `${context.dataset.label}: $${value.toLocaleString()}`;
        }
      }
    }
  },
  elements: {
    bar: {
      borderRadius: 4
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value: number) {
          return '$' + value.toLocaleString();
        }
      }
    }
  }
};

// Doughnut chart specific options
export const DOUGHNUT_CHART_OPTIONS: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        usePointStyle: true,
        font: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 12
        },
        generateLabels: function(chart) {
          const data = chart.data;
          if (data.labels?.length && data.datasets.length) {
            return data.labels.map((label, i) => {
              const dataset = data.datasets[0];
              const value = dataset.data[i] as number;
              const total = (dataset.data as number[]).reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              
              const backgroundColor = Array.isArray(dataset.backgroundColor)
                ? dataset.backgroundColor[i] as string
                : dataset.backgroundColor as string;
              
              return {
                text: `${label}: ${percentage}%`,
                fillStyle: backgroundColor,
                strokeStyle: backgroundColor,
                lineWidth: 0,
                pointStyle: 'circle',
                hidden: false,
                index: i
              };
            });
          }
          return [];
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#374151',
      borderWidth: 1,
      cornerRadius: 8,
      callbacks: {
        label: function(context) {
          const value = context.parsed;
          const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${context.label}: $${value.toLocaleString()} (${percentage}%)`;
        }
      }
    }
  },
  cutout: '60%'
};

// Utility functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function generateMonthLabels(months: number = 12): string[] {
  const labels: string[] = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
  }
  
  return labels;
}

export function createExpenseByCategory(data: { category: string; amount: number }[]): ChartData<'doughnut'> {
  const colors = Object.values(CHART_COLORS);
  const backgroundColors = Object.values(CHART_BACKGROUNDS);
  
  return {
    labels: data.map(item => item.category),
    datasets: [
      {
        data: data.map(item => item.amount),
        backgroundColor: backgroundColors.slice(0, data.length),
        borderColor: colors.slice(0, data.length),
        borderWidth: 2
      }
    ]
  };
}

export function createMonthlyTrend(
  incomeData: number[],
  expenseData: number[],
  labels?: string[]
): ChartData<'line'> {
  return {
    labels: labels || generateMonthLabels(incomeData.length),
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: CHART_COLORS.income,
        backgroundColor: CHART_BACKGROUNDS.income,
        fill: false
      },
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: CHART_COLORS.expense,
        backgroundColor: CHART_BACKGROUNDS.expense,
        fill: false
      }
    ]
  };
}

export function createBudgetComparison(
  categories: string[],
  budgetData: number[],
  actualData: number[]
): ChartData<'bar'> {
  return {
    labels: categories,
    datasets: [
      {
        label: 'Budget',
        data: budgetData,
        backgroundColor: CHART_BACKGROUNDS.budget,
        borderColor: CHART_COLORS.budget,
        borderWidth: 1
      },
      {
        label: 'Actual',
        data: actualData,
        backgroundColor: CHART_BACKGROUNDS.actual,
        borderColor: CHART_COLORS.actual,
        borderWidth: 1
      }
    ]
  };
}

export { ChartJS };