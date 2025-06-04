# Smart Tour Tanzania - Cart System Documentation

## Overview

The cart system allows tourists to add multiple destination bookings to a cart before making a single payment for all of them. This is particularly useful for multi-destination trips where tourists want to book several destinations at once.

## Database Schema

### Tables

#### 1. `booking_carts`
- **Purpose**: Stores cart metadata for each tourist
- **Key Fields**:
  - `id`: Primary key
  - `tourist_user_id`: Foreign key to users table
  - `total_cost`: Running total of all bookings in cart
  - `status`: 'active', 'completed', 'cancelled'
  - `created_at`: Timestamp

#### 2. `bookings`
- **Purpose**: Individual destination bookings that can be linked to a cart
- **Key Fields**:
  - `id`: Primary key
  - `cart_id`: Foreign key to booking_carts (nullable for direct bookings)
  - `tourist_user_id`: Foreign key to users table
  - `destination_id`: Foreign key to destinations table
  - `total_cost`: Cost for this specific booking
  - `status`: 'in_cart', 'pending_payment', 'confirmed', 'completed', 'cancelled'
  - Include flags: `include_transport`, `include_hotel`, `include_activities`

#### 3. `booking_items`
- **Purpose**: Individual services within each booking
- **Key Fields**:
  - `id`: References the actual item (hotel.id, transport.id, activity.id, etc.)
  - `booking_id`: Foreign key to bookings table
  - `item_type`: 'hotel', 'transport', 'tour_guide', 'activity', 'placeholder'
  - `cost`: Cost for this specific item
  - `sessions`: Number of sessions (for activities)
  - `provider_status`: 'pending', 'confirmed', 'rejected'

#### 4. `payments`
- **Purpose**: Payment records for cart or individual booking transactions
- **Key Fields**:
  - `cart_id`: Foreign key to booking_carts (for multi-booking payments)
  - `booking_id`: Foreign key to bookings (for single booking payments)
  - `payment_method`: 'savings', 'stripe', 'crypto', 'external'
  - `status`: 'successful', 'failed', 'pending'

## Business Flow

### 1. Adding Items to Cart
1. Tourist visits `/book/[destinationId]` page
2. Tourist fills booking form with dates, services, etc.
3. Tourist clicks "Add to Cart" (instead of "Pay Now")
4. System creates/finds active cart for user
5. System creates booking with status 'in_cart'
6. System creates booking_items for selected services
7. System updates cart total_cost
8. Tourist is redirected to `/cart` page

### 2. Cart Management
1. Tourist visits `/cart` page
2. System displays all bookings with status 'in_cart'
3. Tourist can:
   - Remove individual bookings
   - Clear entire cart
   - Proceed to checkout

### 3. Checkout Process
1. Tourist selects payment method
2. System validates cart has items and total > 0
3. System processes payment based on method:
   - **Savings**: Deducts from user balance
   - **Stripe**: Processes card payment
   - **Crypto**: Handles blockchain payment
4. On successful payment:
   - Cart status → 'completed'
   - All bookings status → 'confirmed'
   - Creates payment record
5. Tourist redirected to bookings page

## API Endpoints

### GET `/api/cart`
- **Purpose**: Get or create active cart for authenticated tourist
- **Response**: Cart object with bookings and items
- **Auth**: Required (tourist role only)

### POST `/api/cart/add`
- **Purpose**: Add a new booking to cart
- **Body**: Booking data (destination, dates, services, etc.)
- **Response**: Success message with booking details
- **Auth**: Required (tourist role only)

### DELETE `/api/cart/remove/:bookingId`
- **Purpose**: Remove specific booking from cart
- **Response**: Success message
- **Auth**: Required (tourist role only)

### POST `/api/cart/checkout`
- **Purpose**: Process payment for all cart items
- **Body**: Payment method and related data
- **Response**: Payment confirmation details
- **Auth**: Required (tourist role only)

### DELETE `/api/cart/clear`
- **Purpose**: Remove all bookings from cart
- **Response**: Success message
- **Auth**: Required (tourist role only)

