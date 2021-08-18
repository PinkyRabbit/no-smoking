const moment = require('moment');
const { Markup: TgHelpers } = require('telegraf');

const { User } = require('./db');
const { i18n } = require('./i18n');

const { NODE_ENV } = process.env;
const minsOrSec = NODE_ENV === 'production' ? 'minutes': 'seconds';
const lengthToDiff = NODE_ENV === 'production' ? 15: 2;

async function getUser(ctx) {
  const { id: chatId, language_code } = ctx.message.from;
  const user = await User.findOne({ chatId });
  if (!user) {
    const locale = language_code || 'en';
    return ctx.reply(i18n('error_user_not_found', locale));
  }
  return user;
}

// keyboard
function k(locale) {
  const { button, keyboard } = TgHelpers;
  const iSmokedText = i18n('i_smoked', locale);
  const btn = button.callback(iSmokedText, 'ok');
  return keyboard([btn]).resize(false).oneTime(false);
}

// locale
async function switchLocale(ctx, locale) {
  const chatId = ctx.message.from.id;
  const user = await User.findOne({ chatId });
  if (!user) {
    i18n('select_locale', locale);
    ctx.reply('error_user_not_found');
  }
  await User.update({ chatId }, { $set: { locale } });
  ctx.reply(i18n('select_locale', locale), k(locale));
}

function average(numArray) {
  const avg = numArray.reduce((a, b) => (a + b)) / numArray.length;
  return Math.ceil(avg);
}

function calculateDefectionTime(date, defectionTime, lastTimes) {
  let message = 'time_accounted_but_more_intervals_needed';
  if (!defectionTime) {
    return { message };
  }
  const from = moment(defectionTime);
  const to = moment(date);
  const diff = to.diff(from, minsOrSec);

  if (lastTimes.length < lengthToDiff) {
    const outOfMinimumTime = diff < 10;
    const outOfMaximumTime = diff > 180;
    if (!outOfMinimumTime && !outOfMaximumTime) {
      lastTimes.push(diff);
    }
    return { message };
  }

  message = 'time_accounted';

  const currentAverage = average(lastTimes);
  let minsToNext = currentAverage;

  const outOfMinimumTime = diff < 10;
  const outOfMaximumTime = diff - currentAverage > 120;

  if (!outOfMinimumTime && !outOfMaximumTime) {
    lastTimes.push(diff);
    if (lastTimes.length > 20) {
      lastTimes.shift();
    }
    minsToNext = average(lastTimes);
  }
  return { message, minsToNext };
}

module.exports = { getUser, k, switchLocale, calculateDefectionTime };
