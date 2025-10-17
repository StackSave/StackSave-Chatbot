import { ethers } from 'ethers';
import { config } from '../config';
import { TransactionResult, UserData } from '../types';

export class DefiService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | ethers.HDNodeWallet;
  private stakingContract?: ethers.Contract;

  // Simple ABI for staking contract (you'll need to replace with your actual ABI)
  private stakingABI = [
    'function deposit() public payable',
    'function withdraw(uint256 amount) public',
    'function stake(uint256 amount) public',
    'function unstake(uint256 amount) public',
    'function balanceOf(address account) public view returns (uint256)',
    'function stakedBalanceOf(address account) public view returns (uint256)',
  ];

  constructor() {
    // Make blockchain setup optional for testing
    if (!config.blockchain.privateKey || config.blockchain.privateKey === 'your_private_key_here') {
      console.warn('⚠️  Private key not configured - DeFi features will be disabled');
      // Create a dummy provider for non-blockchain operations
      this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
      this.wallet = ethers.Wallet.createRandom().connect(this.provider);
      return;
    }

    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    this.wallet = new ethers.Wallet(config.blockchain.privateKey, this.provider);

    if (config.blockchain.stakingContractAddress) {
      this.stakingContract = new ethers.Contract(
        config.blockchain.stakingContractAddress,
        this.stakingABI,
        this.wallet
      );
    }
  }

  // Generate or retrieve wallet address for user
  async getUserWallet(phoneNumber: string): Promise<string> {
    // In production, you should:
    // 1. Store user wallets in a secure database
    // 2. Use proper key management (HSM, KMS, etc.)
    // 3. Consider using account abstraction

    // For now, derive from phone number (NOT SECURE - for demo only)
    const hash = ethers.id(phoneNumber);
    const wallet = new ethers.Wallet(hash, this.provider);
    return wallet.address;
  }

  async getBalance(phoneNumber: string): Promise<UserData> {
    try {
      const walletAddress = await this.getUserWallet(phoneNumber);

      let balance = '0';
      let stakedAmount = '0';

      if (this.stakingContract) {
        const balanceWei = await this.stakingContract.balanceOf(walletAddress);
        balance = ethers.formatEther(balanceWei);

        const stakedWei = await this.stakingContract.stakedBalanceOf(walletAddress);
        stakedAmount = ethers.formatEther(stakedWei);
      }

      return {
        phoneNumber,
        walletAddress,
        balance,
        stakedAmount,
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new Error('Failed to retrieve balance');
    }
  }

  async deposit(phoneNumber: string, amount: number): Promise<TransactionResult> {
    try {
      if (!this.stakingContract) {
        throw new Error('Staking contract not configured');
      }

      const amountWei = ethers.parseEther(amount.toString());

      const tx = await this.stakingContract.deposit({
        value: amountWei,
      });

      await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        amount: amount.toString(),
      };
    } catch (error: any) {
      console.error('Deposit error:', error);
      return {
        success: false,
        error: error.message || 'Deposit failed',
      };
    }
  }

  async withdraw(phoneNumber: string, amount: number): Promise<TransactionResult> {
    try {
      if (!this.stakingContract) {
        throw new Error('Staking contract not configured');
      }

      const amountWei = ethers.parseEther(amount.toString());

      const tx = await this.stakingContract.withdraw(amountWei);
      await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        amount: amount.toString(),
      };
    } catch (error: any) {
      console.error('Withdraw error:', error);
      return {
        success: false,
        error: error.message || 'Withdrawal failed',
      };
    }
  }

  async stake(phoneNumber: string, amount: number): Promise<TransactionResult> {
    try {
      if (!this.stakingContract) {
        throw new Error('Staking contract not configured');
      }

      const amountWei = ethers.parseEther(amount.toString());

      const tx = await this.stakingContract.stake(amountWei);
      await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        amount: amount.toString(),
      };
    } catch (error: any) {
      console.error('Stake error:', error);
      return {
        success: false,
        error: error.message || 'Staking failed',
      };
    }
  }

  async unstake(phoneNumber: string, amount: number): Promise<TransactionResult> {
    try {
      if (!this.stakingContract) {
        throw new Error('Staking contract not configured');
      }

      const amountWei = ethers.parseEther(amount.toString());

      const tx = await this.stakingContract.unstake(amountWei);
      await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        amount: amount.toString(),
      };
    } catch (error: any) {
      console.error('Unstake error:', error);
      return {
        success: false,
        error: error.message || 'Unstaking failed',
      };
    }
  }

  // Get current gas price for transaction estimation
  async getGasPrice(): Promise<string> {
    const feeData = await this.provider.getFeeData();
    return ethers.formatUnits(feeData.gasPrice || 0n, 'gwei');
  }

  // Check if contract is available
  isContractConfigured(): boolean {
    return !!this.stakingContract;
  }
}
