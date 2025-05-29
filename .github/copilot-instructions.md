## Overview
Smart Tour Tanzania is a comprehensive tourism booking and management system with three main components:
- **Backend**: Node.js/Express API with MySQL database
- **Frontend**: Next.js React application with modern UI components
- **Blockchain**: Solidity smart contract for savings and payment management

## System Architecture

### Key Actors & Roles
1. **Tourist**: Books tours, manages savings, pays for services
2. **Admin**: Approves accounts, manages destinations/activities, assigns tour guides
3. **Hotel Manager**: Manages hotel info, confirms room bookings
4. **Travel Agent**: Manages transport routes, assigns tickets
5. **Tour Guide**: Manages profile, views assigned tours

### Authentication & Authorization
- JWT-based authentication with role-based access control
- User status flow: `pending_profile` → `pending_approval` → `active`
- Tourists get `active` status immediately; others need profile completion + admin approval
- Each role has specific dashboards and permissions

## Database Schema & Key Tables

### Core Tables
- **users**: Central user table with email, role, status, password
- **bookings**: Main booking records with dates, destination, costs, status
- **booking_items**: Individual booking components (hotel, transport, activities, tour guide)
- **booking_carts**: Shopping cart for multi-destination bookings
- **savings_accounts**: User savings balances for payment
- **payments**: Payment transaction records

### Role-Specific Tables
- **tour_guides**: Profile info, expertise, availability
- **hotels**: Hotel details, pricing, capacity
- **travel_agencies**: Agency info, contact details
- **destinations**: Tourist destinations with costs
- **activities**: Destination activities with scheduling
- **transports**: Transport routes between locations

### Status Enums
- **User Status**: pending_profile, pending_approval, active, rejected, inactive
- **Booking Status**: pending_payment, confirmed, completed, cancelled
- **Provider Status**: pending, confirmed, rejected (for booking items)

## Core Business Flows

### 1. User Registration & Approval Flow
```
1. User registers → status: 'pending_profile' (tourists get 'active')
2. Complete role-specific profile → status: 'pending_approval'
3. Admin reviews application → status: 'active' or 'rejected'
4. Active users can access their role-specific features
```

### 2. Booking Creation & Management Flow
```
Tourist Booking Process:
1. Select destination, dates, flexible options (transport/hotel/activities)
2. Choose specific services: transport route, hotel, activities with schedules
3. System calculates total cost (transport + hotel×nights + activities + destination fees)
4. Creates booking with status 'pending_payment'
5. Creates booking_items for each service with 'pending' provider status
6. Tourist pays (external payment or savings) → booking status: 'confirmed'
7. Service providers confirm their items → provider status: 'confirmed'
8. Admin assigns tour guide to replace placeholder
9. All confirmed → booking status: 'completed'
```

### 2b. Multi-Destination Cart System Flow
```
Cart-based Booking Process:
1. Tourist selects destinations and adds multiple bookings to cart
2. Each cart item maintains destination details, dates, and selected services
3. Cart persists across browser sessions with intelligent sync
4. Tourist reviews all destinations in cart with total cost calculation
5. Single checkout process for all cart items with unified payment
6. All bookings in cart are confirmed simultaneously
7. Service providers receive notifications for multiple confirmed bookings
8. Admin assigns tour guides for each confirmed booking
```

### 3. Service Provider Workflows

#### Hotel Manager Flow:
```
1. Register → complete hotel profile → await approval
2. Receive bookings needing action (status: confirmed, provider_status: pending)
3. Confirm room details (room type, check-in/out dates)
4. Update booking_item provider_status to 'confirmed'
```

#### Travel Agent Flow:
```
1. Register → complete agency profile + transport routes → await approval
2. Receive transport bookings needing action
3. Assign ticket details (departure/arrival times, seat numbers)
4. Update booking_item provider_status to 'confirmed'
```

#### Tour Guide Flow:
```
1. Register → complete profile with expertise/location → await approval
2. Admin assigns guides to bookings based on location and activity expertise
3. Guide availability set to false when assigned
4. View assigned bookings and tourist details
```

### 4. Admin Management Flow
```
1. Review pending applications (all roles except tourists)
2. Approve/reject applications → update user status
3. Manage destinations and activities
4. Assign tour guides to confirmed bookings
5. Monitor system-wide booking status
```

