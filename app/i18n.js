const path = require('path');
const { I18n } = require('i18n');

const acceptedLocalesList = ['en', 'ru'];

const i18nInstance = new I18n({
  locales: acceptedLocalesList,
  defaultLocale: 'en',
  extension: '.json',
  directory: path.join(__dirname, 'locales'),
});

function i18n(phrase, locale = 'en') {
  if (!phrase) {
    throw new Error('You forgot to set phrase value for i18n helper function!');
  }
  return i18nInstance.__({ phrase, locale });
}

module.exports = { i18n, acceptedLocalesList };
