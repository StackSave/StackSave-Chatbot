import OpenAI from 'openai';
import axios from 'axios';
import { config } from '../config';
import { IntentType, LLMResponse } from '../types';

export class LLMService {
  private openai?: OpenAI;

  constructor() {
    if (config.llm.provider === 'openai' && config.llm.openaiApiKey) {
      console.log('🔧 Initializing OpenAI client...');
      console.log(`   Provider: ${config.llm.provider}`);
      console.log(`   Base URL: ${config.llm.openaiBaseUrl || 'default (OpenAI)'}`);
      console.log(`   API Key: ${config.llm.openaiApiKey.substring(0, 8)}...`);

      this.openai = new OpenAI({
        apiKey: config.llm.openaiApiKey,
        baseURL: config.llm.openaiBaseUrl, // Support custom base URL (e.g., AI/ML API)
      });
    }
  }

  async detectIntent(message: string): Promise<LLMResponse> {
    // Temporarily use regex-based detection as primary method
    // LLM is disabled until API issues are resolved
    console.log('🔍 Using regex-based intent detection');
    return this.fallbackIntentDetection(message);

    /* LLM-based detection - temporarily disabled
    const systemPrompt = `You are an intent classifier for a DeFi savings chatbot called StackSave.
Analyze user messages and classify them into one of these intents:
- DEPOSIT: User wants to deposit money
- WITHDRAW: User wants to withdraw money
- CHECK_BALANCE: User wants to check their balance
- STAKE: User wants to stake their funds
- UNSTAKE: User wants to unstake their funds
- HELP: User needs help or information
- UNKNOWN: Cannot determine intent

Extract any mentioned amounts and coin types (e.g., USDC, ETH, BTC).
Respond ONLY in valid JSON format:
{
  "intent": "INTENT_TYPE",
  "amount": number or null,
  "coin": "string or null",
  "confidence": 0.0-1.0,
  "explanation": "brief explanation"
}`;

    try {
      switch (config.llm.provider) {
        case 'openai':
          return await this.detectIntentOpenAI(message, systemPrompt);

        case 'anthropic':
          return await this.detectIntentAnthropic(message, systemPrompt);

        case 'custom':
          return await this.detectIntentCustom(message, systemPrompt);

        default:
          console.warn(`Unknown LLM provider: ${config.llm.provider}, using fallback`);
          return this.fallbackIntentDetection(message);
      }
    } catch (error) {
      console.error('LLM intent detection error:', error);
      return this.fallbackIntentDetection(message);
    }
    */
  }

