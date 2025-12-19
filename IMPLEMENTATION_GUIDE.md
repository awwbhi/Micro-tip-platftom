# Stellar Soroban Microtip Platform - Comprehensive Implementation Guide

**Last Updated:** 2025-12-19  
**Version:** 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [System Architecture](#system-architecture)
4. [Setup and Installation](#setup-and-installation)
5. [Smart Contract Development](#smart-contract-development)
6. [Backend Integration](#backend-integration)
7. [Frontend Implementation](#frontend-implementation)
8. [Testing and Validation](#testing-and-validation)
9. [Deployment Guide](#deployment-guide)
10. [Security Considerations](#security-considerations)
11. [Performance Optimization](#performance-optimization)
12. [Troubleshooting](#troubleshooting)
13. [API Reference](#api-reference)

---

## Overview

The Stellar Soroban Microtip Platform is a decentralized application (dApp) that enables users to send micropayments and tips on the Stellar blockchain using Soroban smart contracts. This implementation guide provides a complete walkthrough for developers to set up, develop, deploy, and maintain the platform.

### Key Features

- **Micropayments**: Enable frictionless small payments between users
- **Smart Contracts**: Leverage Soroban for efficient, secure transactions
- **Stellar Integration**: Utilize Stellar's fast, low-cost payment network
- **User-Friendly Interface**: Intuitive frontend for sending and receiving tips
- **Transaction History**: Track all micropayment transactions
- **Multi-token Support**: Support for various Stellar-based assets

---

## Prerequisites

### System Requirements

- **Operating System**: Linux, macOS, or Windows (with WSL2)
- **Node.js**: v16.0 or higher
- **Rust**: Latest stable version (for Soroban development)
- **Docker**: v20.10 or higher (recommended for local testing)
- **Git**: v2.30 or higher

### Development Tools

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Stellar CLI
cargo install stellar-cli

# Install Node.js dependencies
npm install -g @stellar/js-stellar-sdk @stellar/js-stellar-base
```

### Accounts and Services

- Stellar testnet account with XLM balance
- Stellar testnet friendbot access for account funding
- GitHub account for version control
- Optional: Infura or similar for additional RPC endpoints

---

## System Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React/Vue)                  │
│              (Web Browser & Mobile Clients)              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Backend API Server                      │
│         (Node.js/Express or Similar Framework)          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            Stellar Soroban Smart Contracts              │
│          (Contract Logic & State Management)            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Stellar Blockchain Network                  │
│         (Mainnet or Testnet Environment)                │
└─────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React/Vue.js | User interface for microtips |
| Backend | Node.js/Express | API and business logic |
| Smart Contracts | Rust (Soroban) | On-chain transaction logic |
| Blockchain | Stellar | Payment settlement network |
| Storage | PostgreSQL/MongoDB | Transaction history & metadata |
| Authentication | JWT/Stellar Signature | User identity verification |

---

## Setup and Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/awwbhi/Micro-tip-platftom.git
cd Micro-tip-platftom
```

### Step 2: Install Project Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Rust dependencies (if using Soroban)
cargo build --release

# Set up environment variables
cp .env.example .env
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Stellar Network Configuration
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"

# Application Configuration
NODE_ENV="development"
PORT=3000
LOG_LEVEL="info"

# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/microtip_db"
DB_HOST="localhost"
DB_PORT=5432
DB_USER="microtip_user"
DB_PASSWORD="secure_password"
DB_NAME="microtip_db"

# Stellar Account Configuration
ADMIN_SECRET_KEY="your_admin_secret_key_here"
CONTRACT_ID="your_deployed_contract_id"

# API Configuration
API_BASE_URL="http://localhost:3000"
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRY="7d"

# Payment Configuration
MIN_MICROTIP_AMOUNT=0.01
MAX_MICROTIP_AMOUNT=1000
DEFAULT_CURRENCY="XLM"

# Redis Configuration (optional)
REDIS_URL="redis://localhost:6379"

# Logging
LOG_FILE_PATH="./logs/app.log"
```

### Step 4: Initialize Database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE microtip_db;"

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### Step 5: Start the Development Server

```bash
# Backend
npm run dev

# In another terminal, start the frontend
npm run dev:frontend

# Access the application at http://localhost:3000
```

---

## Smart Contract Development

### Setting Up Soroban Environment

```bash
# Install Soroban CLI
cargo install --locked stellar-cli

# Verify installation
stellar --version

# Configure Soroban to use testnet
stellar keys generate --testnet
```

### Contract Structure

Create your Soroban contract in `contracts/microtip/`:

```rust
// contracts/microtip/src/lib.rs

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, Symbol, Vec, String
};

#[contracttype]
pub struct Tip {
    pub from: Address,
    pub to: Address,
    pub amount: u128,
    pub message: String,
    pub timestamp: u64,
}

#[contract]
pub struct MicrotipContract;

#[contractimpl]
impl MicrotipContract {
    /// Send a tip from one user to another
    pub fn send_tip(
        env: Env,
        from: Address,
        to: Address,
        token: Address,
        amount: u128,
        message: String,
    ) -> Result<Tip, String> {
        // Verify sender authorization
        from.require_auth();

        // Validate amount
        if amount == 0 {
            return Err("Amount must be greater than zero".into());
        }

        // Transfer tokens
        let token_interface = token::Client::new(&env, &token);
        token_interface.transfer(&from, &to, &(amount as i128));

        // Record tip
        let tip = Tip {
            from: from.clone(),
            to: to.clone(),
            amount,
            message,
            timestamp: env.ledger().timestamp(),
        };

        // Emit event
        env.events().publish((Symbol::new(&env, "tip_sent"),), tip.clone());

        Ok(tip)
    }

    /// Get tip history (implementation depends on storage strategy)
    pub fn get_tips(env: Env, user: Address) -> Vec<Tip> {
        // Retrieve and return tips for user
        Vec::new(&env) // Placeholder
    }

    /// Check balance
    pub fn get_balance(env: Env, account: Address, token: Address) -> u128 {
        let token_interface = token::Client::new(&env, &token);
        let balance = token_interface.balance(&account);
        balance as u128
    }
}
```

### Building the Contract

```bash
# Navigate to contract directory
cd contracts/microtip

# Build the contract
cargo build --target wasm32-unknown-unknown --release

# Verify build
ls -la target/wasm32-unknown-unknown/release/microtip.wasm
```

---

## Backend Integration

### Express.js Server Setup

```javascript
// server.js or main backend file

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const StellarSDK = require('@stellar/js-stellar-sdk');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Stellar SDK
const server = new StellarSDK.Server(process.env.STELLAR_HORIZON_URL);
const keypair = StellarSDK.Keypair.fromSecret(process.env.ADMIN_SECRET_KEY);

// Database connection
const db = require('./db/database');

// API Routes
app.use('/api/tips', require('./routes/tips'));
app.use('/api/users', require('./routes/users'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/accounts', require('./routes/accounts'));

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

### API Endpoints

#### 1. Send a Tip

```
POST /api/tips/send
Content-Type: application/json

{
    "fromAddress": "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "toAddress": "GYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
    "amount": 10.50,
    "currency": "XLM",
    "message": "Great content!"
}

Response (200 OK):
{
    "success": true,
    "transactionHash": "abcd1234...",
    "transactionId": 123,
    "timestamp": "2025-12-19T14:45:03Z",
    "status": "confirmed"
}
```

#### 2. Get User Tip History

```
GET /api/tips/history/:userAddress
Response (200 OK):
{
    "received": [
        {
            "id": 1,
            "from": "GXXXX...",
            "amount": 5.00,
            "currency": "XLM",
            "message": "Nice work!",
            "timestamp": "2025-12-19T14:00:00Z"
        }
    ],
    "sent": [
        {
            "id": 2,
            "to": "GYYYY...",
            "amount": 2.50,
            "currency": "XLM",
            "message": "Thank you!",
            "timestamp": "2025-12-19T13:00:00Z"
        }
    ]
}
```

#### 3. Get Account Balance

```
GET /api/accounts/balance/:address
Response (200 OK):
{
    "address": "GXXXX...",
    "balances": [
        {
            "asset_type": "native",
            "balance": "1000.00",
            "limit": "922337203685.4775807"
        }
    ]
}
```

#### 4. Get Transaction Details

```
GET /api/transactions/:transactionId
Response (200 OK):
{
    "id": 123,
    "from": "GXXXX...",
    "to": "GYYYY...",
    "amount": 10.50,
    "currency": "XLM",
    "hash": "abcd1234...",
    "status": "confirmed",
    "message": "Great content!",
    "timestamp": "2025-12-19T14:45:03Z",
    "ledger": 12345678
}
```

### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    stellar_address VARCHAR(56) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tips table
CREATE TABLE tips (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER NOT NULL REFERENCES users(id),
    to_user_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(20, 7) NOT NULL,
    currency VARCHAR(12) DEFAULT 'XLM',
    message TEXT,
    transaction_hash VARCHAR(64) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    tip_id INTEGER REFERENCES tips(id),
    transaction_hash VARCHAR(64) UNIQUE NOT NULL,
    from_address VARCHAR(56) NOT NULL,
    to_address VARCHAR(56) NOT NULL,
    amount DECIMAL(20, 7) NOT NULL,
    ledger_number INTEGER,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_tips_from_user ON tips(from_user_id);
CREATE INDEX idx_tips_to_user ON tips(to_user_id);
CREATE INDEX idx_tips_created_at ON tips(created_at DESC);
CREATE INDEX idx_transactions_hash ON transactions(transaction_hash);
```

---

## Frontend Implementation

### React Component Example

```jsx
// components/SendTip.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Keypair } from '@stellar/js-stellar-sdk';

function SendTip() {
    const [formData, setFormData] = useState({
        toAddress: '',
        amount: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Validate Stellar address
            if (!Keypair.isValidPublicKey(formData.toAddress)) {
                throw new Error('Invalid recipient address');
            }

            // Get sender address from localStorage or Freighter wallet
            const fromAddress = localStorage.getItem('userAddress');
            if (!fromAddress) {
                throw new Error('User address not found');
            }

            // Send tip via API
            const response = await axios.post('/api/tips/send', {
                fromAddress,
                toAddress: formData.toAddress,
                amount: parseFloat(formData.amount),
                currency: 'XLM',
                message: formData.message
            });

            setSuccess(`Tip sent successfully! Transaction: ${response.data.transactionHash}`);
            setFormData({ toAddress: '', amount: '', message: '' });
        } catch (err) {
            setError(err.message || 'Failed to send tip');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="send-tip-container">
            <h2>Send a Tip</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="toAddress">Recipient Address:</label>
                    <input
                        type="text"
                        id="toAddress"
                        name="toAddress"
                        value={formData.toAddress}
                        onChange={handleInputChange}
                        placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="amount">Amount (XLM):</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0.01"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="message">Message:</label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Say something nice!"
                        maxLength="500"
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Tip'}
                </button>
            </form>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
        </div>
    );
}

export default SendTip;
```

### Transaction History Component

```jsx
// components/TipHistory.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TipHistory() {
    const [tips, setTips] = useState({ received: [], sent: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTipHistory = async () => {
            try {
                const userAddress = localStorage.getItem('userAddress');
                const response = await axios.get(`/api/tips/history/${userAddress}`);
                setTips(response.data);
            } catch (err) {
                setError(err.message || 'Failed to load tip history');
            } finally {
                setLoading(false);
            }
        };

        fetchTipHistory();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="alert alert-error">{error}</div>;

    return (
        <div className="tip-history-container">
            <h2>Tip History</h2>
            
            <div className="tips-section">
                <h3>Received Tips</h3>
                {tips.received.length === 0 ? (
                    <p>No tips received yet</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>From</th>
                                <th>Amount</th>
                                <th>Message</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tips.received.map(tip => (
                                <tr key={tip.id}>
                                    <td>{tip.from.substring(0, 10)}...</td>
                                    <td>{tip.amount} {tip.currency}</td>
                                    <td>{tip.message}</td>
                                    <td>{new Date(tip.timestamp).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="tips-section">
                <h3>Sent Tips</h3>
                {tips.sent.length === 0 ? (
                    <p>No tips sent yet</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>To</th>
                                <th>Amount</th>
                                <th>Message</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tips.sent.map(tip => (
                                <tr key={tip.id}>
                                    <td>{tip.to.substring(0, 10)}...</td>
                                    <td>{tip.amount} {tip.currency}</td>
                                    <td>{tip.message}</td>
                                    <td>{new Date(tip.timestamp).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default TipHistory;
```

---

## Testing and Validation

### Unit Testing

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Example Test Case

```javascript
// __tests__/api/tips.test.js

const request = require('supertest');
const app = require('../../server');
const db = require('../../db/database');

describe('Tips API', () => {
    beforeEach(async () => {
        // Setup test database
        await db.query('TRUNCATE tips, users RESTART IDENTITY CASCADE');
    });

    test('should send a tip successfully', async () => {
        const tipData = {
            fromAddress: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            toAddress: 'GYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
            amount: 10.50,
            currency: 'XLM',
            message: 'Great content!'
        };

        const response = await request(app)
            .post('/api/tips/send')
            .send(tipData)
            .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('transactionHash');
        expect(response.body).toHaveProperty('timestamp');
    });

    test('should reject invalid recipient address', async () => {
        const tipData = {
            fromAddress: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
            toAddress: 'INVALID_ADDRESS',
            amount: 10.50,
            currency: 'XLM',
            message: 'Test'
        };

        const response = await request(app)
            .post('/api/tips/send')
            .send(tipData)
            .expect(400);

        expect(response.body).toHaveProperty('error');
    });
});
```

### Integration Testing

```bash
# Run integration tests against testnet
npm run test:integration

# Run load testing
npm run test:load
```

### Soroban Contract Testing

```bash
# Run Soroban contract tests
cd contracts/microtip
cargo test

# Run with detailed output
cargo test -- --nocapture
```

---

## Deployment Guide

### Testnet Deployment

#### Step 1: Deploy the Smart Contract

```bash
# Build and optimize contract
cargo build --target wasm32-unknown-unknown --release

# Create Soroban contract
stellar contract deploy \
    --wasm ./target/wasm32-unknown-unknown/release/microtip.wasm \
    --source-account $ADMIN_ACCOUNT_ID \
    --network testnet

# Save the contract ID to .env
CONTRACT_ID="your_deployed_contract_id"
```

#### Step 2: Initialize Contract

```bash
# Initialize contract with parameters
stellar contract invoke \
    --id $CONTRACT_ID \
    --source-account $ADMIN_ACCOUNT_ID \
    --network testnet \
    -- \
    init \
    --admin $ADMIN_ACCOUNT_ID
```

#### Step 3: Deploy Backend

```bash
# Set environment to testnet
export NODE_ENV="testnet"

# Start the backend service
npm run start

# Verify backend health
curl http://localhost:3000/health
```

#### Step 4: Deploy Frontend

```bash
# Build frontend for production
npm run build:frontend

# Deploy to hosting service (e.g., Vercel, Netlify)
npm run deploy:frontend
```

### Mainnet Deployment

```bash
# Update network configuration
export STELLAR_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
export STELLAR_HORIZON_URL="https://horizon.stellar.org"
export SOROBAN_RPC_URL="https://soroban-mainnet.stellar.org"

# Deploy contract to mainnet
stellar contract deploy \
    --wasm ./target/wasm32-unknown-unknown/release/microtip.wasm \
    --source-account $ADMIN_ACCOUNT_ID \
    --network public

# Deploy backend with mainnet configuration
NODE_ENV=production npm start

# Verify deployment
curl https://your-api-domain.com/health
```

---

## Security Considerations

### Authentication & Authorization

```javascript
// middleware/auth.js

const jwt = require('jsonwebtoken');
const StellarSDK = require('@stellar/js-stellar-sdk');

const verifySignature = (address, message, signature) => {
    try {
        const keypair = StellarSDK.Keypair.fromPublicKey(address);
        return keypair.verify(Buffer.from(message), Buffer.from(signature, 'base64'));
    } catch (err) {
        return false;
    }
};

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = { verifySignature, authenticateUser };
```

### Input Validation

```javascript
// utils/validation.js

const { Keypair } = require('@stellar/js-stellar-sdk');

const validateAddress = (address) => {
    return Keypair.isValidPublicKey(address);
};

const validateAmount = (amount, min = 0.01, max = 1000) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num >= min && num <= max;
};

const validateMessage = (message, maxLength = 500) => {
    return typeof message === 'string' && message.length <= maxLength;
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
};

module.exports = { validateAddress, validateAmount, validateMessage, sanitizeInput };
```

### Rate Limiting

```javascript
// middleware/rateLimit.js

const rateLimit = require('express-rate-limit');

const tipLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 tips per minute
    message: 'Too many tip requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { tipLimiter };
```

### HTTPS and CORS Configuration

```javascript
// server.js

const cors = require('cors');
const helmet = require('helmet');

app.use(helmet()); // Add security headers

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## Performance Optimization

### Database Query Optimization

```javascript
// Use connection pooling
const { Pool } = require('pg');
const pool = new Pool({
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Add indexes on frequently queried columns
// CREATE INDEX idx_tips_created_at ON tips(created_at DESC);
// CREATE INDEX idx_tips_from_user ON tips(from_user_id);
// CREATE INDEX idx_tips_to_user ON tips(to_user_id);
```

### Caching Strategy

```javascript
// utils/cache.js

const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });

const cacheKey = (type, id) => `${type}:${id}`;

const getCachedData = async (key) => {
    try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        return null;
    }
};

const setCacheData = async (key, data, ttl = 3600) => {
    try {
        await client.setEx(key, ttl, JSON.stringify(data));
    } catch (err) {
        console.error('Cache set error:', err);
    }
};

module.exports = { getCachedData, setCacheData, cacheKey };
```

### API Response Pagination

```javascript
// middleware/pagination.js

const getPaginationParams = (req) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

const paginate = (req, res, next) => {
    req.pagination = getPaginationParams(req);
    next();
};

module.exports = { paginate, getPaginationParams };
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Contract Deployment Failure

**Error:** `Transaction failed with status FAILED`

**Solution:**
```bash
# Check account balance
stellar account get $ADMIN_ACCOUNT_ID --network testnet

# Ensure sufficient XLM for fees (minimum 2 XLM)
# Fund account via friendbot if needed
curl "https://friendbot.stellar.org?addr=$ADMIN_ACCOUNT_ID"
```

#### Issue 2: Transaction Timeout

**Error:** `Timeout waiting for transaction to be confirmed`

**Solution:**
```javascript
// Increase timeout and add retry logic
const maxRetries = 3;
let retries = 0;

while (retries < maxRetries) {
    try {
        const tx = await submitTransaction(transactionBuilder.build());
        break;
    } catch (err) {
        retries++;
        if (retries >= maxRetries) throw err;
        await new Promise(r => setTimeout(r, 1000 * retries));
    }
}
```

#### Issue 3: Insufficient Funds

**Error:** `Source account does not have sufficient funds`

**Solution:**
```bash
# Check current balance
stellar account get $USER_ACCOUNT_ID --network testnet

# Fund account with XLM
# Via friendbot for testnet
curl "https://friendbot.stellar.org?addr=$USER_ACCOUNT_ID"

# Via manual transfer for mainnet
stellar tx submit $TRANSFER_TRANSACTION_ENVELOPE
```

#### Issue 4: Database Connection Error

**Error:** `connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check database configuration
psql -U $DB_USER -h $DB_HOST -d $DB_NAME

# Verify environment variables are correct
echo $DATABASE_URL
```

#### Issue 5: CORS Issues

**Error:** `Access to XMLHttpRequest... has been blocked by CORS policy`

**Solution:**
```javascript
// Update CORS configuration in server.js
app.use(cors({
    origin: ['http://localhost:3000', 'https://yourdomain.com'],
    credentials: true
}));
```

---

## API Reference

### Authentication

All endpoints except health check require a valid JWT token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Tip Management Endpoints

#### Send Tip
```
POST /api/tips/send
Authorization: Bearer <token>
Content-Type: application/json

{
    "fromAddress": "GXXXX...",
    "toAddress": "GYYYY...",
    "amount": 10.50,
    "currency": "XLM",
    "message": "Great work!"
}

Response: 200 OK
{
    "success": true,
    "transactionHash": "abcd...",
    "transactionId": 123,
    "timestamp": "2025-12-19T14:45:03Z",
    "status": "confirmed"
}
```

#### Get Tip History
```
GET /api/tips/history/:userAddress
Authorization: Bearer <token>

Response: 200 OK
{
    "received": [...],
    "sent": [...]
}
```

### Account Endpoints

#### Get Balance
```
GET /api/accounts/balance/:address
Authorization: Bearer <token>

Response: 200 OK
{
    "address": "GXXXX...",
    "balances": [...]
}
```

#### Get Account Details
```
GET /api/accounts/details/:address
Authorization: Bearer <token>

Response: 200 OK
{
    "id": "GXXXX...",
    "account_id": "GXXXX...",
    "balances": [...],
    "signers": [...]
}
```

### Transaction Endpoints

#### Get Transaction
```
GET /api/transactions/:transactionId
Authorization: Bearer <token>

Response: 200 OK
{
    "id": 123,
    "from": "GXXXX...",
    "to": "GYYYY...",
    "amount": 10.50,
    "status": "confirmed"
}
```

#### Get Transaction History
```
GET /api/transactions/user/:userAddress?page=1&limit=20
Authorization: Bearer <token>

Response: 200 OK
{
    "transactions": [...],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 150
    }
}
```

---

## Additional Resources

- **Stellar Documentation:** https://developers.stellar.org/
- **Soroban Documentation:** https://soroban.stellar.org/
- **Stellar SDK (JavaScript):** https://js-stellar-sdk.readthedocs.io/
- **Stellar CLI:** https://github.com/stellar/stellar-cli

---

## Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Contact the development team
- Check existing documentation and FAQs

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-19  
**Maintained By:** awwbhi Development Team
