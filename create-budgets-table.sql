-- Create the missing budgets table for YNAB Rule 1 implementation

CREATE TABLE IF NOT EXISTS budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format: "YYYY-MM"
    allocated_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    spent_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    available_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one budget per category per month per family
    UNIQUE(family_id, category_id, month_year)
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for budgets
DROP POLICY IF EXISTS "Users can view family budgets" ON budgets;
CREATE POLICY "Users can view family budgets" ON budgets FOR SELECT 
USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage family budgets" ON budgets;
CREATE POLICY "Users can manage family budgets" ON budgets FOR ALL 
USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_family_month ON budgets(family_id, month_year);
CREATE INDEX IF NOT EXISTS idx_budgets_category_month ON budgets(category_id, month_year);

-- Show final status
SELECT 
    'Budgets table created successfully' as status,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budgets') THEN 'YES' ELSE 'NO' END as budgets_table_exists;