  private async detectIntentOpenAI(message: string, systemPrompt: string): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    console.log('🤖 Calling LLM for intent detection...');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Use gpt-3.5-turbo for better compatibility
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    console.log('✓ LLM response received');
    return this.parseIntentResponse(content);
  }

  private async detectIntentAnthropic(message: string, systemPrompt: string): Promise<LLMResponse> {
    if (!config.llm.anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\nUser message: ${message}`,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.llm.anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    const content = response.data.content[0]?.text;
    if (!content) {
      throw new Error('Empty response from Anthropic');
    }

    return this.parseIntentResponse(content);
  }

  private async detectIntentCustom(message: string, systemPrompt: string): Promise<LLMResponse> {
    if (!config.llm.customLlmUrl) {
      throw new Error('Custom LLM URL not configured');
    }

    const response = await axios.post(config.llm.customLlmUrl, {
      system: systemPrompt,
      message: message,
    });

    return this.parseIntentResponse(response.data.response || response.data.content);
  }

  private parseIntentResponse(content: string): LLMResponse {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      intent: parsed.intent as IntentType,
      amount: parsed.amount,
      coin: parsed.coin,
      confidence: parsed.confidence,
      explanation: parsed.explanation,
    };
  }

  // Fallback intent detection using simple keyword matching
  private fallbackIntentDetection(message: string): LLMResponse {
    const lowerMessage = message.toLowerCase();

    // Greetings - handle first to provide friendly onboarding
    if (lowerMessage.match(/^(hi|hello|hey|halo|hai|hei|pagi|siang|malam|selamat)/)) {
      return {
        intent: IntentType.HELP,
        confidence: 0.95,
      };
    }

    // Check for deposit keywords (Indonesian & English)
    if (lowerMessage.match(/(deposit|depo|setor|tabung|nabung|simpan|add|save|put in|masukkan)/)) {
      return {
        intent: IntentType.DEPOSIT,
        confidence: 0.8,
        ...this.extractAmountAndCoin(message),
      };
    }

    // Check for withdraw keywords (Indonesian & English)
    if (lowerMessage.match(/(withdraw|tarik|ambil|take out|remove|get|keluarkan)/)) {
      return {
        intent: IntentType.WITHDRAW,
        confidence: 0.8,
        ...this.extractAmountAndCoin(message),
      };
    }

    // Check for balance keywords (Indonesian & English)
    if (lowerMessage.match(/(balance|saldo|cek|check|how much|berapa|lihat)/)) {
      return {
        intent: IntentType.CHECK_BALANCE,
        confidence: 0.85,
      };
    }

    // Check for stake keywords (Indonesian & English)
    if (lowerMessage.match(/\b(stake|staking|invest|investasi)\b/) && !lowerMessage.includes('unstake')) {
      return {
        intent: IntentType.STAKE,
        confidence: 0.75,
        ...this.extractAmountAndCoin(message),
      };
    }

    // Check for unstake keywords (Indonesian & English)
    if (lowerMessage.match(/(unstake|unstaking|cabut stake|hentikan staking)/)) {
      return {
        intent: IntentType.UNSTAKE,
        confidence: 0.75,
        ...this.extractAmountAndCoin(message),
      };
    }

    // Check for help keywords (Indonesian & English)
    if (lowerMessage.match(/(help|bantuan|panduan|guide|how|cara|fitur|feature|what can|apa saja|bisa apa)/)) {
      return {
        intent: IntentType.HELP,
        confidence: 0.9,
      };
    }

    return {
      intent: IntentType.UNKNOWN,
      confidence: 0.5,
    };
  }

  private extractAmountAndCoin(message: string): { amount?: number; coin?: string } {
    const result: { amount?: number; coin?: string } = {};

    // Extract amount (numbers with optional decimal point)
    const amountMatch = message.match(/(\d+(?:\.\d+)?)/);
    if (amountMatch) {
      result.amount = parseFloat(amountMatch[1]);
    }

    // Extract coin type
    const coins = ['USDC', 'ETH', 'BTC', 'USDT', 'DAI'];
    const upperMessage = message.toUpperCase();
    for (const coin of coins) {
      if (upperMessage.includes(coin)) {
        result.coin = coin;
        break;
      }
    }

    return result;
  }

  async generateResponse(intent: IntentType, context: any): Promise<string> {
    const prompts: Record<IntentType, string> = {
      [IntentType.DEPOSIT]: `Generate a friendly, casual WhatsApp message (in Indonesian or English, match user's language) for a deposit transaction. Amount: ${context.amount}, Success: ${context.success}. Keep it short and natural.`,
      [IntentType.WITHDRAW]: `Generate a friendly WhatsApp message for a withdrawal. Amount: ${context.amount}, Success: ${context.success}. Keep it conversational.`,
      [IntentType.CHECK_BALANCE]: `Generate a friendly WhatsApp message showing balance. Balance: ${context.balance}, Staked: ${context.staked || '0'}. Make it casual and clear.`,
      [IntentType.STAKE]: `Generate a friendly WhatsApp message for staking. Amount: ${context.amount}, Success: ${context.success}. Sound excited if successful!`,
      [IntentType.UNSTAKE]: `Generate a friendly WhatsApp message for unstaking. Amount: ${context.amount}, Success: ${context.success}. Keep it simple.`,
      [IntentType.HELP]: `Generate a helpful WhatsApp message explaining StackSave, a DeFi savings bot. Features: deposit, withdraw, stake, check balance. Make it welcoming and easy to understand.`,
      [IntentType.UNKNOWN]: `Generate a polite WhatsApp message asking the user to clarify. Suggest they can ask about balance, deposit, withdraw, or stake.`,
    };

    const defaultResponses: Record<IntentType, string> = {
      [IntentType.DEPOSIT]: context.success
        ? `✅ Deposit successful!\n\nAmount: ${context.amount}\nTx Hash: ${context.txHash}\n\nYour funds are now ready to be invested! 🚀`
        : `❌ Sorry, deposit failed. Please try again or contact support if the issue persists.`,
      [IntentType.WITHDRAW]: context.success
        ? `✅ Withdrawal successful!\n\nAmount: ${context.amount}\nTx Hash: ${context.txHash}\n\nFunds have been sent to your wallet! 💰`
        : `❌ Withdrawal failed. Please ensure you have sufficient balance and try again.`,
      [IntentType.CHECK_BALANCE]: `💰 *Balance Information*\n\n📊 Available Balance: ${context.balance}\n🔒 Staked Amount: ${context.staked || '0'}\n\nWant to deposit more or withdraw? Just let me know! 😊`,
      [IntentType.STAKE]: context.success
        ? `🎉 Successfully staked!\n\nAmount: ${context.amount}\n\nYour funds are now earning rewards! 📈\nCheck progress anytime by typing "check balance"`
        : `❌ Staking failed. Please try again later!`,
      [IntentType.UNSTAKE]: context.success
        ? `✅ Unstake successful!\n\nAmount: ${context.amount}\n\nFunds are back in your main balance and ready to withdraw! 💵`
        : `❌ Unstake failed. Please try again in a few moments.`,
      [IntentType.HELP]: `👋 *Welcome to StackSave!*\n\nI'm your DeFi assistant ready to help you manage your crypto savings. Here's what I can do:\n\n💰 *Deposit* - Add funds to start saving\n📤 *Withdraw* - Take out funds anytime\n📊 *Check Balance* - View your balance and investments\n📈 *Stake* - Invest funds to earn rewards\n📉 *Unstake* - Withdraw your staked funds\n\nExamples:\n• "Deposit 100 USDC"\n• "Check balance"\n• "Withdraw 50"\n\nHow can I help you? 😊`,
      [IntentType.UNKNOWN]: `🤔 Hmm, I'm not sure what you mean...\n\nTry asking about:\n• Check balance\n• Deposit funds\n• Withdraw funds\n• Staking\n\nOr type "help" for more info!`,
    };

    // Try to use LLM for more natural responses
    try {
      if (!this.openai) {
        console.log('LLM not available, using default response');
        return defaultResponses[intent];
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Use gpt-3.5-turbo for better compatibility
        messages: [
          {
            role: 'system',
            content: 'You are StackSave, a friendly DeFi savings assistant on WhatsApp. Keep responses short, natural, and conversational. Use emojis sparingly.',
          },
          {
            role: 'user',
            content: prompts[intent],
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const generatedResponse = response.choices[0]?.message?.content?.trim();

      if (generatedResponse) {
        console.log('✓ Generated LLM response');
        return generatedResponse;
      }

      return defaultResponses[intent];
    } catch (error) {
      console.error('Error generating LLM response:', error);
      return defaultResponses[intent];
    }
  }
}
