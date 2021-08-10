const { initDatabase } = require('./db');
const { initAgenda } = require('./agenda');
const { runBot } = require('./bot');

initDatabase()
  .then(initAgenda)
  .then(runBot)
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
