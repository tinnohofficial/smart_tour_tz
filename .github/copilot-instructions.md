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

#### Tourist Interface:
- `/` - Home page with destination browsing
- `/book/[id]` - Destination booking page with service selection
- `/cart` - Multi-destination cart management and checkout
- `/savings` - Savings account management
- `/my-bookings` - View and track bookings

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

## Current System Status & Known Issues

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
✅ Responsive frontend with role-specific dashboards
✅ Phone number validation with Tanzania country code (+255)
✅ Currency conversion from USD to TZS throughout the system
✅ Stripe payment integration for fiat deposits
✅ **Blockchain integration with MetaMask wallet connection** - **COMPLETE**
✅ **Crypto payment processing with USDT conversion** - **COMPLETE**
✅ **Unified savings handling for both fiat and crypto balances** - **COMPLETE**
✅ **Automatic blockchain interactions for payment processing** - **COMPLETE**
✅ **Wallet address storage and blockchain balance tracking** - **COMPLETE**
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

### Partially Implemented
⚠️ Activity scheduling with time slots (backend complete, frontend needs work)
⚠️ Real-time availability checking (basic implementation)  
⚠️ Booking status progression (logic exists, UI needs enhancement)

### Known Issues & Improvements Needed
❌ Activity time slot booking is incomplete
❌ Tour guide expertise matching needs refinement
❌ Email notifications for booking updates
❌ Comprehensive error handling in frontend
❌ Image upload and management system
❌ Smart contract deployment and production blockchain configuration

### Database Inconsistencies
- Some JSON fields need better validation
- Foreign key constraints could be stronger
- Index optimization needed for large datasets

## Development Guidelines for AI Models

### When Working on This Codebase:

1. **Authentication First**: Always check user authentication and role permissions before implementing features

2. **Follow Existing Patterns**: 
   - Use existing middleware (authenticateToken, checkRole)
   - Follow the controller → service → database pattern
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

11. **Flexibility**: The system is under active development, so be open to changing existing structures, especially in the schema.sql file. Feel free to break things and improve them as needed.

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
- Also plz note that the system is still under development, so you are free to change anything even the tables in schema.sql, and everything else u are allowed to break stuff, replace stuff change the file structure, reimplement some things and overall improve the codebase to make it cleaner and for it to implement all the required functional requirements, but plz only put the things that u were assigned in the request, don't add any extra features or additional unneccessary stuff. I deeply insist that the developers of the project are still figuring out the best way to implement the system and even them are not quite sure of how to put the functional requirements, so be flexible and those changes should be reflected in the file in `.github/copilot-instructions.md` as well.
- When u change the `github/copilot-instructions.md` file, plz don't update sensitive areas like `## More instructions in random order (pay close attention to these):`
- Anything that is not implemented in the backend should not show up in the frontend (if there is any remove it plz), so if you are implementing a new feature in the backend, make sure to also implement it in the frontend.
- Also, If you see an opportunity to remove some code and u are sure of it, plz remove that piece of code, I like the code to be simpler and cleaner. But be careful on this.