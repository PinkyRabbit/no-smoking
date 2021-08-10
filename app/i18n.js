const path = require('path');
const { I18n } = require('i18n');

const acceptedLocalesList = ['en', 'ru'];

const i18nInstance = new I18n({
  locales: acceptedLocalesList,
  defaultLocale: 'en',
  extension: '.json',
  updateFiles: false,
  syncFiles: false,
  directory: path.join(__dirname, 'locales'),
});

function i18n(phrase, locale = 'en', args = {}) {
  if (!phrase) {
    throw new Error('You forgot to set phrase value for i18n helper function!');
  }
  return i18nInstance.__({ phrase, locale }, args);
}

const buttonsText = acceptedLocalesList.map((locale) => {
  return i18nInstance.__({ phrase: 'i_smoked', locale });
});
buttonsText.push('ok');

module.exports = { i18n, acceptedLocalesList, buttonsText };
