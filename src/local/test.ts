import 'dotenv/config';
// import { createResourcePreview } from './data-managers/resources.js';
import { telegramManager } from './posting-service-managers/telegram-manager.js';

// await createResourcePreview('store:/videos/2017-01-28-1-meditative-evening-in-ahemmusa-camp.mp4');

await telegramManager.publishPostEntry([
  'test',
  { content: 'store:/videos/2017-02-12-2-travel-from-seyda-neen-to-balmora.avi', title: 'test', type: 'clip' },
]);

// Telegram waits for too long to disconnect, exit process manually
process.exit();
