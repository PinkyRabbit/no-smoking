const { Telegraf } = require('telegraf');

const { User, mongodbId } = require('./db');

const { BOT_TOKEN } = process.env;

if (!BOT_TOKEN) {
  console.log('No token for telegram bot was provided.')
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN)

bot.start((ctx) => ctx.reply('Welcome'))

bot.command('quit', (ctx) => {
  ctx.telegram.leaveChat(ctx.message.chat.id);
  ctx.leaveChat();
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
