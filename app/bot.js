const { Telegraf, Markup } = require('telegraf');

const { User } = require('./db');
const { i18n, acceptedLocalesList, buttonsText } = require('./i18n');
const { getUser, k, switchLocale, calculateDefectionTime } = require('./helpers');
const { agenda } = require('./agenda');

const { BOT_TOKEN, NODE_ENV } = process.env;
const minsOrSec = NODE_ENV === 'production' ? 'minutes': 'seconds';

console.log(`NODE_ENV = ${NODE_ENV}`);
console.log(`BOT_TOKEN = ${BOT_TOKEN}`);

function runBot() {
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
        lastTimes: [],
        defectionTime: null,
        locale,
      });
    }
    ctx.reply(i18n('greetings', locale), k(locale));
  });

  // english
  bot.command('en', async (ctx) => {
    await switchLocale(ctx, 'en');
  });

  // russian
  bot.command('ru', async (ctx) => {
    await switchLocale(ctx, 'ru');
  });

  // i-smoked
  async function iSmoked(ctx) {
    const user = await getUser(ctx);
    const date = new Date();
    const { _id, chatId, defectionTime, lastTimes, locale } = user;
    const {
      message,
      minsToNext,
    } = calculateDefectionTime(date, defectionTime, lastTimes);

    const $set = { defectionTime: date, lastTimes };
    await User.update({ _id }, { $set });

    let response = i18n(message, locale);
    if (minsToNext) {
      const timer = `in ${minsToNext} ${minsOrSec}`;
      await agenda.cancel({ name: 'time_to_smoke', 'data.chatId': chatId });
      await agenda.schedule(timer, 'time_to_smoke', { chatId, locale });
      const hours = Math.floor(minsToNext / 60);
      const mins = minsToNext % 60;
      let nextTimeText = i18n('mins', locale, { mins });
      if (hours) {
        nextTimeText = i18n('hours', locale, { hours }) + nextTimeText;
      }
      response += i18n('next', locale, { nextTimeText });
    }
  
    return response;
  }
  buttonsText.forEach((command) => {
    bot.hears(command, (ctx) => {
      iSmoked(ctx).then((response) => ctx.reply(response));
    });
  })
  bot.command('smoking', (ctx) => {
    iSmoked(ctx).then((response) => ctx.reply(response, Markup.removeKeyboard()));
  });

  bot.command('skip', async (ctx) => {
    const { locale, chatId } = await getUser(ctx);
    await agenda.cancel({ name: 'time_to_smoke', 'data.chatId': chatId });
    return ctx.reply(i18n('dont_disturb', locale));
  });

  bot.command('faq', async (ctx) => {
    const { locale } = await getUser(ctx);
    return ctx.replyWithMarkdown(i18n('faq', locale));
  });

  bot.command('quit', async (ctx) => {
    const { _id } = await getUser(ctx);
    const $set = { defectionTime: null, lastTimes: [] };
    await User.update({ _id }, { $set });
    ctx.telegram.leaveChat(ctx.message.chat.id);
    ctx.leaveChat();
  });

  bot.launch();
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return Promise.resolve(bot);
}

module.exports = { runBot };
