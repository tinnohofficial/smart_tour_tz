import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { cartService } from "../services/cartService";
import { getUserData, clearAuthData, getAuthToken } from "../utils/auth";

// Helper function to check if current user is a tourist
const isTourist = () => {
  if (typeof window === "undefined") return false;
  const user = getUserData() || "{}";
  return user.role === "tourist";
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      error: null,
      lastSyncTimestamp: null,

      // Set cart data
      setCart: (cart) => {
        set({
          cart,
          lastSyncTimestamp: Date.now(),
        });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Get active cart with sync logic
      fetchCart: async (forceRefresh = false) => {
        // Only allow cart operations for tourists
        if (!isTourist()) {
          return null;
        }

        const { lastSyncTimestamp } = get();
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        // Skip fetch if recently synced and cart exists (unless forced)
        if (
          !forceRefresh &&
          lastSyncTimestamp &&
          now - lastSyncTimestamp < fiveMinutes &&
          get().cart
        ) {
          return get().cart;
        }

        set({ isLoading: true, error: null });
        try {
          const cart = await cartService.getActiveCart();
          set({
            cart,
            isLoading: false,
            lastSyncTimestamp: now,
          });
          return cart;
        } catch (error) {
          console.error("Error fetching cart:", error);
          set({ error: error.message, isLoading: false });

          // Only show toast if it's a user-initiated action
          if (forceRefresh) {
            toast.error("Failed to fetch cart");
          }
          return null;
        }
      },

      // Sync cart with server (used when page loads or becomes visible)
      syncCart: async () => {
        // Only sync for tourists
        if (!isTourist()) {
          return;
        }

        try {
          await get().fetchCart(true);
        } catch (error) {
          // Silently handle sync errors
          console.error("Cart sync error:", error);
        }
      },

      // Add booking to cart
      addToCart: async (bookingData) => {
        if (!isTourist()) {
          toast.error("Cart functionality is only available for tourists");
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const result = await cartService.addToCart(bookingData);

          // Refresh cart after adding
          await get().fetchCart(true);

          toast.success("Destination added to cart!");
          return result;
        } catch (error) {
          console.error("Error adding to cart:", error);
          set({ error: error.message, isLoading: false });
          toast.error(error.message);
          throw error;
        }
      },

      // Remove booking from cart
      removeFromCart: async (bookingId) => {
        if (!isTourist()) {
          toast.error("Cart functionality is only available for tourists");
          return;
        }

        set({ isLoading: true, error: null });
        try {
          await cartService.removeFromCart(bookingId);

          // Refresh cart after removal
          await get().fetchCart(true);

          toast.success("Booking removed from cart");
        } catch (error) {
          console.error("Error removing from cart:", error);
          set({ error: error.message, isLoading: false });
          toast.error(error.message);
          throw error;
        }
      },

      // Checkout cart
      checkoutCart: async (paymentData) => {
        if (!isTourist()) {
          toast.error("Cart functionality is only available for tourists");
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const result = await cartService.checkoutCart(paymentData);

          // Clear cart after successful checkout
          set({ cart: null, lastSyncTimestamp: Date.now() });

          toast.success(
            "Payment successful! Your bookings have been confirmed.",
          );
          return result;
        } catch (error) {
          console.error("Error during checkout:", error);
          set({ error: error.message, isLoading: false });
          toast.error(error.message);
          throw error;
        }
      },

      // Clear cart
      clearCart: async () => {
        if (!isTourist()) {
          toast.error("Cart functionality is only available for tourists");
          return;
        }

        set({ isLoading: true, error: null });
        try {
          await cartService.clearCart();
          set({ cart: null, isLoading: false, lastSyncTimestamp: Date.now() });
          toast.success("Cart cleared");
        } catch (error) {
          console.error("Error clearing cart:", error);
          set({ error: error.message, isLoading: false });
          toast.error(error.message);
          throw error;
        }
      },

      // Get cart item count
      getCartItemCount: () => {
        if (!isTourist()) {
          return 0;
        }
        const { cart } = get();
        return cart?.bookings?.length || 0;
      },

      // Get cart total
      getCartTotal: () => {
        if (!isTourist()) {
          return 0;
        }
        const { cart } = get();
        return cart?.total_cost || 0;
      },

      // Check if cart is empty
      isCartEmpty: () => {
        if (!isTourist()) {
          return true;
        }
        const { cart } = get();
        return !cart || !cart.bookings || cart.bookings.length === 0;
      },
    }),
    {
      name: "smart-tour-cart", // Storage key
      partialize: (state) => ({
        cart: state.cart,
        lastSyncTimestamp: state.lastSyncTimestamp,
      }), // Only persist cart data and timestamp, not loading states
      version: 1,
      migrate: (persistedState, version) => {
        // Handle future state migrations if needed
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        // Sync cart when store is rehydrated from storage (only for tourists)
        if (state?.cart && isTourist()) {
          // Trigger background sync to ensure cart is up to date
          setTimeout(() => {
            state.syncCart?.();
          }, 100);
        }
      },
    },
  ),
);

// Page visibility API integration for cart syncing
if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && isTourist()) {
      // Page became visible, sync cart (only for tourists)
      const store = useCartStore.getState();
      store.syncCart?.();
    }
  });
}