### 5. Payment & Savings System
```
Savings Management:
1. Tourists can deposit funds to savings account (external payment)
2. Savings stored in MySQL database (savings_accounts table)
3. Booking payments can use savings or external payment methods
4. Payment records tracked in payments table

Blockchain Integration:
1. SmartTourVault contract manages USDT balances
2. Supports token swapping via Uniswap for deposits
3. Owner (admin) can withdraw funds and process payments
4. Currently separate from main booking system
```

## Backend API Structure

### Authentication Endpoints (/api/auth)
- `POST /register` - User registration with role
- `POST /login` - User authentication
- `PUT /password` - Update password (authenticated)
- `PUT /email` - Update email (authenticated)
- `PUT /phone` - Update phone (authenticated)

### Booking Endpoints (/api/bookings)
- `POST /` - Create booking (tourist only)
- `POST /:bookingId/pay` - Process payment (tourist only)
- `GET /my-bookings` - Get tourist's bookings
- `GET /hotel-bookings-pending` - Hotel manager bookings needing action
- `POST /hotel-rooms/:itemId/confirm` - Confirm hotel room
- `GET /transport-bookings-pending` - Travel agent bookings needing action
- `POST /transport-tickets/:itemId/assign` - Assign transport ticket
- `GET /unassigned` - Admin: get bookings without tour guides
- `POST /:bookingId/assign-guide` - Admin: assign tour guide
- `GET /eligible-guides/:bookingId` - Admin: get eligible guides for booking

### Profile Management Endpoints
- `/api/tour-guides` - Tour guide profile management
- `/api/hotels` - Hotel management (manager role)
  - `PUT /hotels/manager/availability` - Toggle hotel availability status (hotel manager only)
- `/api/travel-agents` - Travel agency management
- `/api/destinations` - Destination management (admin)
- `/api/activities` - Activity management (admin)

### Data Management
- `/api/applications` - Admin application approval
- `/api/savings` - Savings account management
- `/api/transports` - Transport route management
- `/api/transport-origins` - Transport origins management (admin-only for create/update/delete)

## Frontend Structure

### Layout & Navigation
- Main layout with responsive Navbar
- Role-specific sidebars for admin, hotel manager, travel agent, tour guide
- Route protection based on authentication and roles

### Key Pages by Role

✅ **Recently Fixed Issues**
✅ **Tourist Profile and Authentication Issues Fixed** - **COMPLETE**
  - **Created Tourist Profile Page**: Complete profile page at `/profile` with user information management and integrated bookings view
  - **Fixed Cart Authentication**: Corrected localStorage key reference from 'user' to 'userData' in cart page authentication
  - **Added Login/Register Protection**: Implemented authentication checks to redirect logged-in users away from login and register pages
  - **Role-based Dashboard Redirection**: Added proper role-based redirection for all user types when accessing login/register while authenticated
  - **Integrated My-Bookings**: Created seamless integration of bookings display within the profile page with status tracking
  - **Added Quick Actions**: Profile page includes quick access buttons for savings, cart, and destination browsing
  - **Enhanced User Experience**: Eliminated 404 errors for tourist profile access and improved authentication flow
✅ **React Key Prop Issues Fixed** - **COMPLETE**

#### Admin Interface:
- `/admin/dashboard` - Overview dashboard
- `/admin/applications` - Review pending account applications
- `/admin/destinations` - Manage destinations
- `/admin/activities` - Manage activities
- `/admin/assignments` - Assign tour guides to bookings

#### Hotel Manager Interface:
- `/hotel-manager/dashboard` - Booking overview
- `/hotel-manager/profile` - Hotel profile management
- `/hotel-manager/bookings` - Confirm room reservations

#### Travel Agent Interface:
- `/travel-agent/dashboard` - Transport booking overview
- `/travel-agent/profile` - Agency and route management
- `/travel-agent/bookings` - Assign transport tickets

#### Tour Guide Interface:
- `/tour-guide/dashboard` - Assigned tour overview
- `/tour-guide/profile` - Guide profile and expertise
- `/tour-guide/bookings` - View assigned tours

### State Management
- Zustand stores for:
  - User authentication state (`userStore.js`)
  - Layout state (`layoutStore.js`)
  - Booking flow state (`bookingStore.js`)
  - Cart state with persistence (`cartStore.js`)
  - Admin assignments state (`assignmentsStore.js`)
  - Tour guide bookings state (`tour-guide/bookings/store.js`)
- Local storage for token and user data persistence

### UI Components
- Radix UI components with Tailwind CSS styling
- Responsive design with mobile-first approach
- Toast notifications for user feedback
- Form validation with React Hook Form and Zod

## Blockchain Component

