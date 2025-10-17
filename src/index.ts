import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { MessageHandler } from './handlers/messageHandler';
import { config } from './config';

class StackSaveBot {
  private client: Client;
  private messageHandler: MessageHandler;

  constructor() {
    // Initialize WhatsApp client with session storage
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: config.bot.sessionPath,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
    });

    this.messageHandler = new MessageHandler();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // QR Code generation
    this.client.on('qr', (qr) => {
      console.log('\n=================================');
      console.log('Scan this QR code with WhatsApp:');
      console.log('=================================\n');
      qrcode.generate(qr, { small: true });
      console.log('\n=================================');
    });

    // Authentication success
    this.client.on('authenticated', () => {
      console.log('✓ Authentication successful!');
    });

    // Authentication failure
    this.client.on('auth_failure', (msg) => {
      console.error('✗ Authentication failed:', msg);
    });

    // Client ready
    this.client.on('ready', () => {
      console.log('\n=================================');
      console.log(`✓ ${config.bot.name} is ready!`);
      console.log('=================================\n');
      console.log('Bot is now listening for messages...');
    });

    // Message received
    this.client.on('message', async (message) => {
      // Ignore group messages
      const chat = await message.getChat();
      if (chat.isGroup) {
        return;
      }

      // Ignore messages from self
      if (message.fromMe) {
        return;
      }

      // Handle the message
      await this.messageHandler.handleMessage(message);
    });

    // Disconnection
    this.client.on('disconnected', (reason) => {
      console.log('✗ Client was disconnected:', reason);
      console.log('Attempting to reconnect...');
    });

    // Error handling
    this.client.on('error', (error) => {
      console.error('✗ Client error:', error);
    });
  }

  async start(): Promise<void> {
    try {
      console.log('\n=================================');
      console.log(`Starting ${config.bot.name}...`);
      console.log('=================================\n');

      await this.client.initialize();
    } catch (error) {
      console.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    console.log('\nShutting down bot...');
    await this.client.destroy();
    console.log('Bot stopped.');
  }
}

// Initialize and start the bot
const bot = new StackSaveBot();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT signal');
  await bot.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM signal');
  await bot.stop();
  process.exit(0);
});

// Start the bot
bot.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
