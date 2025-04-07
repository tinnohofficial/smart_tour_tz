-- Users Table: Stores basic login info and role
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    role ENUM('tourist', 'tour_guide', 'hotel_manager', 'travel_agent', 'admin') NOT NULL,
    status ENUM('pending_profile', 'pending_approval', 'active', 'rejected', 'inactive') NOT NULL DEFAULT 'pending_profile', -- Status workflow
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tour Guides Profile Table
CREATE TABLE tour_guides (
    user_id INT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    license_document_url VARCHAR(512), -- URL to stored document
    location VARCHAR(255),
    expertise TEXT, -- Comma-separated or JSON array of skills/areas
    -- add other relevant fields like rating, availability etc.
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Hotels Table
CREATE TABLE hotels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    manager_user_id INT UNIQUE, -- A manager manages one hotel in this simple model
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    facilities_images_urls TEXT, -- JSON array of image URLs
    capacity INT,
    base_price_per_night DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL -- or CASCADE if hotel should be deleted if manager is deleted
);

-- Travel Agencies Table
CREATE TABLE travel_agencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_user_id INT UNIQUE, -- An agent represents one agency in this model
    name VARCHAR(255) NOT NULL,
    legal_document_urls TEXT, -- JSON array of URLs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_user_id) REFERENCES users(id) ON DELETE SET NULL -- or CASCADE
);

-- Transport Routes Table
CREATE TABLE transport_routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    transport_type VARCHAR(100), -- e.g., Bus, Plane, Shuttle
    price DECIMAL(10, 2) NOT NULL,
    schedule_details TEXT, -- Could be JSON or simple text
    FOREIGN KEY (agency_id) REFERENCES travel_agencies(id) ON DELETE CASCADE
);

-- Destinations Table
CREATE TABLE destinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    location_details VARCHAR(255), -- e.g., Region, Coordinates
    image_url VARCHAR(512)
);

-- Activities Table
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destination_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL -- Activity might exist without a specific destination? Or CASCADE
);

-- Bookings Table: Main booking record
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tourist_user_id INT NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    status ENUM('pending_payment', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending_payment',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tourist_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Booking Items Table: Links booking to specific services
CREATE TABLE booking_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    item_type ENUM('hotel', 'transport', 'tour_guide', 'activity') NOT NULL,
    item_id INT NOT NULL, -- Refers to hotel.id, transport_routes.id, users.id (for guide), activities.id
    item_details TEXT, -- JSON: e.g., { "check_in": "YYYY-MM-DD", "check_out": "YYYY-MM-DD", "room_type": "Standard" } or { "ticket_number": "XYZ", "seat": "12A"}
    cost DECIMAL(10, 2) NOT NULL,
    provider_status ENUM('pending', 'confirmed', 'rejected') DEFAULT 'pending', -- Status set by hotel manager, travel agent etc.
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    -- Note: No direct FK for item_id due to multiple table types. Application logic enforces this link.
);

-- Payments Table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT, -- Can be NULL if it's a savings deposit
    user_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method ENUM('card', 'savings_fiat') NOT NULL,
    status ENUM('successful', 'failed', 'pending') NOT NULL,
    transaction_ref VARCHAR(255), -- Reference from payment gateway or internal ref
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Savings Account Table (Fiat Only)
CREATE TABLE savings_accounts (
    user_id INT PRIMARY KEY,
    balance_usd DECIMAL(12, 2) DEFAULT 0.00, -- Example currency
    -- balance_tzs DECIMAL(14, 2) DEFAULT 0.00, -- Add other currencies if needed
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Savings Transactions Table (Fiat Only)
CREATE TABLE savings_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    type ENUM('deposit', 'withdrawal', 'payment') NOT NULL,
    description VARCHAR(255),
    related_payment_id INT, -- Link to payment if type is 'payment'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

-- User Payment Methods (Simplified - NOT storing full card details)
CREATE TABLE user_payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    method_type ENUM('card') NOT NULL,
    details TEXT, -- JSON: e.g., { "last4": "1234", "expiry_month": "12", "expiry_year": "2025", "brand": "Visa", "gateway_token": "tok_xyz" }
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add necessary indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_bookings_tourist_id ON bookings(tourist_user_id);
CREATE INDEX idx_booking_items_booking_id ON booking_items(booking_id);
CREATE INDEX idx_booking_items_item ON booking_items(item_type, item_id); -- For provider lookups
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_savings_transactions_user_id ON savings_transactions(user_id);
CREATE INDEX idx_user_payment_methods_user_id ON user_payment_methods(user_id);
-- Add more indexes as needed based on query patterns
