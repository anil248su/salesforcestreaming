const express  = require('express');
const next     = require('next');
const path     = require('path');
const url      = require('url');
const cluster  = require('cluster');
const numCPUs  = require('os').cpus().length;
const redis    = require('redis');
const jsforce = require('jsforce');
const conn = new jsforce.Connection({
    // you can change loginUrl to connect to sandbox or prerelease env.
    loginUrl : process.env.SALESFORCE_LOGIN_URL
  });
conn.login(process.env.SALESFORCE_USERNAME, process.env.SALESFORCE_PASSWORD);
console.error(`USERNAME ${process.env.SALESFORCE_USERNAME}`);

const redisHeartbeat = require('./lib/redis-heartbeat');

require('dotenv').config()
const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL;
if (REDIS_URL == null) {
  throw new Error('Requires REDIS_URL env var.');
}
const heartbeatSecs = 5;

// Multi-process to utilize all CPU cores.
if (!dev && cluster.isMaster) {
  // In production, heartbeat in the master process.
  redisHeartbeat(REDIS_URL, heartbeatSecs);
  
  console.log(`Node cluster master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(`Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`);
  });

} else {
  const nextApp = next({ dir: '.', dev });
  const nextHandler = nextApp.getRequestHandler();

  console.log('-----> Initializing server');

  nextApp.prepare()
    .then(() => {
      const server = express();

      if (dev) {
        // In dev, heartbeat in the single process.
        redisHeartbeat(REDIS_URL, heartbeatSecs);
      } else {
        // Enforce SSL & HSTS in production
        server.use(function(req, res, next) {
          var proto = req.headers["x-forwarded-proto"];
          if (proto === "https") {
            res.set({
              'Strict-Transport-Security': 'max-age=31557600' // one-year
            });
            return next();
          }
          res.redirect("https://" + req.headers.host + req.url);
        });
      }

      // Setup Redis datastore to receive messages
      const redisStream = redis.createClient(REDIS_URL);
      redisStream.on("error", function (err) {
        console.error(`redis stream error: ${err.stack}`);
        process.exit(1);
      });
      redisStream.subscribe('heartbeat', 'status', 'salesforce');




      // Setup Redis datastore to perform queries (separate from subscriber)
      const redisQuery = redis.createClient(REDIS_URL);
      redisQuery.on("error", function (err) {
        console.error(`redis query error: ${err.stack}`);
        process.exit(1);
      });
	  let url1 = process.env.SALESFORCE_LOGIN_URL+'/services/apexrest/LineItemCallback';	
      const hitCallback = (message) => {
        console.error(`HITTING CALLBACK`);
        //const _request = {
        //url: process.env.SALESFORCE_LOGIN_URL+'/services/apexrest/LineItemCallback',
        //method: 'POST',
        //body: JSON.stringify(message),
        //headers : {
        //"Content-Type" : "application/json"
        //   }
        // };
		console.error('test'+url1);
		conn.apex.post("/LineItemCallback/", message, function(err, res) {
  			if (err) { return console.error(err); }
 			 console.log("response: ", res);
  			// the response object structure depends on the definition of apex class
		});
         //conn.request(_request, function(err, resp){
           //console.error(resp);
         //});
         console.error('end of call back');
      }

      const processLineItems = (lineItems, configurationId) => {
        console.error(`CONFIG ID ${configurationId}`);
        console.error(`LINE ITEMS ${lineItems}`);
        hitCallback(lineItems);
      }

      const consolidateMessagesAndProcess = (transactionId) => {
        console.error('CONSOLIDATING MESSAGES');
        var lineItems = [];
        redisQuery.lrange(transactionId, 0, -1, function(err, res){
          console.error('in transaction');
          var configurationId;
          res.forEach(message => {
            const payload = JSON.parse(message);
            payload.lis.forEach(li => {
              lineItems.push(li);
            });
            configurationId = payload.cId;
          });
          console.error(`Line Items ${lineItems.length}`);
          processLineItems(lineItems, configurationId);
          redisQuery.del(transactionId, function(err, res){
          });
        });
      }

      var pendingTransactions = {};

      const messageCallback = (message, payloadHash, transactionId) => {
        pendingTransactions[transactionId] = true; 
        redisQuery.rpush(payloadHash.tId, message, function(err, res){
          redisQuery.llen(payloadHash.tId, function(err,res){
            const oldHashLength = res;
            setTimeout(() => {
              redisQuery.llen(payloadHash.tId, function(err,res2) {
                if (oldHashLength === res2 && pendingTransactions[transactionId]) {
                  delete pendingTransactions[transactionId];
                  console.error(`PROCESSING ${res2} MESSAGES`);
                  consolidateMessagesAndProcess(transactionId);
                }
              });
            }, 400);
          });
        });
      };

      
      redisStream.on("message", function (channel, message) {
          //messages come from "heartbeat" channel too
          if (channel === 'salesforce') {
            const payloadHash = JSON.parse(message);
            console.error(`TRANSACTION ID ${payloadHash.tId}`);
            messageCallback(message, payloadHash, payloadHash.tId);
          }
        });
      // Static files
      // https://github.com/zeit/next.js/tree/4.2.3#user-content-static-file-serving-eg-images
      server.use('/static', express.static(path.join(__dirname, 'static'), {
        maxAge: dev ? '0' : '365d'
      }));
    
      // Server-Sent Events (SSE) handler to push messages to browser clients
      // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
      server.get('/stream/messages', (req, res, next) => {
        req.socket.setTimeout(0);
        const idPrefix = req.headers['x-request-id'] || 'message';
        let messageCount = 0;

        // Send SSE headers
        res.writeHead(200, {
          'Cache-Control': 'no-cache',
          'Content-Type': 'text/event-stream',
          'Connection': 'keep-alive'
        });
        res.write('\n');

        // Send all status info buffered in Redis
        redisQuery.get('status-recent', (err, response) => {
          if (err) throw err;
          messageCount++;
          res.write(`event: status\n`);
          res.write(`id: ${idPrefix}-${messageCount}\n`);
          res.write(`data: ${response}\n`);
          res.write('\n');
        });
 
        // Send all recent messages buffered in Redis
        //CODE REMOVED see serverold.js
        redisQuery.lrange('salesforce-recent', 0, -1, (err, response) => {
          if (err) throw err;
          response.reverse();
          response.forEach( message => {
            messageCount++;
            res.write(`event: salesforce\n`);
            res.write(`id: ${idPrefix}-${messageCount}\n`);
            res.write(`data: ${message}\n`);
            res.write('\n');
          })
        });

        // Send each new message as it arrives
        // redisStream.on("message", function (channel, message) {
        //   // console.error(`\nTESTING REDIS STREAM\n`);
        //   messageCount++;
        //   res.write(`event: ${channel}\n`);
        //   res.write(`id: ${idPrefix}-${messageCount}\n`);
        //   res.write(`data: ${message}\n`);
        //   res.write('\n');
        // });

        // Send a byte of data every 50-seconds to keep 
        // the Heroku router connection alive
        const heartbeatID = setInterval(() => res.write('\n'), 50000);
        req.socket.on("close", () => clearInterval(heartbeatID));
      });

      // Default catch-all renders Next app
      server.get('*', (req, res) => {
        // res.set({
        //   'Cache-Control': 'public, max-age=3600'
        // });
        const parsedUrl = url.parse(req.url, true);
        nextHandler(req, res, parsedUrl);
      });

      server.listen(port, (err) => {
        if (err) throw err;
        console.log(`Listening on http://localhost:${port}`);
      });
    })
    .catch( err => {
      console.error(err);
      process.exit(1);
    });
}
