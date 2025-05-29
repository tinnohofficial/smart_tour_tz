const axios = require('axios');

class ExchangeRateService {
  constructor() {
    this.baseUrl = process.env.EXCHANGE_RATE_BASE_URL || 'https://api.exchangerate-api.com/v4/latest/USD';
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY;
    this.fallbackRates = {
      USD_TZS: 2500,  // 1 USD = 2500 TZS
      USD_USDT: 1.0,  // 1 USD = 1 USDT (stable)
      ETH_USD: 2000,  // 1 ETH = 2000 USD (approximate)
      BTC_USD: 43000  // 1 BTC = 43000 USD (approximate)
    };
    this.cache = {};
    this.cacheExpiry = 300000; // 5 minutes
  }

  // Get live exchange rates from API
  async getLiveRates() {
    try {
      const cacheKey = 'live_rates';
      const now = Date.now();
      
      // Check cache first
      if (this.cache[cacheKey] && (now - this.cache[cacheKey].timestamp) < this.cacheExpiry) {
        return this.cache[cacheKey].data;
      }

      // Fetch from multiple sources for reliability
      const promises = [
        this.fetchFromExchangeRateAPI(),
        this.fetchFromCoinGecko(),
      ];

      const results = await Promise.allSettled(promises);
      
      // Use the first successful result
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          this.cache[cacheKey] = {
            data: result.value,
            timestamp: now
          };
          return result.value;
        }
      }

      throw new Error('All exchange rate APIs failed');
    } catch (error) {
      console.warn('Error fetching live rates, using fallback:', error.message);
      return this.fallbackRates;
    }
  }

  // Fetch from exchange rate API
  async fetchFromExchangeRateAPI() {
    try {
      const response = await axios.get(this.baseUrl, { timeout: 5000 });
      
      if (response.data && response.data.rates) {
        // Convert to our format
        return {
          USD_TZS: response.data.rates.TZS || this.fallbackRates.USD_TZS,
          USD_USDT: 1.0, // USDT is pegged to USD
          ETH_USD: 1 / (response.data.rates.ETH || 0.0005), // Approximate ETH rate
          BTC_USD: 1 / (response.data.rates.BTC || 0.000023) // Approximate BTC rate
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.warn('Exchange rate API failed:', error.message);
      return null;
    }
  }

  // Fetch crypto rates from CoinGecko
  async fetchFromCoinGecko() {
    try {
      const cryptoResponse = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,tether&vs_currencies=usd',
        { timeout: 5000 }
      );

      // For TZS rate, try a forex API
      const forexResponse = await axios.get(
        'https://api.fxratesapi.com/latest?base=USD&symbols=TZS',
        { timeout: 5000 }
      );

      const tzsRate = forexResponse.data?.rates?.TZS || this.fallbackRates.USD_TZS;

      return {
        USD_TZS: tzsRate,
        USD_USDT: cryptoResponse.data.tether?.usd || 1.0,
        ETH_USD: cryptoResponse.data.ethereum?.usd || this.fallbackRates.ETH_USD,
        BTC_USD: cryptoResponse.data.bitcoin?.usd || this.fallbackRates.BTC_USD
      };
    } catch (error) {
      console.warn('CoinGecko API failed:', error.message);
      return null;
    }
  }

  // Convert TZS to USD
  async convertTzsToUsd(tzsAmount) {
    try {
      const rates = await this.getLiveRates();
      return tzsAmount / rates.USD_TZS;
    } catch (error) {
      console.warn('Error converting TZS to USD:', error.message);
      return tzsAmount / this.fallbackRates.USD_TZS;
    }
  }

  // Convert USD to TZS
  async convertUsdToTzs(usdAmount) {
    try {
      const rates = await this.getLiveRates();
      return usdAmount * rates.USD_TZS;
    } catch (error) {
      console.warn('Error converting USD to TZS:', error.message);
      return usdAmount * this.fallbackRates.USD_TZS;
    }
  }

  // Convert TZS to USDT
  async convertTzsToUsdt(tzsAmount) {
    try {
      const rates = await this.getLiveRates();
      const usdAmount = tzsAmount / rates.USD_TZS;
      return usdAmount * rates.USD_USDT;
    } catch (error) {
      console.warn('Error converting TZS to USDT:', error.message);
      const usdAmount = tzsAmount / this.fallbackRates.USD_TZS;
      return usdAmount * this.fallbackRates.USD_USDT;
    }
  }

  // Convert USDT to TZS
  async convertUsdtToTzs(usdtAmount) {
    try {
      const rates = await this.getLiveRates();
      const usdAmount = usdtAmount / rates.USD_USDT;
      return usdAmount * rates.USD_TZS;
    } catch (error) {
      console.warn('Error converting USDT to TZS:', error.message);
      const usdAmount = usdtAmount / this.fallbackRates.USD_USDT;
      return usdAmount * this.fallbackRates.USD_TZS;
    }
  }

  // Get conversion rates for frontend display
  async getConversionRates(tzsAmount) {
    try {
      const rates = await this.getLiveRates();
      const usdAmount = tzsAmount / rates.USD_TZS;
      
      return {
        tzs: tzsAmount,
        usd: usdAmount,
        usdt: usdAmount * rates.USD_USDT,
        eth: usdAmount / rates.ETH_USD,
        btc: usdAmount / rates.BTC_USD,
        rates: rates
      };
    } catch (error) {
      console.warn('Error getting conversion rates:', error.message);
      const usdAmount = tzsAmount / this.fallbackRates.USD_TZS;
      
      return {
        tzs: tzsAmount,
        usd: usdAmount,
        usdt: usdAmount * this.fallbackRates.USD_USDT,
        eth: usdAmount / this.fallbackRates.ETH_USD,
        btc: usdAmount / this.fallbackRates.BTC_USD,
        rates: this.fallbackRates
      };
    }
  }

  // Clear cache (useful for testing)
  clearCache() {
    this.cache = {};
  }
}

module.exports = new ExchangeRateService();