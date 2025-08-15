-- Create missing database functions needed for the application

-- Function to update account balance (used by transaction service)
CREATE OR REPLACE FUNCTION update_account_balance(
    account_id UUID,
    amount_change NUMERIC
) RETURNS VOID AS $$
BEGIN
    UPDATE accounts 
    SET balance = balance + amount_change,
        updated_at = NOW()
    WHERE id = account_id;
    
    -- Verify the account exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account with id % not found', account_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get account balance
CREATE OR REPLACE FUNCTION get_account_balance(account_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    current_balance NUMERIC;
BEGIN
    SELECT balance INTO current_balance
    FROM accounts
    WHERE id = account_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account with id % not found', account_id;
    END IF;
    
    RETURN current_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate net worth for a family
CREATE OR REPLACE FUNCTION calculate_family_net_worth(family_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_assets NUMERIC := 0;
    total_liabilities NUMERIC := 0;
BEGIN
    -- Calculate total assets (positive balances + investments)
    SELECT COALESCE(SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END), 0)
    INTO total_assets
    FROM accounts
    WHERE family_id = family_id_param
    AND type IN ('checking', 'savings', 'cash', 'investment')
    AND is_active = true;
    
    -- Calculate total liabilities (credit cards, loans)
    SELECT COALESCE(SUM(CASE WHEN balance < 0 THEN ABS(balance) ELSE 0 END), 0)
    INTO total_liabilities
    FROM accounts
    WHERE family_id = family_id_param
    AND type IN ('credit_card', 'loan')
    AND is_active = true;
    
    RETURN total_assets - total_liabilities;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the functions
SELECT 'Functions created successfully' as status;

-- Show current accounts and their balances
SELECT id, name, type, balance 
FROM accounts 
WHERE is_active = true
ORDER BY name;