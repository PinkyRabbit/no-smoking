const { initDatabase } = require('./db');
const { initAgenda } = require('./agenda');
const { runBot } = require('./bot');

initDatabase()
  .then(runBot)
  .then(initAgenda)
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
