const monk = require('monk');

const { MONGO_URL } = process.env;

if (!MONGO_URL) {
  console.log('No credentials for mongodb connection.');
  process.exit(1);
}

monk(MONGO_URL).catch((err) => {
  console.log(err);
  process.exit(1);
});

const options = {
  loggerLevel: 'error',
  useNewUrlParser: true,
};

module.exports = {
  mongodbId: (_id) => monk.id(_id),
  User: monk(MONGO_URL, options).get('users'),
};
