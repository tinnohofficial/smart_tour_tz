# Database Management Guide

Quick reference for managing the database in this project.

## Setup Commands

### Create All Tables
```bash
node config/setupDb.js
```
> Note: This automatically creates an admin user with default credentials

### Create a Single Table
```bash
node config/setupDb.js table_name
```

## Teardown Commands

### Remove All Tables
```bash
node config/teardownDb.js
```

### Remove a Single Table
```bash
node config/teardownDb.js table_name
```

## Admin User

### Create Admin User Manually
```bash
node config/createAdmin.js [email] [password] [phone]
```
Default values if no arguments provided:
- Email: admin@example.com
- Password: password123
- Phone: +1234567890

## Key Database Tables

- users
- tour_guides
- hotels
- travel_agencies
- destinations
- activities
- transports
- bookings
- payments

## Important Notes

- Always back up data before removing tables
- Foreign key checks are automatically handled
- Schema defined in `schema.sql`