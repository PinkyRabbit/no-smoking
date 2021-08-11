const monk = require('monk');

const { MONGO_URL } = process.env;

if (!MONGO_URL) {
  console.log('No credentials for mongodb connection.');
  process.exit(1);
}

function initDatabase() {
  return new Promise((resolve, reject) => {
    monk(MONGO_URL)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  })
}

const options = {
  loggerLevel: 'error',
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

module.exports = {
  initDatabase,
  mongodbId: (_id) => monk.id(_id),
  User: monk(MONGO_URL, options).get('users'),
};
