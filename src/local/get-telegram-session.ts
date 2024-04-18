import 'dotenv/config';
import { connect } from './services/telegram.js';

const { tg } = await connect();

console.info(tg.session.save());

// Telegram waits for too long to disconnect, exit process manually
process.exit();
