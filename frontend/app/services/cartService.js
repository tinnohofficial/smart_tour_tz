import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance with auth token and timeout
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const cartService = {
  // Get active cart
  async getActiveCart() {
    try {
      const response = await api.get("/cart");
      return response.data;
    } catch (error) {
      console.error("Cart fetch error:", error);
      if (error.code === "ECONNABORTED") {
        throw new Error("Request timeout - please check your connection");
      }
      throw new Error(error.response?.data?.message || "Failed to fetch cart");
    }
  },

  // Add booking to cart
  async addToCart(bookingData) {
    try {
      // Validate required fields before sending
      if (
        !bookingData.destinationId ||
        !bookingData.touristFullName ||
        !bookingData.startDate ||
        !bookingData.endDate
      ) {
        throw new Error("Missing required booking information");
      }

      const response = await api.post("/cart/add", bookingData);
      return response.data;
    } catch (error) {
      console.error("Add to cart error:", error);
      if (error.code === "ECONNABORTED") {
        throw new Error("Request timeout - please try again");
      }
      throw new Error(error.response?.data?.message || "Failed to add to cart");
    }
  },

  // Remove booking from cart
  async removeFromCart(bookingId) {
    try {
      if (!bookingId) {
        throw new Error("Booking ID is required");
      }

      const response = await api.delete(`/cart/remove/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error("Remove from cart error:", error);
      if (error.code === "ECONNABORTED") {
        throw new Error("Request timeout - please try again");
      }
      throw new Error(
        error.response?.data?.message || "Failed to remove from cart",
      );
    }
  },

  // Checkout cart
  async checkoutCart(paymentData) {
    try {
      if (!paymentData.paymentMethod) {
        throw new Error("Payment method is required");
      }

      const response = await api.post("/cart/checkout", paymentData);
      return response.data;
    } catch (error) {
      console.error("Checkout error:", error);
      if (error.code === "ECONNABORTED") {
        throw new Error("Checkout timeout - please try again");
      }
      if (error.response?.status === 400) {
        throw new Error(
          error.response.data?.message || "Invalid checkout request",
        );
      }
      throw new Error(error.response?.data?.message || "Checkout failed");
    }
  },

  // Clear cart
  async clearCart() {
    try {
      const response = await api.delete("/cart/clear");
      return response.data;
    } catch (error) {
      console.error("Clear cart error:", error);
      if (error.code === "ECONNABORTED") {
        throw new Error("Request timeout - please try again");
      }
      throw new Error(error.response?.data?.message || "Failed to clear cart");
    }
  },
};
