# Tour Guide Booking System - Documentation

## Overview

This document outlines the complete flow of the tour guide booking system in Smart Tour Tanzania, including the fixes implemented and the end-to-end process.

## System Flow

### 1. Tourist Books Activities
- Tourist selects destination and activities through the frontend
- System creates a booking with status `confirmed` after payment
- Booking items are created in `booking_items` table for each selected item
- A **placeholder** tour guide entry is created with `item_type = 'placeholder'`

### 2. Admin Assigns Tour Guide
- Admin views unassigned bookings in `/admin/assignments`
- Admin can see all confirmed bookings without tour guides assigned
- Admin selects a booking and views eligible tour guides for that destination
- Admin assigns a tour guide, which:
  - Replaces the placeholder entry with actual tour guide
  - Sets `item_type = 'tour_guide'` and `id = guide_user_id`
  - Marks the guide as unavailable for new assignments

### 3. Tour Guide Views Assignments
- Tour guide logs in and goes to `/tour-guide/bookings`
- System fetches all bookings where the guide is assigned
- Tour guide can see:
  - Tourist contact information (email, phone)
  - Booking details (dates, activities, hotel, transport)
  - Booking status (upcoming, ongoing, completed)

## Database Structure

### Key Tables
- `bookings`: Main booking table with tourist, dates, destination
- `booking_items`: Individual items in a booking (hotel, transport, activities, tour_guide)
- `tour_guides`: Tour guide profiles with destination specialization
- `users`: User accounts for all roles

### Tour Guide Assignment Storage
```sql
-- Placeholder initially created during booking
INSERT INTO booking_items (id, booking_id, item_type, cost, item_details)
VALUES (0, booking_id, 'placeholder', 0, '{"type": "tour_guide_placeholder"}');

-- Replaced when admin assigns guide
UPDATE booking_items 
SET item_type = 'tour_guide', 
    id = guide_user_id, 
    provider_status = 'confirmed',
    item_details = '{"assigned_by": "admin", "assigned_at": "ISO_DATE"}'
WHERE booking_id = ? AND item_type = 'placeholder';
```

## API Endpoints

### Admin Endpoints
- `GET /bookings/unassigned-bookings` - Get bookings without tour guides
- `GET /bookings/:bookingId/eligible-guides` - Get eligible guides for a booking
- `POST /bookings/:bookingId/assign-guide` - Assign tour guide to booking

### Tour Guide Endpoints
- `GET /bookings/tour-guide-assigned` - Get assigned bookings for logged-in guide
- `GET /bookings/tour-guide-booking/:bookingId` - Get detailed booking information

## Frontend Components

### Admin Assignment Dashboard (`/admin/assignments`)
**File**: `fyp/frontend/app/admin/assignments/page.js`
- Lists all unassigned bookings
- Shows tourist info, destination, activities
- Provides assignment dialog with eligible guides
- Uses Zustand store for state management

### Tour Guide Bookings Dashboard (`/tour-guide/bookings`)
**File**: `fyp/frontend/app/tour-guide/bookings/page.js`
- Shows assigned tours with comprehensive details
- Tourist contact information with direct email/phone links
- Booking status filtering (all, upcoming, completed)
- Detailed tour information dialog

## Fixes Implemented

### 1. Backend Controller Fixes (`bookingsController.js`)

#### `getGuideAssignedBookings` Method
**Problem**: Incorrect query structure - was looking for `bi.id = userId` instead of proper tour guide assignment logic.

**Fix**: 
- Corrected query to find bookings where `item_type = 'tour_guide'` AND `id = userId`
- Added comprehensive data fetching for activities, hotels, transport
- Fixed variable naming (`parsedActivities` → `activities`)
- Added proper duration calculation and status determination

#### `getUnassignedBookings` Method  
**Enhancement**:
- Enhanced query to include destination and tourist details
- Added activity aggregation for better admin visibility
- Improved data structure for frontend consumption

### 2. Frontend Fixes

#### Tour Guide Bookings Page
**Problem**: Data mapping issues and incorrect field references.

**Fixes**:
- Fixed field mapping (`touristEmail` → `tourist_email`, etc.)
- Corrected status filtering logic to use `booking_status`
- Enhanced tourist contact display with proper fallbacks
- Fixed badge display for booking status

#### Tour Guide Bookings Store
**Problem**: Incorrect data transformation from API response.

**Fixes**:
- Updated field mapping to match backend response
- Added `booking_status` field for proper status filtering
- Fixed details mapping for guide assignment information

### 3. Data Flow Improvements

#### Booking Creation Process
- Ensures placeholder tour guide entry is created
- Proper status management throughout booking lifecycle

#### Assignment Process
- Replaces placeholder with actual guide assignment
- Maintains referential integrity
- Updates guide availability status

## Testing the System

### Prerequisites
1. Database with sample destinations and activities
2. At least one tour guide user registered and approved
3. At least one tourist booking with confirmed status

### Test Scenario
1. **Tourist creates booking** → Placeholder tour guide created
2. **Admin views assignments** → Booking appears in unassigned list
3. **Admin assigns guide** → Booking removed from unassigned, guide marked unavailable
4. **Guide views dashboard** → Assigned booking appears with full details

## Common Issues and Solutions

### Issue: Tour guide sees no bookings
**Cause**: No tour guide assigned to bookings OR query filtering incorrect guide ID
**Solution**: Check booking_items table for `item_type = 'tour_guide'` entries

### Issue: Admin cannot assign guides
**Cause**: No eligible guides available OR guide already assigned to another booking
**Solution**: Verify guide availability and destination matching

### Issue: Tourist contact info missing
**Cause**: Data transformation error in frontend store
**Solution**: Check field mapping in store transformation logic

## Future Enhancements

1. **Real-time notifications** when guides are assigned
2. **Guide availability calendar** for better scheduling
3. **Tourist-guide messaging system** for direct communication
4. **Booking modification system** for date/activity changes
5. **Performance analytics** for guide assignments and tourist satisfaction