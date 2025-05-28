// Currency formatting utilities for Tanzania Shillings (TZS)

/**
 * Formats a number as TZS currency
 * @param {number} amount - The amount to format
 * @param {boolean} showDecimals - Whether to show decimal places (default: true)
 * @returns {string} Formatted TZS amount
 */
export const formatTZS = (amount, showDecimals = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showDecimals ? "TZS 0.00" : "TZS 0";
  }
  
  const numericAmount = parseFloat(amount);
  
  if (showDecimals) {
    return `TZS ${numericAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  } else {
    return `TZS ${Math.round(numericAmount).toLocaleString('en-US')}`;
  }
};

/**
 * Formats a number as TZS currency with short notation for large amounts
 * @param {number} amount - The amount to format
 * @returns {string} Formatted TZS amount with short notation (K, M, B)
 */
export const formatTZSShort = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "TZS 0";
  }
  
  const numericAmount = parseFloat(amount);
  
  if (numericAmount >= 1000000000) {
    return `TZS ${(numericAmount / 1000000000).toFixed(1)}B`;
  } else if (numericAmount >= 1000000) {
    return `TZS ${(numericAmount / 1000000).toFixed(1)}M`;
  } else if (numericAmount >= 1000) {
    return `TZS ${(numericAmount / 1000).toFixed(1)}K`;
  } else {
    return formatTZS(numericAmount);
  }
};

/**
 * Parses a TZS currency string to a number
 * @param {string} currencyString - The TZS currency string to parse
 * @returns {number} The numeric value
 */
export const parseTZS = (currencyString) => {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }
  
  // Remove TZS prefix, commas, and any extra whitespace
  const cleanString = currencyString
    .replace(/TZS\s*/i, '')
    .replace(/,/g, '')
    .trim();
  
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Currency symbol for Tanzania Shillings
 */
export const TZS_SYMBOL = 'TZS';

/**
 * Default currency formatting options
 */
export const CURRENCY_OPTIONS = {
  style: 'currency',
  currency: 'TZS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
};
