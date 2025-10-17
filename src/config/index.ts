import dotenv from 'dotenv';

dotenv.config();

export const config = {
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai',
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiBaseUrl: process.env.OPENAI_BASE_URL,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    customLlmUrl: process.env.CUSTOM_LLM_URL,
  },
  blockchain: {
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    privateKey: process.env.PRIVATE_KEY,
    stakingContractAddress: process.env.STAKING_CONTRACT_ADDRESS,
  },
  bot: {
    name: process.env.BOT_NAME || 'StackSave Bot',
    adminPhoneNumbers: process.env.ADMIN_PHONE_NUMBERS?.split(',') || [],
    sessionPath: process.env.SESSION_PATH || './whatsapp-session',
  },
};

// Validate required environment variables
const requiredVars = ['PRIVATE_KEY', 'STAKING_CONTRACT_ADDRESS'];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.warn(`Warning: ${varName} is not set in environment variables`);
  }
}
