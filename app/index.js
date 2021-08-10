const { Telegraf, Markup: TgHelpers } = require('telegraf');
const moment = require('moment');

const { User, mongodbId } = require('./db');
const { i18n, acceptedLocalesList, buttonsText } = require('./i18n');

const { BOT_TOKEN } = process.env;

if (!BOT_TOKEN) {
  console.log('No token for telegram bot was provided.')
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

function k(locale) {
  const { button, keyboard } = TgHelpers;
  const iSmokedText = i18n('i_smoked', locale);
  const btn = button.callback(iSmokedText, 'ok');
  return keyboard([btn]).resize(false).oneTime(false);
}

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

// locale
async function switchLocale(ctx, locale) {
  const chatId = ctx.message.from.id;
  const user = await User.findOne({ chatId });
  if (!user) {
    i18n('selectLocale', locale);
    ctx.reply('error_user_not_found');
  }
  await User.update({ chatId }, { $set: { locale } });
  ctx.reply(i18n('selectLocale', locale), k(locale));
}

// english
bot.command('en', async (ctx) => {
  await switchLocale(ctx, 'en');
});

// russian
bot.command('ru', async (ctx) => {
  await switchLocale(ctx, 'ru');
});

// i-smoked
function average(numArray) {
  const avg = numArray.reduce((a, b) => (a + b)) / numArray.length;
  return Math.ceil(avg);
}
function calculateDefectionTime(date, defectionTime, lastTimes) {
  if (!defectionTime) {
    const timesLeft = 10;
    lastTimes = new Array();
    return { message: 'time_accounted', shouldUpdateTime: true, timesLeft };
  }
  const from = moment(defectionTime);
  const to = moment(date);
  const diff = to.diff(from, 'minutes');
  if (diff < 10) {
    return { message: 'low_time' };
  }
  if (lastTimes.length < 10 && diff > 180) {
    return { message: 'high_time' };
  }
  if (lastTimes.length < 10) {
    lastTimes.push(diff);
    const timesLeft = 10 - lastTimes.length;
    return { message: 'time_accounted', timesLeft };
  }
  const currentAverage = average(lastTimes);
  if (diff - currentAverage > 120) {
    return { message: 'high_time', minsToNext: currentAverage };
  }
  lastTimes.push(diff);
  if (lastTimes.length > 20) {
    lastTimes.shift();
  }
  return { message: 'time_accounted', minsToNext: average(lastTimes) };
}
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
    const hours = Math.floor(minsToNext / 60);
    const mins = minsToNext % 60;
    response += i18n('next', locale, { hours, mins });
  }
 
  return ctx.reply(response);
}
bot.command('ok', iSmoked);
buttonsText.forEach((command) => {
  bot.hears(command, iSmoked);
})

bot.command('quit', (ctx) => {
  ctx.telegram.leaveChat(ctx.message.chat.id);
  ctx.leaveChat();
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