### SmartTourVault Contract
- **Purpose**: Manage user savings in USDT with token swapping capability
- **Features**:
  - Deposit any ERC20 token (auto-swap to USDT via Uniswap)
  - Track user USDT balances
  - Owner-controlled payment processing
  - Admin withdrawal functions

### Integration Points
- ✅ **Fully Integrated with Main Booking System**: Crypto payments work end-to-end in booking flow
- ✅ **Production-Ready Architecture**: Smart contract + database hybrid approach for maximum reliability
- ✅ **Unified Payment Processing**: Single interface handles fiat, savings, and crypto payments seamlessly
- ✅ **Decentralized Payment Verification**: Blockchain verification with database fallback for robustness

### Current System Status & Known Issues

### Implemented Features
✅ User registration and role-based authentication
✅ Role-specific profile completion
✅ Admin application approval system with comprehensive profile details viewing
✅ Flexible booking creation with service selection
✅ Hotel room confirmation workflow
✅ Transport ticket assignment workflow
✅ Tour guide assignment by admin
✅ Savings account management
✅ Payment processing (external, savings, and crypto)
✅ Responsive frontend with role-based dashboards
✅ **Tourist Profile Management System** - **PRODUCTION READY**
  - **Complete Profile Page**: Tourist-specific profile page at `/profile` with personal information management
  - **Integrated Bookings View**: My bookings section integrated directly into profile page with status tracking
  - **Profile Information Updates**: Email and phone number update functionality with backend validation
  - **Quick Actions Panel**: Direct access to savings, cart, and destination browsing from profile
  - **Booking Status Display**: Visual status badges for pending payment, confirmed, completed, and cancelled bookings
  - **Route Protection**: Authenticated route protection preventing unauthorized access
✅ **Authentication Route Protection System** - **PRODUCTION READY**
  - **Login/Register Redirect**: Logged-in users automatically redirected away from login and register pages
  - **Role-based Redirection**: Automatic redirection to appropriate dashboards based on user role
  - **Cart Authentication Fix**: Fixed cart page authentication to use correct localStorage key ('userData' instead of 'user')
  - **Seamless User Experience**: Prevents authentication loops and ensures proper navigation flow
✅ Phone number validation with Tanzania country code (+255) and international phone length validation
✅ **Phone Number Length Validation System** - **PRODUCTION READY**
  - **Backend-Only Validation**: Phone validation handled entirely by backend using libphonenumber-js
  - **International Support**: Supports all international phone number formats via libphonenumber-js
  - **Clean Frontend Experience**: Users can type any length, backend validates and provides clear error messages
  - **Proper Error Handling**: Frontend displays specific backend validation error messages via toast notifications
  - **No Input Restrictions**: Removed complex frontend length limits in favor of robust backend validation
  - **Express-Validator Integration**: Uses express-validator with custom validation function for phone numbers
✅ Currency conversion from USD to TZS throughout the system
✅ Stripe payment integration for fiat deposits
✅ **Transparent Image Compression System** - **PRODUCTION READY**
  - **Silent Background Compression**: Automatic JPEG/PNG/WebP compression with 20-70% size reduction
  - **Intelligent Quality Control**: Dynamic compression settings based on file size and format
  - **Seamless User Experience**: No compression UI clutter - users only see simple upload interface
  - **Multi-format Support**: JPEG, PNG, WebP, GIF with format-specific optimization
  - **Security-first Design**: Comprehensive file validation and malicious content detection
  - **Performance Optimized**: Only compresses files that benefit from compression
  - **Clean Interface**: Simplified upload flow without technical compression details
  - **Full URL Support**: Automatic conversion of relative URLs to full image paths
✅ **Single Image Uploader Component** - **PRODUCTION READY**
  - **Simplified Single Image Interface**: Clean, focused component for single image uploads (destinations admin)
  - **Automatic Upload Processing**: Handles upload automatically with visual feedback
  - **Preview with Change/Remove**: Shows uploaded image with hover controls for changing or removing
  - **Form Integration**: Direct integration with form state via onChange callback
  - **Edit Mode Support**: Properly handles existing image URLs for edit scenarios
  - **Drag & Drop Support**: Intuitive file selection with drag-and-drop or click to browse
  - **Real-time Status Updates**: Loading states and success/error feedback without technical details
