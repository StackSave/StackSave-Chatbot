import { Message } from 'whatsapp-web.js';
import { LLMService } from '../services/llmService';
import { DefiService } from '../services/defiService';
import { IntentType } from '../types';

export class MessageHandler {
  private llmService: LLMService;
  private defiService: DefiService;

  constructor() {
    this.llmService = new LLMService();
    this.defiService = new DefiService();
  }

  async handleMessage(message: Message): Promise<void> {
    try {
      const messageBody = message.body.trim();
      const phoneNumber = message.from.replace('@c.us', '');

      console.log(`[${phoneNumber}] Received: ${messageBody}`);

      // Send typing indicator
      const chat = await message.getChat();
      await chat.sendStateTyping();

      // Detect intent using LLM
      const intentResponse = await this.llmService.detectIntent(messageBody);

      console.log(`[${phoneNumber}] Intent: ${intentResponse.intent} (confidence: ${intentResponse.confidence})`);

      // Process based on intent
      let responseMessage = '';

      switch (intentResponse.intent) {
        case IntentType.DEPOSIT:
          responseMessage = await this.handleDeposit(phoneNumber, intentResponse.amount);
          break;

        case IntentType.WITHDRAW:
          responseMessage = await this.handleWithdraw(phoneNumber, intentResponse.amount);
          break;

        case IntentType.CHECK_BALANCE:
          responseMessage = await this.handleCheckBalance(phoneNumber);
          break;

        case IntentType.STAKE:
          responseMessage = await this.handleStake(phoneNumber, intentResponse.amount);
          break;

        case IntentType.UNSTAKE:
          responseMessage = await this.handleUnstake(phoneNumber, intentResponse.amount);
          break;

        case IntentType.HELP:
          responseMessage = await this.handleHelp();
          break;

        case IntentType.UNKNOWN:
        default:
          responseMessage = await this.handleUnknown();
          break;
      }

      // Send response
      await message.reply(responseMessage);

      console.log(`[${phoneNumber}] Sent: ${responseMessage.substring(0, 50)}...`);
    } catch (error) {
      console.error('Error handling message:', error);
      await message.reply(
        'Sorry, I encountered an error processing your request. Please try again later.'
      );
    }
  }

  private async handleDeposit(phoneNumber: string, amount?: number): Promise<string> {
    if (!amount || amount <= 0) {
      return 'Please specify a valid amount to deposit. For example: "Deposit 100 USDC"';
    }

    if (!this.defiService.isContractConfigured()) {
      return 'Deposit feature is currently under maintenance. Please try again later.';
    }

    const result = await this.defiService.deposit(phoneNumber, amount);

    return await this.llmService.generateResponse(IntentType.DEPOSIT, {
      success: result.success,
      amount: amount,
      txHash: result.txHash,
      error: result.error,
    });
  }

  private async handleWithdraw(phoneNumber: string, amount?: number): Promise<string> {
    if (!amount || amount <= 0) {
      return 'Please specify a valid amount to withdraw. For example: "Withdraw 50 USDC"';
    }

    if (!this.defiService.isContractConfigured()) {
      return 'Withdrawal feature is currently under maintenance. Please try again later.';
    }

    const result = await this.defiService.withdraw(phoneNumber, amount);

    return await this.llmService.generateResponse(IntentType.WITHDRAW, {
      success: result.success,
      amount: amount,
      txHash: result.txHash,
      error: result.error,
    });
  }

  private async handleCheckBalance(phoneNumber: string): Promise<string> {
    if (!this.defiService.isContractConfigured()) {
      return 'Balance checking is currently disabled. Please configure your blockchain settings to use DeFi features.';
    }

    try {
      const userData = await this.defiService.getBalance(phoneNumber);

      return await this.llmService.generateResponse(IntentType.CHECK_BALANCE, {
        balance: userData.balance,
        staked: userData.stakedAmount,
        walletAddress: userData.walletAddress,
      });
    } catch (error) {
      return 'Unable to retrieve your balance at the moment. Please try again later.';
    }
  }

  private async handleStake(phoneNumber: string, amount?: number): Promise<string> {
    if (!amount || amount <= 0) {
      return 'Please specify a valid amount to stake. For example: "Stake 100 USDC"';
    }

    if (!this.defiService.isContractConfigured()) {
      return 'Staking feature is currently under maintenance. Please try again later.';
    }

    const result = await this.defiService.stake(phoneNumber, amount);

    return await this.llmService.generateResponse(IntentType.STAKE, {
      success: result.success,
      amount: amount,
      txHash: result.txHash,
      error: result.error,
    });
  }

  private async handleUnstake(phoneNumber: string, amount?: number): Promise<string> {
    if (!amount || amount <= 0) {
      return 'Please specify a valid amount to unstake. For example: "Unstake 50 USDC"';
    }

    if (!this.defiService.isContractConfigured()) {
      return 'Unstaking feature is currently under maintenance. Please try again later.';
    }

    const result = await this.defiService.unstake(phoneNumber, amount);

    return await this.llmService.generateResponse(IntentType.UNSTAKE, {
      success: result.success,
      amount: amount,
      txHash: result.txHash,
      error: result.error,
    });
  }

  private async handleHelp(): Promise<string> {
    return await this.llmService.generateResponse(IntentType.HELP, {});
  }

  private async handleUnknown(): Promise<string> {
    return await this.llmService.generateResponse(IntentType.UNKNOWN, {});
  }
}
