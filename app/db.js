const monk = require('monk');

const { MONGO_URL, MONGO_INITDB_ROOT_USERNAME, MONGO_INITDB_ROOT_PASSWORD } = process.env;

let url;
if (MONGO_INITDB_ROOT_USERNAME && MONGO_INITDB_ROOT_PASSWORD) {
  url = `${MONGO_INITDB_ROOT_USERNAME}:${MONGO_INITDB_ROOT_PASSWORD}@localhost:27017/development-only`;  
}
if (!url && MONGO_URL) {
  url = MONGO_URL;
}
if (!url) {
  console.log('No credentials for mongodb connection.');
  process.exit(1);
}

monk(url).catch((err) => {
  console.log(err);
  process.exit(1);
});

const options = {
  loggerLevel: 'error',
  useNewUrlParser: true,
};

module.exports = {
  mongodbId: (_id) => monk.id(_id),
  User: monk(url, options).get('users'),
};
