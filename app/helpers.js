const moment = require('moment');
const { Markup: TgHelpers } = require('telegraf');

const { i18n } = require('./i18n');

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
    i18n('selectLocale', locale);
    ctx.reply('error_user_not_found');
  }
  await User.update({ chatId }, { $set: { locale } });
  ctx.reply(i18n('selectLocale', locale), k(locale));
}

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

module.exports = { k, switchLocale, calculateDefectionTime };
