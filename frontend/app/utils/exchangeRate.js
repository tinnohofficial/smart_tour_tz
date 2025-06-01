/**
 * Simplified Exchange Rate Utility (Frontend)
 * 
 * This utility replaces the complex exchangeRateService.js with a much simpler approach:
 * - Directly calls https://api.fxratesapi.com/latest?base=USD&symbols=TZS
 * - Assumes 1 USDC = 1 USD (since USDC is pegged to USD)
 * - No complex multi-step conversions (USDC -> USD -> TZS)
 * - Simple caching mechanism for better performance
 * - Fallback rate of 2500 TZS = 1 USD if API fails
 * - Uses fetch API instead of axios for frontend compatibility
 */
class ExchangeRateUtil {
  constructor() {
    this.fallbackRate = 2500; // 1 USD = 2500 TZS fallback
    this.cache = {};
    this.cacheExpiry = 300000; // 5 minutes
  }

  // Get USD to TZS exchange rate from the API
  async getUsdToTzsRate() {
    try {
      const cacheKey = 'usd_tzs_rate';
      const now = Date.now();
      
      // Check cache first
      if (this.cache[cacheKey] && (now - this.cache[cacheKey].timestamp) < this.cacheExpiry) {
        return this.cache[cacheKey].rate;
      }

      // Fetch from API
      const response = await fetch('https://api.fxratesapi.com/latest?base=USD&symbols=TZS', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.rates && data.rates.TZS) {
        const rate = data.rates.TZS;
        
        // Cache the result
        this.cache[cacheKey] = {
          rate: rate,
          timestamp: now
        };
        
        return rate;
      }
      
      throw new Error('Invalid API response');
    } catch (error) {
      console.warn('Error fetching USD to TZS rate, using fallback:', error.message);
      return this.fallbackRate;
    }
  }

  // Convert TZS to USDC (since 1 USDC = 1 USD)
  async convertTzsToUsdc(tzsAmount) {
    try {
      const usdToTzsRate = await this.getUsdToTzsRate();
      return tzsAmount / usdToTzsRate;
    } catch (error) {
      console.warn('Error converting TZS to USDC:', error.message);
      return tzsAmount / this.fallbackRate;
    }
  }

  // Convert USDC to TZS (since 1 USDC = 1 USD)
  async convertUsdcToTzs(usdcAmount) {
    try {
      const usdToTzsRate = await this.getUsdToTzsRate();
      return usdcAmount * usdToTzsRate;
    } catch (error) {
      console.warn('Error converting USDC to TZS:', error.message);
      return usdcAmount * this.fallbackRate;
    }
  }

  // Clear cache (useful for testing)
  clearCache() {
    this.cache = {};
  }
}

// Export singleton instance
export default new ExchangeRateUtil();