CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tour_guides (
    user_id INT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    license_document_url VARCHAR(512),
    location VARCHAR(255),
    expertise TEXT, -- JSON object with expertise details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_tour_guides_location (location),
    INDEX idx_tour_guides_full_name (full_name)
);

CREATE TABLE hotels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    manager_user_id INT UNIQUE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    images TEXT, -- JSON array of image URLs
    capacity INT,
    base_price_per_night DECIMAL(10, 2) CHECK (base_price_per_night > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_hotels_location (location),
    INDEX idx_hotels_name (name)
);

CREATE TABLE travel_agencies (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    document_url VARCHAR(512),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE destinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    region VARCHAR(255), -- e.g., Region, Coordinates
    image_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    destination_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) CHECK (price > 0),
    guide_user_id INT,
    date DATE,
    group_size INT,
    status ENUM('available', 'booked', 'completed', 'cancelled') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (destination_id) REFERENCES destinations (id) ON DELETE SET NULL,
    FOREIGN KEY (guide_user_id) REFERENCES tour_guides (user_id) ON DELETE SET NULL
);

CREATE TABLE transports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agency_id INT NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    transportation_type VARCHAR(100), -- e.g., Bus, Plane, Shuttle
    cost DECIMAL(10, 2) NOT NULL CHECK (cost > 0),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES travel_agencies (id) ON DELETE CASCADE,
    INDEX idx_transports_origin (origin),
    INDEX idx_transports_destination (destination)
);

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tourist_user_id INT NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    status ENUM (
        'pending_payment',
        'confirmed',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending_payment',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tourist_user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE booking_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    item_type ENUM ('hotel', 'transport', 'tour_guide', 'activity', 'placeholder') NOT NULL,
    item_id INT NOT NULL, -- Refers to hotel.id, transport_routes.id, users.id (for guide), activities.id
    item_details TEXT, -- JSON: e.g., { "check_in": "YYYY-MM-DD", "check_out": "YYYY-MM-DD", "room_type": "Standard" } or { "ticket_number": "XYZ", "seat": "12A"}
    cost DECIMAL(10, 2) NOT NULL,
    provider_status ENUM ('pending', 'confirmed', 'rejected') DEFAULT 'pending', -- Status set by hotel manager, travel agent etc.
    FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
);

CREATE TABLE user_payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    payment_type VARCHAR(20) NOT NULL DEFAULT 'credit_card',
    gateway_token VARCHAR(255),
    last_four_digits VARCHAR(4),
    brand VARCHAR(50),
    expiry_month VARCHAR(2),
    expiry_year VARCHAR(4),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE savings_accounts (
    user_id INT PRIMARY KEY,
    balance_usd DECIMAL(12, 2) DEFAULT 0.00, -- Example currency
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE user_crypto_balances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    wallet_address VARCHAR(255),
    crypto_balance DECIMAL(18, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Create savings_transactions before payments
CREATE TABLE savings_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM ('deposit', 'withdrawal', 'payment') NOT NULL,
    amount_usd DECIMAL(12, 2) NOT NULL,
    payment_method_id INT,
    description VARCHAR(255),
    is_crypto BOOLEAN DEFAULT FALSE,
    token_type VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES user_payment_methods (id) ON DELETE SET NULL
);

-- Now create payments table that references savings_transactions
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT, -- Can be NULL if it's a savings deposit
    user_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method ENUM ('card', 'savings_fiat', 'savings_crypto') NOT NULL,
    reference VARCHAR(255), -- Reference from payment gateway or internal ref
    status ENUM ('successful', 'failed', 'pending') NOT NULL,
    transaction_id INT, -- Reference to savings_transactions if applicable
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES savings_transactions (id) ON DELETE SET NULL
);

-- Add necessary indexes
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_phone ON users (phone_number);
CREATE INDEX idx_users_role_status ON users (role, status);

CREATE INDEX idx_bookings_tourist_id ON bookings (tourist_user_id);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_created ON bookings (created_at DESC);

CREATE INDEX idx_booking_items_booking_id ON booking_items (booking_id);
CREATE INDEX idx_booking_items_item ON booking_items (item_type, item_id);
CREATE INDEX idx_booking_items_provider_status ON booking_items (provider_status);

CREATE INDEX idx_payments_user_id ON payments (user_id);
CREATE INDEX idx_payments_booking_id ON payments (booking_id);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_created ON payments (created_at DESC);

CREATE INDEX idx_savings_transactions_user_id ON savings_transactions (user_id);
CREATE INDEX idx_savings_transactions_type ON savings_transactions (type);
CREATE INDEX idx_savings_transactions_created ON savings_transactions (created_at DESC);

CREATE INDEX idx_user_payment_methods_user_id ON user_payment_methods (user_id);

CREATE INDEX idx_activities_guide_id ON activities (guide_user_id);
CREATE INDEX idx_activities_destination ON activities (destination_id);
CREATE INDEX idx_activities_status ON activities (status);
CREATE INDEX idx_activities_date ON activities (date);

CREATE INDEX idx_hotels_manager ON hotels (manager_user_id);