✅ **Complete file upload and document management system** - **COMPLETE**
✅ **Unified upload handling across all forms with consistent FileUploader component** - **COMPLETE**
✅ **Backend upload controller with multer integration and file validation** - **COMPLETE**
✅ **Automatic file uploads for hotel images, tour guide licenses, and travel agent documents** - **COMPLETE**
✅ **Static file serving with secure delete functionality** - **COMPLETE**
✅ **End-to-end upload testing verified with authentication and error handling** - **COMPLETE**
✅ **Multi-destination cart system with persistent storage** - **COMPLETE**
✅ **Cart checkout workflow with single payment for multiple destinations** - **COMPLETE**
✅ **Complete tour guide assignment functionality** - **COMPLETE**
✅ **Admin tour guide assignment interface with booking search and filtering** - **COMPLETE**
✅ **Tour guide booking management with tourist contact details** - **COMPLETE**
✅ **Cart persistence across browser sessions with intelligent sync** - **COMPLETE**
✅ **Location-based transport filtering with origin selection** - **COMPLETE**
✅ **Transport origins management system with 20 seeded Tanzania locations** - **COMPLETE**
✅ **Travel agent forms using destination/origin select dropdowns instead of text inputs** - **COMPLETE**
✅ **Booking flow with origin selection before transport route filtering** - **COMPLETE**
✅ **Database schema with transport_origins table and proper foreign key relationships** - **COMPLETE**
✅ **Hotel availability management system with toggle functionality** - **COMPLETE**
✅ **Hotels filtered by availability status in booking flow** - **COMPLETE**
✅ **Hotel manager availability controls in profile dashboard** - **COMPLETE**
✅ **Cart fetch error resolution (environment variable configuration fix)** - **COMPLETE**
✅ **Cart role protection system for non-tourist users** - **COMPLETE**
✅ **Transparent image compression system with seamless user experience** - **COMPLETE**
✅ **Simplified FileUploader component with clean, non-technical interface** - **COMPLETE**
✅ **Automatic full URL generation for uploaded images** - **COMPLETE**
✅ **Enhanced multi-leg transport routing system with detailed journey information** - **COMPLETE**
✅ **Flexible route_details JSON system for complex transport route specifications** - **COMPLETE**
✅ **Advanced booking flow with detailed transport information display** - **COMPLETE**
✅ **Complete Payment and Blockchain Integration System** - **PRODUCTION READY**
  - **Stripe Payment Integration**: Full Stripe integration with demo test keys for secure fiat payments
  - **Enhanced Savings Management**: Unified fiat and crypto balance tracking with live conversion rates
  - **MetaMask Wallet Integration**: Complete Web3 wallet connection with balance monitoring and transaction verification
  - **Automatic Crypto Payments**: Backend automation for vault balance deduction with blockchain transaction processing
  - **Enhanced Payment Dialog**: Unified payment interface supporting Stripe, savings, and crypto payments with real-time rates
  - **Live Exchange Rate Service**: Multi-source exchange rate API with fallback mechanisms for TZS/USD/USDT/ETH/BTC conversion
  - **Blockchain Service Integration**: Complete ethers.js integration with smart contract interactions and event monitoring
  - **Cart and Booking Crypto Support**: Enhanced payment flows for both single bookings and multi-destination checkout
  - **Wallet Management API**: Complete backend API coverage for wallet connection, balance tracking, and payment processing
  - **Comprehensive Error Handling**: Robust error handling and user feedback for all payment scenarios

### Partially Implemented
⚠️ Activity scheduling with time slots (backend complete, frontend needs work)
⚠️ Real-time availability checking (basic implementation)
⚠️ Booking status progression (logic exists, UI needs enhancement)

### Known Issues & Improvements Needed
❌ Activity time slot booking is incomplete
❌ Tour guide expertise matching needs refinement
❌ Email notifications for booking updates
⚠️ Smart contract deployment and production blockchain configuration (demo configuration in place)
✅ Comprehensive error handling implemented for payment and blockchain features
✅ Tourist profile management and authentication flow completely resolved

### Transparent Image Compression Features
✅ **Silent Image Compression**:
  - **Smart Quality Adjustment**: 70-85% quality based on file size (5MB+ → 70%, 2-5MB → 75%, 1-2MB → 80%, <1MB → 85%)
  - **Intelligent Resizing**: Dynamic max dimensions (5MB+ → 1600x900, 2-5MB → 1800x1000, others → 1920x1080)
  - **Format-specific Optimization**: JPEG (progressive, mozjpeg), PNG (palette optimization), WebP (effort 6)
  - **Threshold-based Processing**: Only compresses files >50KB that achieve >5% size reduction
  - **Automatic Format Conversion**: Converts unsupported formats to optimized JPEG

