# Testing Guide

This comprehensive guide covers testing procedures for the Micro-tip Platform across both testnet and mainnet environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Testnet Testing](#testnet-testing)
- [Mainnet Testing](#mainnet-testing)
- [Test Scenarios](#test-scenarios)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting any testing, ensure you have:

- Node.js (v14 or higher)
- npm or yarn package manager
- A Web3 wallet (MetaMask, TrustWallet, etc.)
- Test tokens for the relevant network
- Access to the environment configuration files

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/awwbhi/Micro-tip-platftom.git
   cd Micro-tip-platftom
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```

## Testnet Testing

### Network Configuration

Testnet environments allow for risk-free testing with test tokens. Supported testnets include:
- **Ethereum Sepolia**: For Ethereum smart contract testing
- **Polygon Mumbai**: For Polygon layer-2 testing
- **Other EVM-compatible testnets**: As needed

### Testnet Setup

1. **Configure Network in Wallet**
   - Open your Web3 wallet
   - Add the testnet RPC endpoint
   - Request test tokens from the faucet

2. **Environment Variables**
   ```bash
   REACT_APP_NETWORK=testnet
   REACT_APP_RPC_URL=<testnet_rpc_endpoint>
   REACT_APP_CONTRACT_ADDRESS=<testnet_contract_address>
   REACT_APP_CHAIN_ID=<testnet_chain_id>
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

### Testnet Test Scenarios

#### Basic Functionality Tests

1. **User Registration & Wallet Connection**
   - Connect wallet to the application
   - Verify user profile creation
   - Confirm account details are saved correctly
   - Test wallet disconnection and reconnection

2. **Tipping Functionality**
   - Create a tip transaction
   - Verify transaction appears in wallet
   - Confirm transaction hash is logged
   - Wait for transaction confirmation
   - Verify tip appears in user dashboard

3. **Transaction History**
   - Send multiple tips
   - Verify all transactions appear in history
   - Test filtering by date range
   - Test sorting options (newest first, oldest first, etc.)
   - Export transaction history

4. **Balance & Gas Fee Estimation**
   - Check wallet balance display
   - Verify gas fee estimates are accurate
   - Test fee calculation for different tip amounts
   - Confirm balance updates after transaction

#### Smart Contract Interaction Tests

1. **Contract Deployment Verification**
   - Verify contract is deployed at expected address
   - Check contract ABI matches implementation
   - Confirm contract owner/admin settings

2. **Contract State Tests**
   - Read total tips distributed
   - Verify recipient data accuracy
   - Check reward calculations
   - Test access control mechanisms

3. **Error Handling**
   - Attempt to send 0 value transactions
   - Try to send from insufficient balance
   - Test maximum transaction limits
   - Attempt unauthorized operations

### Running Testnet Tests

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- TESTING_GUIDE.test.js
```

## Mainnet Testing

### Pre-Mainnet Checklist

Before deploying to mainnet, complete all of the following:

- [ ] All testnet tests pass with 100% coverage
- [ ] Smart contracts are audited (internal or external)
- [ ] Code review completed by senior developers
- [ ] Security best practices validated
- [ ] Performance benchmarks meet targets
- [ ] Documentation is complete and accurate
- [ ] Emergency pause/withdrawal procedures are tested
- [ ] Team is prepared for potential issues

### Mainnet Setup

1. **Network Configuration**
   ```bash
   REACT_APP_NETWORK=mainnet
   REACT_APP_RPC_URL=<mainnet_rpc_endpoint>
   REACT_APP_CONTRACT_ADDRESS=<mainnet_contract_address>
   REACT_APP_CHAIN_ID=<mainnet_chain_id>
   REACT_APP_ENVIRONMENT=production
   ```

2. **Mainnet Build**
   ```bash
   npm run build
   npm run start
   ```

3. **Verification**
   - Verify all environment variables are correctly set
   - Confirm contract address matches deployment records
   - Check network connectivity to mainnet RPC

### Mainnet Test Strategy

#### Phased Rollout Approach

**Phase 1: Limited Launch (Day 1)**
- Launch to internal team only
- Monitor for critical issues
- Verify all core functionality works
- Check transaction confirmation times

**Phase 2: Beta Users (Days 2-3)**
- Open to trusted beta testers
- Monitor error logs and analytics
- Gather user feedback
- Test with real (small) transactions

**Phase 3: Public Launch (Day 4+)**
- Open to all users
- Implement rate limiting if needed
- Monitor system performance
- Be ready for rapid response to issues

#### Critical Path Tests on Mainnet

1. **Real Transaction Tests**
   - Send small test tips (e.g., 0.001 ETH)
   - Verify transaction appears on block explorer
   - Confirm transaction reaches finality
   - Check that recipient balance updates

2. **Multi-User Scenarios**
   - Multiple users sending tips simultaneously
   - Verify all transactions are processed correctly
   - Check database consistency
   - Monitor API response times

3. **Edge Cases**
   - Send during high network congestion
   - Test with minimum and maximum amounts
   - Try rapid successive transactions
   - Test with various wallet types

4. **Recovery & Safety**
   - Test emergency pause mechanism
   - Verify funds can be withdrawn
   - Check that paused state prevents new tips
   - Test resuming after pause

### Monitoring on Mainnet

```bash
# Monitor application logs
npm run logs

# Monitor blockchain transactions
# Use block explorer: https://etherscan.io (or equivalent for your chain)

# Monitor performance metrics
npm run monitor
```

## Test Scenarios

### User Journey Tests

#### Scenario 1: New User Complete Flow
1. Visit application
2. Connect wallet (first time)
3. Authorize wallet connection
4. View initial dashboard
5. Send first tip (0.01 ETH)
6. Verify transaction in wallet
7. Wait for confirmation
8. View tip in dashboard
9. Disconnect wallet
10. Reconnect wallet
11. Verify tip history persists

#### Scenario 2: Multiple Rapid Tips
1. Connect wallet
2. Send 5 tips in quick succession
3. Verify all appear in pending state
4. Monitor confirmations
5. Verify all appear in history after confirmation
6. Check balance is updated correctly

#### Scenario 3: Network Interruption Recovery
1. Start sending a tip
2. Interrupt network connection
3. Wait 5 seconds
4. Restore connection
5. Verify transaction status
6. Check if transaction proceeded or was cancelled
7. Verify UI reflects correct state

### Performance Tests

```bash
# Load testing
npm run test:load

# Performance benchmarks
npm run test:performance

# Memory leak detection
npm run test:memory
```

Expected benchmarks:
- Page load time: < 3 seconds
- Tip submission: < 2 seconds
- Transaction confirmation display: Real-time (< 1 second update)
- API response time: < 500ms

### Security Tests

1. **Input Validation**
   - Test with special characters in inputs
   - Test with extremely large numbers
   - Test with negative numbers
   - Test with null/undefined values

2. **Authentication & Authorization**
   - Verify signature verification works
   - Test with modified transaction data
   - Verify only wallet owner can approve transactions
   - Test permission restrictions

3. **Contract Security**
   - Verify re-entrancy protection (if applicable)
   - Check for integer overflow/underflow protection
   - Verify state changes are atomic
   - Test access control boundaries

## Troubleshooting

### Common Issues

#### Transaction Fails with "Insufficient Balance"
- **Solution**: Ensure wallet has enough balance for tip amount + gas fees
- **Debug**: Check estimated gas fee and balance before confirming

#### Transaction Pending Forever
- **Solution**: Check network status; transactions may be stuck if network is congested
- **Debug**: Check etherscan.io for transaction status
- **Action**: Potentially increase gas price and resend

#### Wallet Won't Connect
- **Solution**: 
  - Refresh the page
  - Ensure wallet browser extension is unlocked
  - Check that you've selected the correct network
  - Try a different browser or wallet if issue persists
- **Debug**: Check browser console for connection errors

#### Contract Not Found
- **Solution**: Verify contract address in environment variables
- **Debug**: Check the address on the block explorer to confirm it exists
- **Action**: Update environment variables if address is incorrect

#### Gas Estimation Errors
- **Solution**: Ensure wallet is connected and has sufficient balance
- **Debug**: Test with a smaller tip amount
- **Action**: Check if contract has been deployed correctly

### Getting Help

1. Check the project README for common setup issues
2. Review error logs: `npm run logs`
3. Check smart contract on block explorer
4. Search existing GitHub issues
5. Create a new issue with:
   - Network and chain ID
   - Error message and logs
   - Steps to reproduce
   - Browser and wallet information

## Test Report Template

Use this template to document test results:

```markdown
## Test Report - [Date]

**Tester**: [Name]
**Network**: [Testnet/Mainnet]
**Environment**: [Dev/Staging/Production]

### Tests Passed
- [ ] Test 1
- [ ] Test 2

### Tests Failed
- [ ] Test 1
  - Error: [Description]
  - Reproduction Steps: [Steps]
  - Severity: [Critical/High/Medium/Low]

### Issues Found
- Issue #1: [Description]

### Performance Metrics
- Page Load Time: [Time]
- Transaction Speed: [Time]
- API Response: [Time]

### Notes
[Additional observations and recommendations]
```

## Continuous Testing

For CI/CD pipelines, implement automated testing:

```bash
# Run all tests in CI mode
npm run test:ci

# Generate test coverage report
npm run test:coverage

# Upload coverage to service
npm run coverage:upload
```

## Conclusion

Thorough testing across both testnet and mainnet is essential for a secure and reliable platform. Follow this guide carefully, document all results, and maintain a clear record of what has been tested and verified before each deployment.

---

**Last Updated**: December 19, 2025
**Document Version**: 1.0