export enum IntentType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  CHECK_BALANCE = 'check_balance',
  HELP = 'help',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  UNKNOWN = 'unknown',
}

export interface UserIntent {
  type: IntentType;
  amount?: number;
  coin?: string;
  confidence: number;
  rawMessage: string;
}

export interface UserData {
  phoneNumber: string;
  walletAddress?: string;
  balance?: string;
  stakedAmount?: string;
}

export interface BotResponse {
  message: string;
  success: boolean;
  data?: any;
}

export interface LLMResponse {
  intent: IntentType;
  amount?: number;
  coin?: string;
  confidence: number;
  explanation?: string;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  amount?: string;
}