✅ **Seamless File Management**:
  - **Security-first Validation**: Path traversal protection, malicious file detection, filename sanitization
  - **Enhanced File Filtering**: Supports JPEG, PNG, WebP, GIF, PDF, DOC, DOCX, XLS, XLSX, TXT, CSV
  - **Robust Error Handling**: Graceful fallback to original file, silent error handling
  - **File Size Limits**: 10MB maximum with customizable limits per file type
  - **Unique Filename Generation**: Timestamp + crypto hash for collision prevention

✅ **Clean User Experience**:
  - **Simple Upload Interface**: Clean drag-and-drop without technical details
  - **Basic Progress Tracking**: Simple uploading → success status indicators
  - **Clean Feedback**: Simple success/error messages without compression metrics
  - **File Management**: Drag-and-drop interface, file preview, easy removal
  - **Transparent Operation**: Compression happens silently without user awareness

### Recently Fixed Issues
✅ **Recently Fixed Issues**
✅ **React Key Prop Issues Fixed** - **COMPLETE**
  - **Fixed CartComponent booking items using array index**: Changed from `key={index}` to `key={\`${booking.id}-${item.item_type}-${item.id || index}\`}` for unique identification
  - **Fixed FileUploader component**: Changed from `key={index}` to `key={fileId}` using existing unique file identifier
  - **Fixed Travel Agent Profile routes**: Changed from `key={index}` to `key={route.id || \`route-${index}\`}` with fallback
  - **Fixed Admin Applications dialogs**: Multiple fixes for image galleries, document lists, and route listings using descriptive keys
  - **Fixed Admin Assignments activity badges**: Used booking ID and index combination for unique keys across multiple badge lists
  - **Fixed Tour Guide Bookings item listings**: Used tour ID and index combination for hotel, transport, and activity item cards
  - **Fixed Activities Admin table**: Added fallback key for activities with undefined IDs using `key={activity.id || \`activity-${index}\`}`
  - **Comprehensive Search and Fix**: Systematically found and fixed all instances of `key={index}` usage throughout the frontend codebase
  - **Verified Existing Proper Keys**: Confirmed that Select components, table rows, and other major components already had proper unique keys
✅ **Single Image Uploader Implementation for Destinations Admin**: Simplified destination image upload workflow:
  - **Created SingleImageUploader Component**: Clean, focused component for single image uploads with drag-and-drop support
  - **Simplified Admin Interface**: Replaced complex FileUploader with streamlined single image interface for destinations
  - **Automatic Upload Processing**: Images upload automatically with real-time feedback and preview
  - **Clean Form Integration**: Direct integration with destination form state via onChange callbacks
  - **Edit Mode Support**: Properly handles existing image URLs when editing destinations with seamless preview
  - **Removed Complex File Handling**: Eliminated file state management from destinations store in favor of direct URL handling
  - **Fixed Import Issues**: Resolved Loader2 import error and added localhost to Next.js image domains
  - **Enhanced User Experience**: Single upload area that morphs into preview with change/remove controls on hover
✅ **Transparent Image Compression System Implementation**: Completely simplified and cleaned the image compression system:
  - **Silent Backend Compression**: Intelligent image compression using Sharp happens transparently without user awareness
  - **Smart Compression Logic**: Dynamic quality adjustment based on file size (70-85% quality, adaptive sizing)
  - **Multi-format Support**: JPEG, PNG, WebP compression with format-specific settings and fallback conversion
  - **Clean User Interface**: Removed all compression-related UI clutter and technical details from user experience
  - **Performance Optimization**: Only compresses files that benefit (>5% reduction, >50KB threshold)
  - **Enhanced Security**: Comprehensive file validation, path traversal protection, and malicious file detection
  - **Error Resilience**: Graceful fallback to original file if compression fails or isn't beneficial
  - **Full URL Generation**: Backend automatically returns complete image URLs for seamless frontend display

✅ **Simplified FileUploader Component**: Clean, user-friendly upload interface:
  - **Simple Upload Interface**: Clean drag-and-drop interface without technical compression details
  - **Basic Status Indicators**: Simple uploading/success states without compression metrics
  ✅ **File Management**: Standard file preview, removal, and upload functionality
    - **User Experience**: Clear success messages without compression analytics
    - **Clean Design**: Removed compression badges, statistics, and technical information displays
    - **Seamless Integration**: Works transparently with compression happening behind the scenes
    - **Automatic Cleanup**: Uploads directory is cleared when resetting the database

