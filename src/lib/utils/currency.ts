/**
 * Currency formatting utilities for Indian Rupee (INR)
 */

/**
 * Formats a number as Indian Rupee currency using ISO 4217 code 'INR'
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	}).format(amount);
}

/**
 * Formats a number as Indian Rupee currency with compact notation for large amounts
 */
export function formatCompactCurrency(amount: number): string {
	if (Math.abs(amount) >= 1000000) {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			notation: 'compact',
			minimumFractionDigits: 0,
			maximumFractionDigits: 1
		}).format(amount);
	}
	return formatCurrency(amount);
}

/**
 * Parses a currency string and returns the numeric value
 */
export function parseCurrency(currencyString: string): number {
	// Remove currency symbols, commas, and spaces
	const cleaned = currencyString.replace(/₹|,|\s/g, '').trim();

	const parsed = parseFloat(cleaned);
	return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a number as percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
	return `${value.toFixed(decimals)}%`;
}

/**
 * Formats a number with Indian number system (Lakh, Crore)
 */
export function formatIndianNumber(amount: number): string {
	const absAmount = Math.abs(amount);
	const sign = amount < 0 ? '-' : '';

	if (absAmount >= 10000000) {
		// 1 Crore
		return `${sign}₹${(absAmount / 10000000).toFixed(2)} Cr`;
	} else if (absAmount >= 100000) {
		// 1 Lakh
		return `${sign}₹${(absAmount / 100000).toFixed(2)} L`;
	} else if (absAmount >= 1000) {
		// 1 Thousand
		return `${sign}₹${(absAmount / 1000).toFixed(1)}K`;
	} else {
		return formatCurrency(amount);
	}
}
