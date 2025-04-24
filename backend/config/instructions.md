# Database Configuration Instructions

This document provides instructions for managing the database configuration in the travel booking system backend.

## Database Setup and Management

### Setting Up the Database

#### Create All Tables
To set up the entire database schema (all tables will be created only if they don't exist):

```bash
node config/setupDb.js
```

This command performs the following actions:
- Checks if the database already contains tables (checks for "users" table as a benchmark)
- If tables don't exist, reads the schema.sql file and executes all SQL statements
- Creates all tables, indexes, and constraints defined in schema.sql

#### Create a Specific Table
To create only a specific table from the schema:

```bash
node config/setupDb.js table_name
```

For example:
```bash
node config/setupDb.js bookings
```

This command:
- Checks if the specified table already exists
- If not, extracts the CREATE TABLE statement for that table from schema.sql
- Temporarily disables foreign key checks to handle dependencies
- Creates just that specific table
- Re-enables foreign key checks

### Removing Tables from the Database

#### Delete All Tables
To drop all tables from the database:

```bash
node config/teardownDb.js
```

This command:
- Temporarily disables foreign key checks to avoid constraint violations
- Retrieves a list of all tables in the current database
- Drops each table one by one
- Re-enables foreign key checks

#### Delete a Specific Table
To drop a specific table from the database:

```bash
node config/teardownDb.js table_name
```

For example:
```bash
node config/teardownDb.js bookings
```

This command:
- Checks if the specified table exists
- Temporarily disables foreign key checks
- Drops only that specific table
- Re-enables foreign key checks

## Creating an Admin User

To create an admin user in the database:

```bash
node config/createAdmin.js
```

This command will create a default admin user with predefined credentials. Use this for initial system setup.

## Database Schema

The database schema is defined in `schema.sql`. This file contains all the CREATE TABLE statements and indexes for the entire database structure.

Key tables include:
- users
- tour_guides
- hotels
- travel_agencies
- destinations
- activities
- transports
- bookings
- booking_items
- payments
- savings_accounts
- user_crypto_balances

## Important Notes

- Always back up your data before running teardown commands
- The setup commands are safe to run on an existing database as they check if tables exist before creating them
- When creating specific tables, be aware of dependencies. Some tables may require others to exist first due to foreign key constraints
- Foreign key checks are temporarily disabled during operations to avoid constraint errors