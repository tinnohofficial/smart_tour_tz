-- Smart Tour Tanzania Local Database Setup Script

-- Create database
CREATE DATABASE IF NOT EXISTS smart_tour_tanzania CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user for the application
CREATE USER IF NOT EXISTS 'tour_app'@'localhost' IDENTIFIED BY 'tour_password123';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON smart_tour_tanzania.* TO 'tour_app'@'localhost';

-- Also create user for 127.0.0.1 to handle TCP connections
CREATE USER IF NOT EXISTS 'tour_app'@'127.0.0.1' IDENTIFIED BY 'tour_password123';
GRANT ALL PRIVILEGES ON smart_tour_tanzania.* TO 'tour_app'@'127.0.0.1';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Use the database
USE smart_tour_tanzania;

-- Show the created database
SHOW DATABASES;
