const Agenda = require('agenda');

const { i18n } = require('./i18n');

const { MONGO_URL } = process.env;

if (!MONGO_URL) {
  console.log('No credentials for Agenda connection.');
  process.exit(1);
}
const address = NODE_ENV !== 'production' ? MONGO_URL : `mongodb+srv://${MONGO_URL}?retryWrites=true&w=majority`;

const agenda = new Agenda({
  db: {
    address,
    collection: 'agenda-collection',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
});

function initAgenda({ telegram }) {
  agenda.define('time_to_smoke',
    {},
    async (job) => {
      const { chatId, locale } = job.attrs.data;
      const message = i18n('time_to_smoke', locale);
      telegram.sendMessage(chatId, message);
    }
  );

  return agenda.start();
}

module.exports = { agenda, initAgenda };
