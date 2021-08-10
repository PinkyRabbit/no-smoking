const { Telegraf } = require('telegraf');

const { User } = require('./db');
const { i18n, acceptedLocalesList, buttonsText } = require('./i18n');
const { k, switchLocale, calculateDefectionTime } = require('./helpers');
const { agenda } = require('./agenda');

const { BOT_TOKEN, NODE_ENV } = process.env;
const minsOrSec = NODE_ENV === 'production' ? 'minutes': 'seconds';

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
        isFrozen: false,
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
    const chatId = ctx.message.from.id;
    const user = await User.findOne({ chatId });
    if (!user) {
      return ctx.reply('error_user_not_found');
    }
    const date = new Date();
    const { _id, defectionTime, lastTimes, locale } = user;
    const {
      message,
      timesLeft,
      minsToNext,
    } = calculateDefectionTime(date, defectionTime, lastTimes);

    const $set = { defectionTime: date, lastTimes };
    await User.update({ _id }, { $set });

    let response = i18n(message, locale, { timesLeft });
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
  
    return ctx.reply(response);
  }
  bot.command('ok', iSmoked);
  buttonsText.forEach((command) => {
    bot.hears(command, iSmoked);
  })

  bot.command('skip', async (ctx) => {
    const chatId = ctx.message.from.id;
    await agenda.cancel({ name: 'time_to_smoke', 'data.chatId': chatId });
    return ctx.reply('dont_disturb');
  });

  bot.command('quit', (ctx) => {
    ctx.telegram.leaveChat(ctx.message.chat.id);
    ctx.leaveChat();
  });

  bot.launch();
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return Promise.resolve(bot);
}

module.exports = { runBot };
