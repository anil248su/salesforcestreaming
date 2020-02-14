const Episode7 = require('episode-7');
const redis = require('redis');
const {promisify} = require('util');

const salesforceStreams = require('./lib/salesforce-streams');

console.log('-----> Initializing worker');

require('dotenv').config()
const dev = process.env.NODE_ENV !== 'production';

// Setup Redis datastore to publish incoming messages from Salesforce
const REDIS_URL = process.env.REDIS_URL;
if (REDIS_URL == null) {
  throw new Error('Requires REDIS_URL env var.');
}
const redisClient  = redis.createClient(REDIS_URL);
const publishAsync = promisify(redisClient.publish).bind(redisClient);
redisClient.on("error", function (err) {
  logger(`redis stream error: ${err.stack}`);
  process.exit(1);
});

// For each incoming message:
const messageCallback = (message, salesforceApi) => {
  const redisMulti = redisClient.multi();
  const execMultiAsync = promisify(redisMulti.exec).bind(redisMulti);
  console.error(`MESSAGE PAYLOAD ${message["payload"]}`);
  redisMulti.publish('salesforce', message["payload"]);
  redisMulti.lpush('salesforce-recent', message["payload"]);
  redisMulti.ltrim('salesforce-recent', 0, 300);
  return execMultiAsync();
};

// Subscribe to Salesforce Streaming API topics (OBSERVE_SALESFORCE_TOPIC_NAMES)
Episode7.run(salesforceStreams, process.env, messageCallback)
  .catch( err => {
    console.error(err);
    process.exit(1);
  });
