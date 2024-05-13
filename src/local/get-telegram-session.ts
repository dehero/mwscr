import 'dotenv/config';
import { telegramManager } from './posting-service-managers/telegram-manager.js';

const { tg } = await telegramManager.connect();

console.info(tg.session.save());

// Telegram waits for too long to disconnect, exit process manually
process.exit();
