// Shared date formatting utilities
import { format } from "date-fns";

/**
 * Formats a date string to a localized date
 * @param {string} dateString - The date string to format
 * @param {string} fallback - Fallback text if date is invalid
 * @returns {string} Formatted date or fallback
 */
export const formatDate = (dateString, fallback = "N/A") => {
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString();
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return fallback;
  }
};

/**
 * Formats a date using date-fns format function
 * @param {string|Date} dateString - The date to format
 * @param {string} formatStr - The format string (default: "MMM dd, yyyy")
 * @param {string} fallback - Fallback text if date is invalid
 * @returns {string} Formatted date or fallback
 */
export const formatDateWithFormat = (dateString, formatStr = "MMM dd, yyyy", fallback = "N/A") => {
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return fallback;
    return format(date, formatStr);
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return fallback;
  }
};

/**
 * Formats a date range
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @param {string} separator - Separator between dates (default: " - ")
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate, separator = " - ") => {
  return `${formatDate(startDate)} ${separator} ${formatDate(endDate)}`;
};

/**
 * Formats a date for booking display (user-friendly format)
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date in user-friendly format
 */
export const formatBookingDate = (dateString) => {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid Date";
  }
};

/**
 * Formats a date using date-fns PPP format (e.g., "December 25, 2023")
 * @param {string|Date} dateString - The date to format
 * @param {string} fallback - Fallback text if date is invalid
 * @returns {string} Formatted date or fallback
 */
export const formatPrettyDate = (dateString, fallback = "Invalid date") => {
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return fallback;
    return format(date, "PPP");
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return fallback;
  }
};
