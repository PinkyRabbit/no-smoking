const monk = require('monk');

const { MONGO_URL, MONGO_SRV } = process.env;

if (!MONGO_URL) {
  console.log('No credentials for mongodb connection.');
  process.exit(1);
}

console.log(`MONGO_URL = ${MONGO_URL}`);
console.log(`MONGO_SRV = ${MONGO_SRV}`);
const url =
  MONGO_SRV === 'ok'
    ? `mongodb+srv://${MONGO_URL}?retryWrites=true&w=majority`
    : MONGO_URL;
console.log(`connection url = ${url}`);

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
