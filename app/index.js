const path = require('path');
const { Telegraf } = require('telegraf');
const { I18n } = require('i18n');

const { User, mongodbId } = require('./db');

const { BOT_TOKEN } = process.env;

if (!BOT_TOKEN) {
  console.log('No token for telegram bot was provided.')
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const i18n = new I18n({
  locales: ['en', 'ru'],
  defaultLocale: 'en',
  extension: '.json',
  directory: path.join(__dirname, 'locales'),
});

// start
bot.start(async (ctx) => {
  const { from } = ctx.message;
  const { id: chatId, language_code } = from;
  const user = await User.findOne({ chatId });
  let userId = user.id;
  if (!user) {
    const newUser = await User.insert({
      chatId,
      isFrozen: false,
      lastScore: 0,
      defectionTime: null,
      locale: 'en',
    });
    userId = newUser.id;
  }
  if (language_code === 'ru') {
    await User.update({ _id: userId }, { $set: { locale: 'ru' } });
  }
  const startMessage = [
    'Welcome!',
    'Please select your language.',
    '🦊',
    'Привет!',
    'Выбери язык.',
  ].join('\n');
  ctx.reply(startMessage);
});

// english
bot.hears('English', async (ctx) => {
  const locale = 'en';
  const chatId = ctx.message.from.id;
  const user = await User.findOne({ chatId });
  if (!user) {
    ctx.reply('dddd');
  }
  await User.update({ chatId }, { $set: { locale } });
  ctx.reply(i18n.__({ phrase: 'selectLocale', locale }));
  if (!user.lastScore) {
    ctx.reply(i18n.__({ phrase: 'howToUse', locale }));
  }
});

// russian
bot.hears('Русский', async (ctx) => {
  const locale = 'ru';
  const chatId = ctx.message.from.id;
  const user = await User.findOne({ chatId });
  if (!user) {
    ctx.reply('dddd');
  }
  await User.update({ chatId }, { $set: { lang: 'ru' } });
  ctx.reply(i18n.__({ phrase: 'selectLocale', locale }));
  if (!user.lastScore) {
    ctx.reply(i18n.__({ phrase: 'howToUse', locale }));
  }
});

bot.command('quit', (ctx) => {
  ctx.telegram.leaveChat(ctx.message.chat.id);
  ctx.leaveChat();
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
