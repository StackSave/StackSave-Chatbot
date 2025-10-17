<<<<<<< HEAD
# StackSave-Chatbot
=======
# StackSave WhatsApp Chatbot

A WhatsApp chatbot for StackSave - a DeFi savings platform built on Base Sepolia that enables users to save, stake, and grow their money through smart contracts, all managed via simple WhatsApp messages.

## Features

- **Natural Language Processing**: Uses external LLMs (OpenAI, Anthropic, or custom) for intelligent intent detection
- **DeFi Operations**: Deposit, withdraw, stake, and unstake funds on Base Sepolia
- **Simple WhatsApp Interface**: Manage your DeFi savings as easily as chatting with a friend
- **Multi-LLM Support**: Compatible with OpenAI, Anthropic Claude, or custom LLM endpoints
- **Automatic Session Management**: Persistent WhatsApp authentication

## Architecture

```
src/
├── config/           # Configuration and environment variables
├── handlers/         # Message handling logic
├── services/
│   ├── llmService.ts    # LLM integration for intent detection
│   └── defiService.ts   # Blockchain/DeFi operations
├── types/            # TypeScript type definitions
└── index.ts          # Main bot entry point
```

## Prerequisites

- Node.js 18+ and npm
- WhatsApp account
- Base Sepolia testnet setup
- LLM API key (OpenAI, Anthropic, or custom endpoint)
- Smart contract deployed on Base Sepolia

## Installation

1. **Clone and navigate to the project:**
   ```bash
   cd chatbot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your credentials:**
   ```env
   # LLM Configuration
   LLM_PROVIDER=openai  # or 'anthropic' or 'custom'
   OPENAI_API_KEY=your_openai_api_key

   # Base Sepolia Configuration
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   PRIVATE_KEY=your_private_key
   STAKING_CONTRACT_ADDRESS=your_contract_address

   # Bot Configuration
   BOT_NAME=StackSave Bot
   ```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### First Time Setup

1. Run the bot:
   ```bash
   npm run dev
   ```

2. A QR code will appear in your terminal

3. Open WhatsApp on your phone and scan the QR code:
   - Go to **Settings** > **Linked Devices** > **Link a Device**
   - Scan the QR code displayed in your terminal

4. Once authenticated, the bot will start listening for messages

## Supported Commands

Users can interact with the bot using natural language. Here are some examples:

### Check Balance
- "What's my balance?"
- "How much do I have?"
- "Check my account"

### Deposit
- "Deposit 100 USDC"
- "I want to save 50 dollars"
- "Add 25 to my account"

### Withdraw
- "Withdraw 50 USDC"
- "Take out 25"
- "I need 30 dollars"

### Stake
- "Stake 100 USDC"
- "Put 50 in staking"
- "I want to stake 75"

### Unstake
- "Unstake 50 USDC"
- "Remove 25 from staking"
- "Stop staking 30"

### Help
- "Help"
- "What can you do?"
- "How does this work?"

## LLM Providers

### OpenAI (Default)
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### Anthropic Claude
```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### Custom LLM Endpoint
```env
LLM_PROVIDER=custom
CUSTOM_LLM_URL=http://localhost:8000/api/chat
```

Your custom endpoint should accept POST requests with:
```json
{
  "system": "system prompt",
  "message": "user message"
}
```

And return:
```json
{
  "response": "LLM response text"
}
```

## Smart Contract Integration

The bot expects your staking contract to have these functions:

```solidity
function deposit() public payable
function withdraw(uint256 amount) public
function stake(uint256 amount) public
function unstake(uint256 amount) public
function balanceOf(address account) public view returns (uint256)
function stakedBalanceOf(address account) public view returns (uint256)
```

Update `src/services/defiService.ts` with your contract's actual ABI.

## Security Considerations

⚠️ **Important Security Notes:**

1. **Private Keys**: Never commit your `.env` file or private keys to version control
2. **User Wallets**: The current demo derives wallets from phone numbers - this is NOT secure for production
3. **Production Recommendations**:
   - Use proper key management (HSM, KMS)
   - Implement user authentication
   - Use account abstraction for better UX
   - Add rate limiting
   - Implement transaction confirmations
   - Add admin controls

## Project Structure

- **config/**: Environment configuration and validation
- **handlers/**: WhatsApp message processing logic
- **services/llmService.ts**: LLM integration for natural language understanding
- **services/defiService.ts**: Blockchain interaction layer
- **types/**: TypeScript interfaces and enums
- **index.ts**: Main bot initialization and event handling

## Troubleshooting

### QR Code doesn't appear
- Make sure no other WhatsApp Web sessions are active
- Delete the `whatsapp-session` folder and try again
- Check your internet connection

### "Authentication failed"
- Clear the session folder: `rm -rf whatsapp-session`
- Restart the bot and scan the QR code again

### LLM errors
- Verify your API key is correct
- Check your API quota/limits
- Ensure the LLM_PROVIDER matches your configured key

### Blockchain errors
- Verify your RPC URL is correct
- Check your private key has the correct format
- Ensure your contract address is deployed on Base Sepolia
- Verify you have testnet ETH for gas fees

## Development

### Adding New Intents

1. Add intent type to `src/types/index.ts`:
   ```typescript
   export enum IntentType {
     // ... existing intents
     NEW_INTENT = 'new_intent',
   }
   ```

2. Update LLM prompt in `src/services/llmService.ts`

3. Add handler in `src/handlers/messageHandler.ts`:
   ```typescript
   case IntentType.NEW_INTENT:
     responseMessage = await this.handleNewIntent(phoneNumber);
     break;
   ```

### Testing

You can test intent detection without blockchain operations by setting mock values in the DeFi service.

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## Support

For issues and questions, please open a GitHub issue.

---

Built with ❤️ for StackSave - Making DeFi saving as easy as chatting
>>>>>>> edc4d18 (Initial import of chatbot project)