✅ **Full Image URL Support**: Fixed image display issues across the system:
  - **URL Utility Function**: Added `getFullImageUrl()` utility to construct complete image URLs
  - **Service Integration**: Updated destinations service to automatically convert relative URLs to full URLs
  - **Backend URL Generation**: Upload controller now returns complete URLs instead of relative paths
  - **Seamless Image Display**: All images now display correctly throughout the application
  - **Legacy URL Support**: Handles both old relative URLs and new full URLs transparently

✅ **Complete Payment and Blockchain Integration System**: Implemented comprehensive payment infrastructure:
  - **Stripe Payment Integration**: Full Stripe integration with test keys for secure fiat payments
  - **Enhanced Exchange Rate Service**: Live exchange rate API integration with multiple fallback sources
  - **Advanced Blockchain Service**: Complete Web3 integration with MetaMask wallet connection and USDT vault management
  - **Automatic Crypto Payments**: Backend automation for vault balance deduction with blockchain transaction processing
  - **Enhanced Payment Dialog**: Unified payment interface supporting Stripe, savings, and crypto payments with real-time conversion rates
  - **Wallet Management**: Complete wallet connection, balance tracking, and transaction verification
  - **Cart and Booking Integration**: Enhanced payment flows for both single bookings and multi-destination cart checkout
  - **Comprehensive API Endpoints**: Full backend API coverage for wallet management, conversion rates, and crypto payments

✅ **File Upload System Implementation**: Fixed and completed comprehensive upload functionality:
  - Installed missing multer package for backend file uploads
  - Verified end-to-end upload workflow (upload → serve → delete)
  - Updated destinations admin to use consistent FileUploader component
  - Fixed all upload service methods to use proper backend endpoints with authentication
  - Removed broken Next.js API routes that used Vercel Blob storage
  - Tested file upload, static serving, and deletion with proper authentication
  - All forms now use unified upload service with proper error handling and user feedback
✅ **React Table Key Warning**: Fixed unique key prop issue in destinations table by ensuring proper data validation and key generation
✅ **Destination Update Crash**: Fixed undefined variable error in updateDestination function and improved backend response handling
✅ **Cart Role Protection**: Added comprehensive role checking to prevent cart operations for non-tourist users, including:
  - Role validation in all cart store methods (fetchCart, addToCart, removeFromCart, checkoutCart, clearCart)
  - Protected cart synchronization and rehydration processes
  - Safe getter methods (getCartItemCount, getCartTotal) with role checking
  - Prevented "Forbidden: Requires role(s) tourist" errors for admin and other non-tourist users
✅ **Activity Creation Error**: Fixed schema mismatch in activities table by adding missing columns:
  - Added duration_hours, max_participants, difficulty_level, and requirements columns
  - Updated schema.sql to include these fields for future database rebuilds
  - Resolved "Unknown column 'duration_hours' in 'INSERT INTO'" error
✅ **Activity Edit Price Error**: Fixed undefined value error when editing activities with null price values
✅ **Database Schema Cleanup**: Removed unnecessary timestamp fields to simplify the database:
  - Removed unused created_at and updated_at fields from several tables
  - Updated queries to sort by ID instead of timestamp where needed
  - Removed "Created" column from activities admin table
  - Simplified code by reducing timestamp-related operations
✅ **Frontend UI Timestamp Cleanup**: Cleaned up user interface to remove technical timestamp displays:
  - Removed duplicate booking ID displays in travel agent bookings
  - Replaced "Booking Date" with meaningful check-in/out dates in hotel manager interface
  - Changed admin applications "Submitted" column to show "Status" with pending badges
  - Removed commented-out timestamp code and unused formatDate imports
  - Improved user experience by showing relevant business information instead of creation timestamps
✅ **Backend Query Fixes**: Fixed all SQL queries that referenced removed timestamp fields:
  - Removed created_at references from applications controller SELECT queries
  - Removed updated_at references from all UPDATE queries in auth and applications controllers
  - Fixed booking controller queries to remove created_at selections
  - Updated tour guides controller to remove timestamp updates
  - Resolved "Unknown column 'created_at' in 'SELECT'" errors
✅ **Critical Database Field Mismatches**: Fixed all database schema mismatches between frontend and backend:
  - Fixed transport table queries to use correct field names (origin_id/destination_id with JOINs instead of non-existent origin/destination fields)
  - Updated all booking-related queries to properly join transport_origins and destinations tables
  - Fixed phone field references to use phone_number instead of phone
  - Removed references to non-existent hotel contact fields (contact_phone, contact_email)
  - Fixed destination queries to use region instead of non-existent location field
  - Fixed activity duration field reference (duration_hours instead of duration)
