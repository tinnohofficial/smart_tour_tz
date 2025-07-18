CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    full_name VARCHAR(255),
    balance DECIMAL(12, 2) DEFAULT 0.00,
    role ENUM (
        'tourist',
        'tour_guide',
        'hotel_manager',
        'travel_agent',
        'admin'
    ) NOT NULL,
    status ENUM (
        'pending_profile',
        'pending_approval',
        'active',
        'rejected',
        'inactive'
    ) NOT NULL DEFAULT 'pending_profile',
    email_verified BOOLEAN DEFAULT TRUE,
    email_verification_token VARCHAR(255) NULL,
    email_verification_expires TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tour_guides (
    user_id INT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    license_document_url VARCHAR(512),
    destination_id INT NOT NULL,
    description TEXT, -- General description about the tour guide
    activities JSON, -- Array of activity IDs that the guide can supervise
    available BOOLEAN DEFAULT TRUE, -- Whether the tour guide is available for new assignments
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations (id) ON DELETE CASCADE,
    INDEX idx_tour_guides_destination (destination_id),
    INDEX idx_tour_guides_full_name (full_name)
);

CREATE TABLE hotels (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    destination_id INT NOT NULL,
    description TEXT,
    images TEXT, -- JSON array of image URLs
    capacity INT,
    base_price_per_night DECIMAL(10, 2) CHECK (base_price_per_night > 0),
    is_available BOOLEAN DEFAULT TRUE, -- Hotel availability status for bookings
    FOREIGN KEY (id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations (id) ON DELETE CASCADE,
    INDEX idx_hotels_destination (destination_id),
    INDEX idx_hotels_name (name)
);

CREATE TABLE travel_agencies (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    document_url VARCHAR(512),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    FOREIGN KEY (id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE destinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(512)
);

CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destination_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) CHECK (price > 0),
    FOREIGN KEY (destination_id) REFERENCES destinations (id) ON DELETE SET NULL
);

-- Table to track available origins/locations for transport routes
CREATE TABLE transport_origins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    country VARCHAR(100) DEFAULT 'Tanzania',
    INDEX idx_origins_name (name)
);

CREATE TABLE transports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    origin_id INT NOT NULL, -- Reference to transport_origins table
    destination_id INT NOT NULL, -- Reference to destinations table
    transportation_type VARCHAR(100), -- e.g., Bus, Plane, Shuttle
    cost DECIMAL(10, 2) NOT NULL CHECK (cost > 0),
    description TEXT,
    route_details JSON, -- Detailed route information: legs, stops, times, ticket info, carrier details, etc.
    available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (agency_id) REFERENCES travel_agencies (id) ON DELETE CASCADE,
    FOREIGN KEY (origin_id) REFERENCES transport_origins (id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations (id) ON DELETE CASCADE,
    INDEX idx_transports_origin (origin_id),
    INDEX idx_transports_destination (destination_id),
    INDEX idx_transports_origin_destination (origin_id, destination_id)
);

-- Multi-destination booking carts
CREATE TABLE booking_carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tourist_user_id INT NOT NULL,
    total_cost DECIMAL(12, 2) DEFAULT 0.00,
    status ENUM (
        'active',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tourist_user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NULL, -- Link to cart for multi-destination bookings
    tourist_user_id INT NOT NULL,
    tourist_full_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    destination_id INT,
    total_cost DECIMAL(12, 2) NOT NULL,
    include_transport BOOLEAN DEFAULT TRUE,
    include_hotel BOOLEAN DEFAULT TRUE,
    include_activities BOOLEAN DEFAULT TRUE,
    status ENUM (
        'in_cart',
        'pending_payment',
        'confirmed',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'in_cart',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES booking_carts (id) ON DELETE SET NULL,
    FOREIGN KEY (tourist_user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations (id) ON DELETE SET NULL
);

CREATE TABLE booking_items (
    id INT NOT NULL,
    booking_id INT NOT NULL,
    item_type ENUM ('hotel', 'transport', 'tour_guide', 'activity', 'placeholder') NOT NULL,
    item_details TEXT, -- JSON: e.g., { "check_in": "YYYY-MM-DD", "check_out": "YYYY-MM-DD", "room_type": "Standard" } or { "ticket_pdf_url": "https://..." }
    sessions INT DEFAULT 1, -- For activities: number of sessions booked
    cost DECIMAL(10, 2) NOT NULL,
    provider_status ENUM ('pending', 'confirmed', 'rejected') DEFAULT 'pending', -- Status set by hotel manager, travel agent etc.
    FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
);



CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NULL, -- For multi-booking payments
    booking_id INT NULL, -- For single booking payments
    user_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method ENUM ('external', 'savings', 'stripe', 'crypto') NOT NULL,
    reference VARCHAR(255), -- Reference from payment gateway or internal ref
    status ENUM ('successful', 'failed', 'pending') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES booking_carts (id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Add necessary indexes
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_phone ON users (phone_number);
CREATE INDEX idx_users_role_status ON users (role, status);
CREATE INDEX idx_users_email_verified ON users (email_verified);
CREATE INDEX idx_users_verification_token ON users (email_verification_token);

CREATE INDEX idx_bookings_tourist_id ON bookings (tourist_user_id);
CREATE INDEX idx_bookings_cart_id ON bookings (cart_id);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_booking_carts_tourist_id ON booking_carts (tourist_user_id);
CREATE INDEX idx_booking_carts_status ON booking_carts (status);

CREATE INDEX idx_booking_items_booking_id ON booking_items (booking_id);
CREATE INDEX idx_booking_items_item ON booking_items (item_type, id);
CREATE INDEX idx_booking_items_provider_status ON booking_items (provider_status);

CREATE INDEX idx_payments_user_id ON payments (user_id);
CREATE INDEX idx_payments_cart_id ON payments (cart_id);
CREATE INDEX idx_payments_booking_id ON payments (booking_id);
CREATE INDEX idx_payments_status ON payments (status);

CREATE INDEX idx_activities_destination ON activities (destination_id);

-- Password reset tokens table for forgot password functionality
CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_password_reset_token (token),
    INDEX idx_password_reset_user_id (user_id),
    INDEX idx_password_reset_expires (expires_at)
);
