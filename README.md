# Smart Tour Tanzania 🌍

A comprehensive tourism booking platform that revolutionizes travel experiences in Tanzania through blockchain technology and modern web development.

## 🎯 Overview

Smart Tour Tanzania is a multi-role tourism management system that enables seamless booking experiences for tourists while providing comprehensive management tools for service providers. The platform integrates traditional web technologies with blockchain payments to create a modern, secure tourism ecosystem.

### Three Main Modules
- **Frontend**: Next.js 15 with React 19, modern UI components
- **Backend**: Node.js/Express REST API with MySQL database
- **Blockchain**: Solidity smart contracts on Ethereum-compatible networks

### Key Features
- 🛒 **Multi-destination Booking**: Complex shopping cart system for trip planning
- 💳 **Integrated Payments**: Stripe, cryptocurrency (TZC token), and savings balance
- 🔐 **Secure Authentication**: JWT-based auth with email verification
- 📱 **Responsive Design**: Mobile-first approach with Tailwind CSS
- 🌐 **Multi-role Management**: Distinct interfaces for different user types

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **Tourist** | Book trips, manage payments, view recommendations |
| **Tour Guide** | Manage guided tours, set availability, view assignments |
| **Hotel Manager** | Manage hotel bookings, set room availability, pricing |
| **Travel Agent** | Manage transport services, create travel packages |
| **Admin** | System administration, user approvals, platform oversight |

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MySQL with connection pooling
- **Authentication**: JWT with bcrypt password hashing
- **File Upload**: Multer for image and document handling
- **Blockchain**: Ethers.js for smart contract interactions

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with Radix UI components
- **Styling**: Tailwind CSS with custom animations
- **Forms**: React Hook Form with Zod validation
- **State Management**: Zustand for client state
- **Payments**: Stripe React components

### Blockchain
- **Development**: Foundry framework
- **Contracts**: OpenZeppelin standards
- **Token**: Custom ERC-20 Tanzania Shilling Coin (TZC)
- **Networks**: Ethereum Sepolia, Base Sepolia testnets

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- MySQL 8.0+
- Foundry (for blockchain development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd fyp

# Backend setup
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev

# Blockchain setup (new terminal)
cd ../blockchain
forge install
forge build
```

## 💰 Payment Integration

### Supported Payment Methods
1. **Stripe Integration**: Credit/debit cards, digital wallets
2. **Cryptocurrency**: TZC token payments via smart contracts
3. **Savings Balance**: Internal wallet system for users

### Smart Contracts
- **TanzaniaShillingCoin (TZC)**: ERC-20 token for platform payments
- **SmartTourVault**: Secure token storage and payment processing

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Input Validation**: Comprehensive request validation
- **File Upload Security**: Secure file handling with type validation

## 🚧 Development Team

| Name | Role |
|------|------|
| **Augustino Anthony Mageka** | Backend & Database Architecture |
| **Edmund Honest Ngowi** | Frontend & System Integration |
| **Winsaviour Aminiel Mungure** | Blockchain Smart Contracts |

## 📄 License

This project is developed as part of an academic final year project at the University of Dar es Salaam.

---

*Built with ❤️ for Tanzania's tourism industry*