✅ **Frontend-Backend API Mismatches**: Fixed all API endpoint and method mismatches:
  - Fixed guide assignment API parameter (guideId instead of guide_id)
  - Fixed hotel room confirmation and transport ticket assignment HTTP methods (PATCH instead of POST)
  - Fixed password change API endpoint path (/auth/password instead of /users/change-password)
  - Removed non-existent API calls (/api/forgot-password, /api/upload-url, /auth/status)
  - Updated API service methods to match backend routes and parameters
✅ **Non-Existent Feature Handling**: Properly handled unimplemented features:
  - Commented out forgot password functionality with proper error message
  - Disabled file upload features with clear error messages indicating they're not implemented
  - Removed calls to non-existent upload endpoints in travel agent profile components
⚠️ Smart contract deployment and production blockchain configuration (demo environment configured)

### Database Improvements
✅ **Database Improvements**
- Removed unnecessary timestamp fields from tables that don't need them
- Updated column definitions to use proper data types and constraints
- Streamlined table structure for better performance and readability
- Uploads directory cleanup integrated with database teardown process
- Some JSON fields still need better validation
- Foreign key constraints could be further strengthened
- Index optimization needed for large datasets

### Image Upload System Technical Implementation
✅ **Backend Compression Engine** (`fyp/backend/controllers/uploadController.js`):
  - **Sharp Integration**: Advanced image processing with format-specific compression algorithms
  - **Silent Operation**: Compression happens transparently without exposing technical details
  - **Error Recovery**: Automatic fallback to original file if compression fails or isn't beneficial
  - **Clean Response**: Returns only essential file information without compression statistics
  - **Security Enhancements**: Comprehensive file validation and malicious content protection
  - **Full URL Generation**: Automatically constructs complete image URLs for frontend consumption

✅ **Single Image Uploader Component** (`fyp/frontend/app/components/single-image-uploader.js`):
  - **Focused Design**: Specialized component for single image uploads with clean interface
  - **React Dropzone Integration**: Drag-and-drop file upload with image format validation
  - **Automatic Upload**: Handles upload automatically with real-time progress feedback
  - **Preview Mode**: Transforms into image preview with hover controls for change/remove actions
  - **Form Integration**: Direct onChange callback integration with form state management
  - **Edit Mode Support**: useEffect hook properly handles initial value changes for edit scenarios

✅ **Multi-File Uploader Component** (`fyp/frontend/app/components/file-uploader.js`):
  - **React Dropzone Integration**: Clean drag-and-drop file upload interface for multiple files
  - **Zustand State Management**: Efficient file state management with simple upload progress
  - **Clean Status Updates**: Basic uploading/success indicators without technical details
  - **Simple User Feedback**: Clear success messages without compression metrics
  - **Streamlined Design**: Removed all compression-related UI elements and badges

✅ **Image URL Management** (`fyp/frontend/app/services/api.js`):
  - **URL Utility Function**: `getFullImageUrl()` converts relative URLs to complete URLs
  - **Service Integration**: Destinations service automatically handles URL conversion
  - **Backward Compatibility**: Supports both legacy relative URLs and new full URLs
  - **Seamless Display**: Images display correctly throughout the application

✅ **Next.js Configuration** (`fyp/frontend/next.config.mjs`):
  - **Localhost Support**: Added localhost to allowed image domains for development
  - **Vercel Blob Support**: Maintains compatibility with existing Vercel Blob storage
  - **Multi-domain Support**: Handles various image sources seamlessly

### Development Utilities

- **Database Reset**: Run `node backend/config/teardownDb.js` to drop all tables and clean uploads directory
- **Uploads Cleanup Only**: Run `node backend/config/teardownDb.js clean-uploads` to just clean uploads
- **Full Reset**: Database reset followed by `nodemon index.js` will recreate all tables with a clean state

### Development Guidelines for AI Models

### When Working on This Codebase:

1. **Authentication First**: Always check user authentication and role permissions before implementing features

2. **Follow Existing Patterns**:
   - Use existing middleware (authenticateToken, checkRole)
   - Follow the controller → service → database pattern (the service part here is optional some places don't have service so don't priotize it)
   - Use Zustand for frontend state management

3. **Database Transactions**: Use transactions for operations that modify multiple tables (especially booking-related operations)

4. **Error Handling**:
   - Backend: Use try-catch with proper HTTP status codes
   - Frontend: Use toast notifications and form validation

