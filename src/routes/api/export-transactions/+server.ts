import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  console.log('Export request received');
  console.log('Request headers:', request.headers);
  console.log('Request method:', request.method);

  try {
    const body = await request.json();
    console.log('Request body:', body);
    const { period, referenceDate, transactionType } = body;
    console.log('Extracted parameters:', { period, referenceDate, transactionType });

    // Validate input
    if (!period || !referenceDate || !transactionType) {
      console.log('Missing required parameters:', { period, referenceDate, transactionType });
      return json({ message: 'Missing required parameters' }, { status: 400 });
    }

    const session = await locals.supabase.auth.getSession();
    console.log('Session:', session);
    if (!session.data.session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.data.session.user.id;

    // Get family_id from users table instead of metadata
    const { data: userData, error: userError } = await locals.supabase
      .from('users')
      .select('family_id')
      .eq('id', userId)
      .single();
    console.log('User data:', userData);
    console.log('User error:', userError);

    if (userError || !userData?.family_id) {
      console.log('User data:', userData);
      console.log('User error:', userError);
      return json({ message: 'User not found or unauthorized' }, { status: 401 });
    }

    const familyId = userData.family_id;
    const startDate = new Date(referenceDate);
    console.log('Start date:', startDate);

    const endDate = calculateEndDate(period, new Date(startDate));
    console.log('End date:', endDate);

    let query = locals.supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name)
      `)
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .lte('transaction_date', endDate.toISOString().split('T')[0])
      .eq('family_id', familyId)
      .order('transaction_date', { ascending: false });
    console.log('Query:', query);

    const { data: transactions, error: fetchError } = await query;
    console.log('Transactions:', transactions);
    console.log('Fetch error:', fetchError);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return json({ message: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Filter by type if needed
    const filteredTransactions = filterTransactionsByType(transactions || [], transactionType);
    console.log('Filtered transactions:', filteredTransactions);

    // Log the export request
    try {
      const { error: logError } = await locals.supabase
        .from('export_requests')
        .insert({
          user_id: userId,
          period_type: period,
          transaction_count: filteredTransactions.length
        });
      console.log('Log error:', logError);

      if (logError) {
        console.error('Failed to log export request:', logError);
      }
    } catch (logErr) {
      console.error('Exception while logging export request:', logErr);
    }

    // Generate CSV
    const csv = generateCSV(filteredTransactions);
    console.log('Generated CSV:', csv);

    // Return as downloadable file
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${period}-${startDate.toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: unknown) {
    console.error('Export error:', error);
    console.log('Error message:', error instanceof Error ? error.message : 'Internal server error');
    return json({ message: 'Internal server error' }, { status: 500 });
  }
};

// Helper functions
function calculateEndDate(period: string, startDate: Date): Date {
  const endDate = new Date(startDate);
  
  switch (period) {
    case 'day':
      // For a single day, end date is the same as start date
      return new Date(startDate);
    case 'week':
      // For a week, add 6 days to get the end date
      endDate.setDate(startDate.getDate() + 6);
      return endDate;
    case 'month':
      // For a month, set to the last day of the month
      endDate.setFullYear(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      return endDate;
    default:
      // Default to the same day
      return new Date(startDate);
  }
}

function filterTransactionsByType(transactions: any[], type: string): any[] {
  if (type === 'all') return transactions;
  
  return transactions.filter(transaction => {
    const amount = parseFloat(transaction.amount);
    return type === 'income' ? amount > 0 : amount < 0;
  });
}

function generateCSV(transactions: any[]): string {
  if (transactions.length === 0) {
    return 'Date,Description,Amount,Category,Type\nNo transactions found for the selected period';
  }

  const headers = ['Date', 'Description', 'Amount', 'Category', 'Type'];
  const rows = transactions.map(t => [
    t.transaction_date ? t.transaction_date.split('T')[0] : '',
    t.description || '',
    Math.abs(parseFloat(t.amount)).toFixed(2),
    t.category?.name || t.categoryId || '',
    parseFloat(t.amount) > 0 ? 'Income' : 'Expense'
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}