## Frontend Implementation

### State Management (Zustand)
- **Store**: `useCartStore` in `/app/store/cartStore.js`
- **Features**:
  - Automatic cart syncing
  - Cache management (5-minute sync intervals)
  - Role-based access control
  - Optimistic UI updates
  - Error handling with toast notifications

### Components
- **CartComponent**: Main cart display and management with integrated payment dialog
- **CartPage**: Cart page wrapper (simplified after payment integration)
- **PaymentDialog**: Reusable payment component used by both cart and booking
- **Navbar**: Shows cart item count badge for tourists

### Integration Points
- **Booking Form**: "Add to Cart" vs "Pay Now" options (both use same PaymentDialog)
- **Navigation**: Cart icon with item count in navbar
- **Payment Flow**: Unified payment dialog for both single bookings and cart checkout
- **Consistent UX**: Same payment experience across booking and cart flows

## Key Features

### 1. Optimizations Implemented
- **Single Query Loading**: Eliminates N+1 query problem in cart fetching
- **Connection Pooling**: Proper database connection management
- **Row Locking**: Prevents concurrent cart modification issues
- **Bulk Operations**: Efficient cart clearing with bulk deletes
- **Reusable Components**: PaymentDialog component shared between booking and cart

### 2. Error Handling
- **Validation**: Comprehensive input validation on both frontend and backend
- **Timeouts**: Request timeout handling in frontend service
- **Rollbacks**: Database transaction rollbacks on errors
- **User Feedback**: Toast notifications for all operations

### 3. Security
- **Authentication**: All endpoints require valid JWT token
- **Authorization**: Cart access restricted to tourist role only
- **Data Validation**: Server-side validation of all inputs
- **SQL Injection Protection**: Parameterized queries throughout
- **Payment Security**: Consistent payment handling across all booking flows

## Cost Calculation

### Logic
1. **Transport**: Fixed cost per route
2. **Hotel**: Base price × number of nights
3. **Activities**: Price × number of sessions
4. **Tour Guide**: Placeholder (assigned by admin)

### Validation
- All costs validated and sanitized
- Negative costs prevented
- Floating-point precision handling
- Currency formatting in frontend

## Performance Considerations

### Database
- Proper indexing on frequently queried fields
- Optimized JOIN queries
- Connection pooling for concurrent requests
- Row locking for cart modifications

### Frontend
- State persistence with localStorage
- Background sync on page visibility
- Debounced API calls
- Optimistic UI updates

## Error Scenarios Handled

1. **Empty Cart Checkout**: Prevents payment with zero total
2. **Concurrent Modifications**: Row locking prevents conflicts
3. **Network Timeouts**: Graceful degradation with retry options
4. **Invalid Data**: Comprehensive validation prevents bad data
5. **Authentication Issues**: Proper redirect to login
6. **Permission Errors**: Role-based access enforcement

## Future Enhancements

1. **Cart Expiration**: Auto-clear old inactive carts
2. **Quantity Support**: Multiple quantities for same item
3. **Save for Later**: Wishlist functionality
4. **Price Tracking**: Notify on price changes
5. **Group Bookings**: Multiple tourists in same cart

## Payment Integration

### Unified Payment Experience
The cart system now uses the same tested payment dialog as the individual booking flow:

- **PaymentDialog Component**: Extracted from booking page for reuse
- **Consistent UI/UX**: Same payment interface across all booking flows
- **Tested Functionality**: Reuses proven payment logic from individual bookings
- **Payment Methods**: Supports savings (with 5% discount) and Stripe payments
- **Error Handling**: Unified error handling and user feedback
- **Balance Integration**: Real-time balance checking for savings payments

### Implementation Details
- Cart checkout triggers the same PaymentDialog used in `/book/[id]`
- Payment success handler processes cart checkout via backend API
- Maintains discount logic (5% savings discount) for cart payments
- Proper cleanup and navigation after successful payment