5. **Role-Based Features**: Always consider which roles should access specific features

6. **Booking System Complexity**: The booking system is the most complex part - understand the booking_items table structure before modifying booking logic

7. **Frontend Components**: Use existing UI components from the `components/ui` directory

8. **Testing**: Use the `playground` folder for any testing, experiments, or temporary implementations. But plz priotize feature implementation over testing, as the system is still under development.

9. **Documentation**: Keep the `.github/copilot-instructions.md` file updated with any changes made to the codebase, especially if they affect the overall architecture or flow.

10. **NO ROOT FOLDER DOCUMENTATION**: NEVER create documentation files in the root folder. ALL implementation details, summaries, or documentation updates should ONLY be placed in the `.github/copilot-instructions.md` file. Do not create README.md, IMPLEMENTATION_SUMMARY.md, CHANGELOG.md, or any other documentation files in the root directory.

11. **Flexibility**: The system is under active development, so be open to changing existing structures, especially in the schema.sql file. Feel free to break things and improve them as needed. But be considerate and mindful on the work that has been done thus far, don't disregard it plz if some code is there it is there for a reason and try to think why it is there before trying to remove/change it, Otherwise make it better.

12. **Frontend Integration**: If you implement a new feature in the backend, ensure it is reflected in the frontend. Remove any unused or incomplete features from the frontend that do not have backend support.

### Special notes for testing and expirementation:
- Don't priotize testing, as the system is still under development. But only do it if it is absolutely necessary.
- Use the `playground` folder for any testing, experiments, or temporary implementations. This is a safe space to try out new ideas without affecting the main codebase.
Use standardized conventions here is what i mean;
- all the passwords for all users should just be `password123` for simplicity.
- Emails should be in the format `@example.com`.  And just numbered staring from 1, 2, 3, 4, 5, etc depending on number of users u want to create; here is what i mean;
- For admin, admin@example.com
- For hotel managers, hotel1@example.com, hotel2@example.com, etc.
- For travel agents, agent1@example.com, agent2@example.com, etc.
- For tour guides, guide1@example.com, guide2@example.com, etc.
- For tourists, tourist1@example.com, tourist2@example.com, etc.

### Critical Files to Understand:
- `backend/controllers/bookingsController.js` - Core booking logic
- `backend/config/schema.sql` - Database structure
- `frontend/app/book/[id]/page.js` - Main booking interface
- `backend/middleware/authenticateToken.js` & `checkRole.js` - Security

## More instructions in random order (pay close attention to these):
Sorry if these instructions may be repetitive but pay close attention, i just want to put a lot of emphasis that why I insisting so much;
- Use mariadb instead of mysql always, also for any command if you get promped the password maybe when using commands like `sudo` the password for my macbook is `agus`
- Plz study and understand the whole codebase carefully, before implementing any feature so that u understand all the business flows at a very deep level.
- When u want to run the backend, use `nodemon index.js` in the `backend` directory so that the server restarts automatically on changes.
- Additionally, when u make edits to the schema.sql, don't use sth like ALTER TABLE, instead just drop everything using the teardownDb.js script, so that the changes are reflected in the database. so that when u re run nodemon index.js, everything is created from scratch.
- When u want to run the frontend, use `npm run dev` in the `frontend` directory.
- After any request, if the changes made to the codebase should be reflected in the file in `.github/copilot-instructions.md`, please update the file accordingly, so that the next time the AI model is used, it has the latest context.
- Take this with a grain of salt (Be considerate too): "Also plz note that the system is still under development, so you are free to change anything even the tables in schema.sql, and everything else u are allowed to break stuff, replace stuff change the file structure, reimplement some things and overall improve the codebase to make it cleaner and for it to implement all the required functional requirements, but plz only put the things that u were assigned in the request, don't add any extra features or additional unneccessary stuff. I deeply insist that the developers of the project are still figuring out the best way to implement the system and even them are not quite sure of how to put the functional requirements, so be flexible and those changes should be reflected in the file in `.github/copilot-instructions.md` as well."
- When u change the `github/copilot-instructions.md` file, plz don't update sensitive areas like `## More instructions in random order (pay close attention to these):`
- Anything that is not implemented in the backend should not show up in the frontend (if there is any remove it plz), so if you are implementing a new feature in the backend, make sure to also implement it in the frontend.
- Also, If you see an opportunity to remove some code and u are sure of it, plz remove that piece of code, I like the code to be simpler and cleaner. But be careful on this.
