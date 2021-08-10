const Agenda = require("agenda");

const { MONGO_URL } = process.env;

if (!MONGO_URL) {
  console.log('No credentials for Agenda connection.');
  process.exit(1);
}

const agenda = new Agenda({ db: { address: MONGO_URL, collection: 'agenda-collection' } });

function initAgenda() {
  return agenda.start();
}

module.exports = { initAgenda };
