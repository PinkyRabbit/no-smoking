const monk = require('monk');

const { MONGO_URL, MONGO_SRV } = process.env;

if (!MONGO_URL) {
  console.log('No credentials for mongodb connection.');
  process.exit(1);
}
let url = MONGO_URL;
if (`${MONGO_SRV}` === 'ok') {
  url = `mongodb+srv://${MONGO_URL}?retryWrites=true&w=majority`;
}

function initDatabase() {
  return new Promise((resolve, reject) => {
    monk(url)
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
  User: monk(url, options).get('users'),
};
