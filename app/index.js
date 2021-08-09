const { Telegraf } = require('telegraf');

const { User, mongodbId } = require('./db');
const { messageFor } = require('./messages');

const { BOT_TOKEN } = process.env;

if (!BOT_TOKEN) {
  console.log('No token for telegram bot was provided.')
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
  const chatId = ctx.message.chat.id;
  const user = await User.findOne({ chatId });
  if (!user) {
    await User.insert({
      chatId,
      isFrozen: false,
      lastScore: 0,
      defectionTime: null,
      lang: 'en',
    });
  }
  ctx.reply(messageFor.start);
});

bot.command('quit', (ctx) => {
  ctx.telegram.leaveChat(ctx.message.chat.id);
  ctx.leaveChat();
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
