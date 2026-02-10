/**
 * Currency Utilities
 * Handles currency formatting and display
 */

// Map of currency codes to symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    SEK: 'kr',
    NZD: 'NZ$',
    SGD: 'S$',
};

/**
 * Get currency symbol  for a currency code
 * @param code - ISO currency code (e.g., 'USD')
 * @returns Currency symbol
 */
export const getCurrencySymbol = (code: string): string => {
    return CURRENCY_SYMBOLS[code] || code;
};

/**
 * Format amount with currency code
 * @param amount - Amount to format
 * @param currency - Currency code
 * @returns Formatted string (e.g., "$1,234.56 USD")
 */
export const formatCurrencyWithCode = (amount: number, currency: string): string => {
    const symbol = getCurrencySymbol(currency);
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    return `${symbol}${formatted} ${currency}`;
};

/**
 * Format amount with just the symbol (no code)
 * @param amount - Amount to format
 * @param currency - Currency code
 * @returns Formatted string (e.g., "$1,234.56")
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    const symbol = getCurrencySymbol(currency);
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);

    return `${symbol}${formatted}`;
};
