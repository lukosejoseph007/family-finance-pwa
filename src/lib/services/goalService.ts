import { supabase } from '$lib/supabaseClient';
import type { Goal, GoalFormData } from '$lib/types';

// Core goal operations
export async function createGoal(goalData: GoalFormData): Promise<Goal> {
	const { familyId } = await getUserContext();
	const targetAmount = parseFloat(goalData.target_amount);
	
	const { data, error } = await supabase
		.from('goals')
		.insert([
			{
				family_id: familyId,
				name: goalData.name,
				type: goalData.type,
				target_amount: targetAmount,
				target_date: goalData.target_date || null,
				current_amount: 0,
				is_completed: false
			}
		])
		.select('*')
		.single();

	if (error) throw new Error(`Failed to create goal: ${error.message}`);
	return data;
}

export async function getFamilyGoals(): Promise<Goal[]> {
	const { familyId } = await getUserContext();
	
	const { data, error } = await supabase
		.from('goals')
		.select(`
			*,
			category:categories(name, type)
		`)
		.eq('family_id', familyId)
		.order('is_completed', { ascending: true })
		.order('target_date', { ascending: true });

	if (error) throw new Error(`Failed to fetch goals: ${error.message}`);
	return data || [];
}

export async function updateGoalProgress(
	goalId: string,
	amount: number
): Promise<Goal> {
	const { data: goal, error: fetchError } = await supabase
		.from('goals')
		.select('current_amount, target_amount, is_completed')
		.eq('id', goalId)
		.single();

	if (fetchError) throw new Error(`Failed to fetch goal: ${fetchError.message}`);

	const newAmount = Math.min(
		goal.current_amount + amount,
		goal.target_amount
	);
	const isCompleted = newAmount >= goal.target_amount;

	const { data, error } = await supabase
		.from('goals')
		.update({
			current_amount: newAmount,
			is_completed: isCompleted,
			updated_at: new Date().toISOString()
		})
		.eq('id', goalId)
		.select('*')
		.single();

	if (error) throw new Error(`Failed to update goal progress: ${error.message}`);
	return data;
}

export async function deleteGoal(goalId: string): Promise<void> {
	const { error } = await supabase
		.from('goals')
		.delete()
		.eq('id', goalId);

	if (error) throw new Error(`Failed to delete goal: ${error.message}`);
}

// Helper function to get authenticated user and family info
async function getUserContext(): Promise<{ familyId: string }> {
	const { data: authUser, error: authError } = await supabase.auth.getUser();
	if (authError || !authUser.user) {
		throw new Error('User not authenticated');
	}

	const { data: user, error: userError } = await supabase
		.from('users')
		.select('family_id')
		.eq('id', authUser.user.id)
		.single();

	if (userError || !user?.family_id) {
		throw new Error('User is not part of a family');
	}

	return { familyId: user.family_id };
}

// Validation
export function validateGoalData(data: GoalFormData): string[] {
	const errors: string[] = [];
	const targetAmount = parseFloat(data.target_amount);

	if (!data.name?.trim()) errors.push('Goal name is required');
	if (isNaN(targetAmount) || targetAmount <= 0) {
		errors.push('Target amount must be a positive number');
	}
	if (data.target_date && new Date(data.target_date) < new Date()) {
		errors.push('Target date cannot be in the past');
	}

	return errors;
}