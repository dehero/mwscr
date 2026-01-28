import esc from 'escape-html';
import TelegramBot from 'node-telegram-bot-api';
import type { PostViolationDescriptor } from '../../core/entities/post.js';
import { postViolationDescriptors } from '../../core/entities/post.js';
import type { Resource } from '../../core/entities/resource.js';
import { site } from '../../core/services/site.js';
import { telegram } from '../../core/services/telegram.js';
import { asArray } from '../../core/utils/common-utils.js';
import { drafts } from '../data-managers/posts.js';
import { readResource } from '../data-managers/resources.js';
import { importResourceToStore } from '../data-managers/store-resources.js';
import { users } from '../data-managers/users.js';

let bot: TelegramBot | undefined;

const rejectPhrases = [
  "We're watching you. Scum.",
  'Not now, outlander. Head on.',
  "Let's not make this official, outlander. Move along.",
  "Watch yourself. We'll have no trouble here.",
  'Go. Now.',
  'Own no weakness or fault.',
  'By the Three, my rights and duties.',
  'Justice never sleeps. Almsivi watch over you.',
  'Go on about your business.',
  'Submit to the Three, the Spirits, and Thy Lords.',
  'Three Gods, One True Faith.',
];

const acceptPhrases = ['Praise Vivec!'];

const greetingPhrases = [
  'What works do you have for me, citizen?',
  'Greetings. I am at your service.',
  'How may I help you citizen?',
  'What is it, citizen?',
  'Tidings.',
  'Welcome, citizen. How may I be of assistance?',
  'Move along.',
  'Grrrr.',
  'Yes, citizen?',
  'Citizen.',
];

export async function importTelegramBotUpdates() {
  console.group(`Importing Telegram bot updates...`);

  try {
    const bot = connect();

    const updates = await bot.getUpdates();

    if (updates.length > 0) {
      // Mark all received updates as confirmed
      const maxUpdateId = updates.reduce((max, update) => (update.update_id > max ? update.update_id : max), 0);
      await bot.getUpdates({ offset: maxUpdateId + 1 });

      const messages = updates
        .map((update) => update.message)
        .filter((message): message is TelegramBot.Message => typeof message !== 'undefined');

      for (const message of messages) {
        await processMessage(message);
      }
    } else {
      console.info('No updates found.');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error importing Telegram bot updates: ${error.message}`);
    }
  }

  console.groupEnd();
}

function connect() {
  if (!bot) {
    const { TELEGRAM_BOT_ACCESS_TOKEN } = process.env;
    if (!TELEGRAM_BOT_ACCESS_TOKEN) {
      throw new Error('Need Telegram bot access token');
    }

    bot = new TelegramBot(TELEGRAM_BOT_ACCESS_TOKEN);
  }

  return bot;
}

async function processMessage(message: TelegramBot.Message) {
  const bot = connect();
  const replies: string[] = [];

  if (!message.from) {
    console.error(`Message ${message.message_id} has no sender.`);
    return;
  }

  let author;

  try {
    [author] = await users.mergeOrAddItem({
      profiles: [
        {
          service: 'tg',
          id: message.from.id.toString(),
          username: message.from.username,
          type: message.from.is_bot ? 'bot' : undefined,
          name: [message.from.first_name, message.from.last_name].filter(Boolean).join(' ') || undefined,
          botChatId: message.chat.id,
        },
      ],
    });

    await users.save();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Cannot merge Telegram user ${message.from.username}: ${error.message}`);
    }
    return;
  }

  if (message.photo) {
    replies.push(
      `${getRandomRejectPhrase()}\n<blockquote>I cannot accept compressed images. Attach your work as PNG or ZIP file.</blockquote>`,
    );
  } else if (message.video) {
    replies.push(
      `${getRandomRejectPhrase()}\n<blockquote>I cannot accept compressed videos. Attach your work as MP4, AVI or ZIP file.</blockquote>`,
    );
  } else if (message.document) {
    try {
      let adminUrl;
      const [, admin] = (await users.findEntry((user) => Boolean(user.admin))) ?? [];
      const tgUsername = admin?.profiles?.find((profile) => profile.service === 'tg')?.username;
      if (tgUsername) {
        adminUrl = telegram.getUserProfileUrl(tgUsername);
      }

      const url = await bot.getFileLink(message.document.file_id);
      const [data, mimeType, filename] = await readResource(url);
      const resource: Resource = [data, message.document.mime_type || mimeType, message.document.file_name || filename];

      const postEntries = await importResourceToStore(
        resource,
        { title: message.caption, author },
        new Date(message.date * 1000),
      );

      for (const [id, post] of postEntries) {
        if (post.violation) {
          for (const violation of asArray(post.violation)) {
            const descriptor: PostViolationDescriptor = postViolationDescriptors[violation];
            replies.push(
              `${getRandomRejectPhrase()}\n<blockquote><b>${esc(asArray(post.content).join(', '))}</b>\n${
                descriptor.topicId
                  ? // TODO: don't use hardcoded site domain
                    `<a href="${encodeURI(`https://mwscr.dehero.site/help/${descriptor.topicId}/`)}">${
                      descriptor.title
                    }</a>`
                  : descriptor.title
              }.${descriptor.solution ? ` ${descriptor.solution}` : ''}</blockquote>`,
            );
          }
        } else {
          await drafts.addItem(post, id);
          await drafts.save();

          console.info(`Created draft "${id}" from "${url}".`);

          const postUrl = site.getPostUrl(id, 'drafts');

          replies.push(
            `${getRandomAcceptPhrase()} I've accepted your work with ID\n<pre>${id}</pre>\nWait a couple of minutes for it to appear <a href="${encodeURI(
              postUrl,
            )}">on the site</a>.${
              adminUrl ? ` If it does not, please contact <a href="${encodeURI(adminUrl)}">administrator</a>.` : ''
            }`,
          );
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        replies.push(`${getRandomRejectPhrase()}\n<pre>${esc(error.message)}</pre>`);
      } else {
        replies.push(`${getRandomRejectPhrase()}\n<pre>Unexpected error: ${esc(String(error))}</pre>`);
      }
    }
  } else {
    replies.push(getRandomGreetingPhrase());
  }

  for (const reply of replies) {
    try {
      await bot.sendMessage(message.chat.id, reply, {
        parse_mode: 'HTML',
        reply_to_message_id: message.message_id,
      });
      console.info(`Replied to ${author} message ${message.message_id} with "${reply}".`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error replying message ${message.message_id}: ${error.message}`);
      }
    }
  }
}

function getRandomAcceptPhrase() {
  return acceptPhrases[Math.floor(Math.random() * acceptPhrases.length)] ?? 'Praise Vivec!';
}

function getRandomRejectPhrase() {
  return rejectPhrases[Math.floor(Math.random() * rejectPhrases.length)] ?? "We're watching you. Scum.";
}

function getRandomGreetingPhrase() {
  return greetingPhrases[Math.floor(Math.random() * greetingPhrases.length)] ?? 'What is it, citizen?';
}
