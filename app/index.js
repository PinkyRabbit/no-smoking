const { Telegraf } = require('telegraf');

const { User, mongodbId } = require('./db');
const { i18n, acceptedLocalesList } = require('./i18n');

const { BOT_TOKEN } = process.env;

if (!BOT_TOKEN) {
  console.log('No token for telegram bot was provided.')
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// start
bot.start(async (ctx) => {
  const { from } = ctx.message;
  const { id: chatId, language_code } = from;
  let locale =
    language_code && acceptedLocalesList.includes(language_code)
    ? language_code
    : 'en';
  const user = await User.findOne({ chatId });
  if (!user) {
    await User.insert({
      chatId,
      isFrozen: false,
      lastScore: 0,
      defectionTime: null,
      locale,
    });
  }
  ctx.reply(i18n('greetings', locale));
});

// locale
async function switchLocale(ctx, locale) {
  const chatId = ctx.message.from.id;
  const user = await User.findOne({ chatId });
  if (!user) {
    i18n('selectLocale', locale);
    ctx.reply('error_user_not_found');
  }
  await User.update({ chatId }, { $set: { locale } });
  ctx.reply(i18n('selectLocale', locale));
}

// english
bot.command('en', async (ctx) => {
  await switchLocale(ctx, 'en');
});

// russian
bot.command('ru', async (ctx) => {
  await switchLocale(ctx, 'ru');
});

bot.command('quit', (ctx) => {
  ctx.telegram.leaveChat(ctx.message.chat.id);
  ctx.leaveChat();
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
