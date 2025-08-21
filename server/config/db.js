const mongoose = require('mongoose');
const { mongoUri } = require('./env');

function connectDb() {
  mongoose.connect(mongoUri, { autoIndex: true })
    .then(() => console.log('Mongo connected'))
    .catch(err => {
      console.error('Mongo error', err);
      process.exit(1);
    });
}

module.exports = { connectDb };