# Micro-Tip Platform Testing Guide

## Overview

This guide provides comprehensive step-by-step instructions for testing the micro-tip platform on both **testnet** (fake money for development and testing) and **mainnet** (real money for production). Follow the appropriate section based on your environment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Testnet Testing Guide](#testnet-testing-guide)
3. [Mainnet Testing Guide](#mainnet-testing-guide)
4. [Common Testing Scenarios](#common-testing-scenarios)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin testing, ensure you have the following:

### Required Software
- **Node.js** (v14.x or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- A **web browser** (Chrome, Firefox, Safari, or Edge)
- **Wallet extension**: MetaMask or similar Ethereum-compatible wallet

### Required Accounts/Services
- GitHub account (for accessing the repository)
- Testnet faucet access (for testnet testing)
- Testnet wallet with ETH for gas fees
- Mainnet wallet with real ETH (for mainnet testing)

### Setup Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/awwbhi/Micro-tip-platftom.git
   cd Micro-tip-platftom
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install MetaMask or Compatible Wallet**
   - Download and install MetaMask from https://metamask.io/
   - Create or import your wallet
   - Save your seed phrase securely

4. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration (see configuration section below)

---

## Testnet Testing Guide

### What is Testnet?

Testnet is a blockchain network that mirrors the mainnet but uses fake money (test ETH). It's perfect for development, testing, and learning without financial risk.

### Supported Testnets

- **Goerli** (Ethereum Goerli Testnet)
- **Sepolia** (Ethereum Sepolia Testnet)
- **Mumbai** (Polygon Mumbai Testnet)
- **Amoy** (Polygon Amoy Testnet)

### Step 1: Configure Testnet Wallet

#### 1.1 Add Testnet Network to MetaMask

**For Goerli Testnet:**
1. Open MetaMask
2. Click the network dropdown (top left)
3. Select "Add Network"
4. Fill in the following details:
   - **Network Name**: Goerli
   - **New RPC URL**: `https://goerli.infura.io/v3/YOUR_INFURA_KEY`
   - **Chain ID**: 5
   - **Currency Symbol**: ETH
   - **Block Explorer URL**: `https://goerli.etherscan.io`
5. Click "Save"

**For Sepolia Testnet:**
1. Open MetaMask
2. Click the network dropdown
3. Select "Add Network"
4. Fill in the following details:
   - **Network Name**: Sepolia
   - **New RPC URL**: `https://sepolia.infura.io/v3/YOUR_INFURA_KEY`
   - **Chain ID**: 11155111
   - **Currency Symbol**: ETH
   - **Block Explorer URL**: `https://sepolia.etherscan.io`
5. Click "Save"

**For Mumbai Testnet (Polygon):**
1. Open MetaMask
2. Click the network dropdown
3. Select "Add Network"
4. Fill in the following details:
   - **Network Name**: Mumbai
   - **New RPC URL**: `https://rpc-mumbai.maticvigil.com/`
   - **Chain ID**: 80001
   - **Currency Symbol**: MATIC
   - **Block Explorer URL**: `https://mumbai.polygonscan.com/`
5. Click "Save"

#### 1.2 Get Test ETH from Faucet

**For Goerli/Sepolia:**
1. Visit https://www.goerlifaucet.com/ or https://www.sepoliafaucet.com/
2. Connect your wallet
3. Enter your wallet address
4. Complete captcha (if required)
5. Claim test ETH (usually 0.5 - 1 ETH)
6. Wait for confirmation (1-2 minutes)

**For Mumbai:**
1. Visit https://faucet.polygon.technology/
2. Select "Mumbai" testnet
3. Enter your wallet address
4. Complete verification
5. Claim test MATIC
6. Wait for confirmation

### Step 2: Configure Environment for Testnet

1. **Update `.env.local` with testnet configuration:**
   ```
   NEXT_PUBLIC_NETWORK_ID=5  # 5 for Goerli, 11155111 for Sepolia
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x[YOUR_TESTNET_CONTRACT_ADDRESS]
   NEXT_PUBLIC_CHAIN_NAME=goerli  # or sepolia/mumbai
   NEXT_PUBLIC_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_KEY
   ```

2. **Verify your smart contract is deployed on the testnet:**
   - Check Etherscan (Goerli): https://goerli.etherscan.io/
   - Search for your contract address
   - Confirm it's verified (shows source code)

### Step 3: Start Development Server for Testnet

```bash
npm run dev
# or
yarn dev
```

The application should be available at `http://localhost:3000`

### Step 4: Test Core Features on Testnet

#### Test 4.1: Connect Wallet
1. Open http://localhost:3000
2. Click "Connect Wallet" button
3. MetaMask popup should appear
4. **Verify**: Wallet is connected (address shown in header)
5. **Verify**: Network is set to Goerli/Sepolia/Mumbai

#### Test 4.2: View Account Balance
1. After connecting wallet, view your dashboard
2. **Verify**: Your test ETH/MATIC balance is displayed
3. **Verify**: Balance updates after transactions

#### Test 4.3: Send Micro-Tip
1. Navigate to tip functionality
2. Enter recipient address (or username if supported)
3. Enter tip amount (e.g., 0.001 ETH)
4. Add optional message
5. Click "Send Tip"
6. **Verify**: MetaMask popup for transaction approval
7. **Verify**: Transaction is submitted
8. **Verify**: Gas fees are calculated correctly
9. **Verify**: Transaction appears in transaction history
10. Wait for transaction confirmation (30 seconds - 2 minutes)
11. **Verify**: Recipient balance increases

#### Test 4.4: Receive Micro-Tip
1. Have another testnet wallet (or friend) send you a tip
2. **Verify**: Tip notification appears
3. **Verify**: Your balance increases
4. **Verify**: Transaction appears in history

#### Test 4.5: Transaction History
1. Go to transaction history page
2. **Verify**: All sent tips are listed
3. **Verify**: All received tips are listed
4. **Verify**: Transaction timestamps are accurate
5. **Verify**: Transaction amounts are correct
6. **Verify**: Transaction status shows (pending/completed/failed)

#### Test 4.6: User Profile
1. Navigate to profile page
2. **Verify**: Profile information displays correctly
3. **Verify**: Statistics show accurate data (total sent, total received, tip count)
4. **Verify**: Edit profile functionality works (if available)
5. **Verify**: Profile picture uploads (if available)

#### Test 4.7: Error Handling
1. Try sending a tip with insufficient balance
2. **Verify**: Appropriate error message appears
3. Try sending to invalid address
4. **Verify**: Address validation error appears
5. Try sending 0 or negative amount
6. **Verify**: Amount validation error appears
7. Disconnect wallet and try transaction
8. **Verify**: "Connect Wallet" prompt appears

### Step 5: Performance Testing on Testnet

1. **Load Testing**
   - Open developer tools (F12)
   - Go to Network tab
   - Perform normal operations
   - **Verify**: Page loads in under 3 seconds
   - **Verify**: Transactions submit within 1-2 seconds

2. **Gas Optimization Testing**
   - Send multiple tips in sequence
   - **Verify**: Gas fees are reasonable
   - **Verify**: Gas estimates are accurate

### Step 6: Document Testnet Results

Create a test report with:
- ✅ Passed tests
- ❌ Failed tests
- 🐛 Bugs found
- 💡 Improvements suggested
- ⏱️ Performance metrics

---

## Mainnet Testing Guide

### ⚠️ CRITICAL WARNINGS FOR MAINNET

**Before proceeding:**
1. **DO NOT test without reviewing all code and security audits**
2. **Start with SMALL amounts of real money**
3. **Have you tested extensively on testnet?** (Mandatory)
4. **Is your smart contract audited?** (Highly recommended)
5. **Do you have wallet backup and recovery plan?** (Essential)
6. **Is your infrastructure production-ready?** (Required)

### Step 1: Configure Mainnet Wallet

#### 1.1 Switch Network to Ethereum Mainnet

1. Open MetaMask
2. Click the network dropdown
3. Select "Ethereum Mainnet"
4. **Verify**: You see "Ethereum Mainnet" displayed

#### 1.2 Ensure Sufficient ETH

1. Check your mainnet balance
2. **Recommended minimum**: 0.5 ETH (for gas and tips)
3. **For testing**: Start with 0.05 - 0.1 ETH
4. If you need ETH, purchase from exchange (Coinbase, Kraken, etc.)

### Step 2: Configure Environment for Mainnet

1. **Update `.env.local` with mainnet configuration:**
   ```
   NEXT_PUBLIC_NETWORK_ID=1  # 1 for Ethereum Mainnet
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x[YOUR_MAINNET_CONTRACT_ADDRESS]
   NEXT_PUBLIC_CHAIN_NAME=mainnet
   NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
   NEXT_PUBLIC_ENVIRONMENT=production
   ```

2. **Verify smart contract is deployed on mainnet:**
   - Check Etherscan: https://etherscan.io/
   - Search for your contract address
   - **Verify**: Contract is verified with source code
   - **Verify**: No warning signs or suspicious activity

### Step 3: Pre-Launch Security Checklist

Before launching to mainnet, complete this checklist:

- [ ] Smart contract audited by reputable auditor
- [ ] All testnet tests passed
- [ ] Code reviewed by team members
- [ ] Security best practices implemented
- [ ] Rate limiting in place
- [ ] Input validation on all fields
- [ ] Reentrancy guards implemented
- [ ] Overflow/underflow protection (using SafeMath)
- [ ] Access control properly configured
- [ ] Emergency pause mechanism tested
- [ ] Monitoring and alerting configured
- [ ] Error logging configured
- [ ] Backup and recovery procedures documented
- [ ] Legal/compliance review completed (if required)

### Step 4: Start Application in Production Mode

```bash
npm run build
npm run start
# or
yarn build
yarn start
```

**Verify**: Application loads without errors at `http://localhost:3000` (or your production URL)

### Step 5: Monitor Network Activity

Set up monitoring BEFORE testing:

1. **Set up Etherscan Alerts** (https://etherscan.io/alerts)
   - Alert for your contract address
   - Alert for your wallet address
   - Set email notifications

2. **Set up MetaMask Alerts**
   - MetaMask will show transactions
   - Review each transaction carefully

3. **Set up Application Logging**
   - Ensure all transactions are logged
   - Set up real-time alerts for errors
   - Monitor for unusual activity

### Step 6: Test Critical Features on Mainnet (Minimal Testing)

#### Test 6.1: Wallet Connection
1. Open application
2. Click "Connect Wallet"
3. **Verify**: Connected to Ethereum Mainnet
4. **Verify**: Wallet address displayed

#### Test 6.2: First Micro-Tip (VERY SMALL AMOUNT)
1. Send a tip of **0.0001 ETH** (approximately $0.20 at $2000/ETH)
2. To a trusted address (preferably one you control)
3. **Verify**: Transaction appears in MetaMask
4. **Verify**: Review gas fees carefully
5. **Verify**: Confirm you understand the actual cost
6. **Verify**: Click "Confirm" only after double-checking
7. **Verify**: Transaction is submitted
8. **Verify**: Transaction hash is saved
9. Wait for confirmation (30 seconds - 5 minutes)
10. **Verify**: Transaction completed on Etherscan

#### Test 6.3: Verify Transaction on Etherscan
1. Copy transaction hash from application
2. Visit https://etherscan.io/
3. Paste transaction hash in search
4. **Verify**: Transaction shows as confirmed
5. **Verify**: Correct amount sent
6. **Verify**: Correct recipient received funds
7. **Verify**: Gas used is reasonable

#### Test 6.4: Receive Mainnet Tip
1. Have another user send you a small tip (0.0001 ETH)
2. **Verify**: Tip received correctly
3. **Verify**: Balance updated
4. **Verify**: Transaction appears in history

### Step 7: Post-Launch Monitoring

#### Daily Monitoring (First 2 weeks)
- [ ] Check application logs for errors
- [ ] Monitor transaction success rate
- [ ] Review user feedback for issues
- [ ] Check Etherscan for contract activity
- [ ] Verify all transactions are legitimate
- [ ] Monitor gas prices and adjust if needed

#### Weekly Review
- [ ] Total transaction volume
- [ ] User count growth
- [ ] Average tip amount
- [ ] Error/failure rates
- [ ] Performance metrics
- [ ] User complaints or issues

#### Security Monitoring
- [ ] Watch for suspicious addresses
- [ ] Monitor for large transactions
- [ ] Check for repeat failed transactions
- [ ] Review access logs
- [ ] Verify contract state hasn't changed unexpectedly

---

## Common Testing Scenarios

### Scenario 1: High Gas Price Environment

**Situation**: Gas prices are very high ($50+ per transaction)

**Testing Steps**:
1. Load application during high gas time (check https://etherscan.io/gastracker)
2. **Verify**: Gas estimate is displayed to user
3. **Verify**: User can decide to proceed or wait
4. Consider implementing gas limit strategies:
   - Option to batch transactions
   - Option to wait for lower gas
   - Display of historical gas prices

### Scenario 2: Network Congestion

**Situation**: Network is congested, transactions taking longer

**Testing Steps**:
1. Monitor transaction times
2. Test with different gas prices (slow, standard, fast)
3. **Verify**: Application handles pending transactions correctly
4. **Verify**: User can view pending transaction status
5. **Verify**: User can increase gas (speed up) if needed

### Scenario 3: Multiple Rapid Transactions

**Situation**: User sends multiple tips in quick succession

**Testing Steps**:
1. Send 5 tips rapidly
2. **Verify**: All transactions submit correctly
3. **Verify**: Nonce is handled correctly (no duplicate transaction)
4. **Verify**: Balance updates correctly after each
5. **Verify**: No race conditions occur

### Scenario 4: Network Switching

**Situation**: User switches between networks in MetaMask

**Testing Steps**:
1. While connected to Mainnet, switch to Testnet in MetaMask
2. **Verify**: Application detects network change
3. **Verify**: Application shows warning or switches gracefully
4. **Verify**: Contract address updates if needed
5. **Verify**: No stuck transactions or errors

### Scenario 5: Wallet Disconnection

**Situation**: User disconnects wallet during operation

**Testing Steps**:
1. Connect wallet
2. During transaction, disconnect in MetaMask
3. **Verify**: Application detects disconnection
4. **Verify**: Appropriate error message displayed
5. **Verify**: User can reconnect and continue
6. **Verify**: No orphaned transactions

### Scenario 6: Low Balance

**Situation**: User tries to tip more than balance

**Testing Steps**:
1. Check wallet balance (e.g., 0.01 ETH)
2. Try to send 0.02 ETH tip
3. **Verify**: Error message: "Insufficient balance"
4. **Verify**: Transaction doesn't submit
5. **Verify**: Suggested tip amount is less than balance minus gas

### Scenario 7: Maximum Transaction Size

**Situation**: User tries to send an extremely large tip

**Testing Steps**:
1. Try to send 1000 ETH (if wallet has it)
2. **Verify**: Either:
   - Transaction succeeds (if no limit)
   - Error message appears (if limit set)
3. **Verify**: Gas calculation is correct
4. **Verify**: No overflow/underflow errors

### Scenario 8: Invalid Address

**Situation**: User enters incorrect recipient address

**Testing Steps**:
1. Try sending tip to random address: `0x1234567890123456789012345678901234567890`
2. **Verify**: Address validation occurs
3. **Verify**: Option to add to contacts (if feature exists)
4. **Verify**: Confirmation before sending
5. **Verify**: Transaction succeeds (address is valid on blockchain)

### Scenario 9: Smart Contract Bug

**Situation**: Testing for common smart contract vulnerabilities

**Testing Steps**:
1. **Reentrancy**: Can't call function recursively to drain balance
2. **Integer Overflow**: Can't cause overflow by sending huge amount
3. **Access Control**: Only authorized addresses can withdraw
4. **Pause Function**: Admin can pause contract in emergency
5. Review contract code for these common issues

---

## Troubleshooting

### Issue: MetaMask Won't Connect

**Solutions**:
1. Ensure MetaMask is installed and enabled
2. Check browser compatibility (use Chrome or Firefox)
3. Refresh page and try again
4. Check MetaMask is on correct network
5. Try incognito/private mode
6. Check browser console for errors (F12 → Console)

### Issue: Transaction Stuck/Pending

**Solutions**:
1. Check transaction on Etherscan
2. If really pending:
   - Open MetaMask
   - Find transaction
   - Click "Speed up" to increase gas
   - Or "Cancel" to cancel transaction
3. Wait at least 30 minutes before taking action
4. Check RPC endpoint status

### Issue: "Insufficient Balance" Error

**Solutions**:
1. Check your actual balance (not estimated)
2. Account for gas fees (typically 0.001-0.01 ETH)
3. Wait for previous transactions to confirm
4. Request more funds from faucet (testnet) or exchange (mainnet)

### Issue: Wrong Network Selected

**Solutions**:
1. Open MetaMask
2. Click network dropdown
3. Select correct network (Mainnet, Goerli, Sepolia, etc.)
4. Refresh application
5. Reconnect wallet if needed

### Issue: Contract Function Reverts

**Solutions**:
1. Check transaction on Etherscan
2. View "Revert Reason" if available
3. Common reasons:
   - Insufficient balance
   - Insufficient allowance (if using ERC20)
   - Not authorized (if access-controlled)
   - Contract paused
   - Invalid parameters
4. Check smart contract code for require() statements

### Issue: High Gas Fees

**Solutions**:
1. Check current gas prices: https://etherscan.io/gastracker
2. Wait for lower gas time (weekends, off-peak hours)
3. Batch transactions if possible
4. Check if using optimized contract (Layer 2 solutions)
5. Consider using Polygon or L2 networks with lower fees

### Issue: Application Crashes or Hangs

**Solutions**:
1. Check browser console for errors (F12 → Console)
2. Check application logs
3. Clear browser cache and cookies
4. Try different browser
5. Check RPC endpoint is responsive
6. Check internet connection
7. Review application logs for exceptions

### Issue: Data Not Updating in Real-Time

**Solutions**:
1. Enable Etherscan alerts for notifications
2. Manually refresh page (F5)
3. Wait for block confirmation (12 seconds average)
4. Check RPC endpoint rate limiting
5. Verify websocket connections are active

---

## Best Practices for Testing

### Before Every Test
- ✅ Backup wallet seed phrase
- ✅ Note current balances
- ✅ Check gas prices
- ✅ Review expected outcomes
- ✅ Have alternative addresses ready

### During Testing
- ✅ Document everything
- ✅ Take screenshots of errors
- ✅ Keep transaction hashes
- ✅ Note timestamps
- ✅ Monitor gas prices
- ✅ Check logs continuously

### After Testing
- ✅ Verify all transactions completed
- ✅ Reconcile balances
- ✅ Review for anomalies
- ✅ Update test reports
- ✅ Archive logs and screenshots
- ✅ Communicate findings

---

## Safety Checklist

### Testnet Safety
- [ ] Using only test networks
- [ ] Using test ETH/MATIC (not real money)
- [ ] MetaMask is not set to reveal seed phrase
- [ ] Clear differentiation between testnet and mainnet

### Mainnet Safety
- [ ] Tested extensively on testnet first
- [ ] Smart contract professionally audited
- [ ] Started with minimal amount ($100 or less)
- [ ] Code has been reviewed
- [ ] Wallet backup is secure
- [ ] No seed phrase stored digitally
- [ ] Hardware wallet considered for high-value operations
- [ ] Emergency pause plan is in place
- [ ] Monitoring and alerts are active
- [ ] Insurance/reentrancy guards in place

---

## Support and Resources

### Useful Links
- **Ethereum Mainnet**: https://etherscan.io/
- **Goerli Testnet**: https://goerli.etherscan.io/
- **Sepolia Testnet**: https://sepolia.etherscan.io/
- **Polygon Mumbai**: https://mumbai.polygonscan.com/
- **MetaMask**: https://metamask.io/
- **Infura**: https://infura.io/
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/
- **Solidity Docs**: https://docs.soliditylang.org/

### Getting Help
1. Check application logs for error messages
2. Search Etherscan for transaction details
3. Review browser console (F12)
4. Check GitHub Issues
5. Contact development team
6. Review smart contract source code on Etherscan

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-19 | 1.0 | Initial comprehensive testing guide |

---

**Last Updated**: 2025-12-19

**Maintainer**: awwbhi

**Questions or Issues?**: Please open an issue on GitHub or contact the development team.
