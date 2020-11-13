/*
*server related tasks
*/

// dependencies
const http = require('http');
const url = require('url');
const https = require('https');
const stringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const path = require('path');
const config = require('./config');
const handlers = require('./handlers');
const helpers = require('./helpers');

// instanciate server module object
const server = {}

/*create a http server instance*/
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res)
})

/*create a https server instance*/
server.option = {
  'key': fs.readFileSync(path.join(__dirname, '/../httpsCert/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname, '/../httpsCert/cert.pem'))
}

/*create a https server instance*/
server.httpsServer = https.createServer(server.option, (req, res) => {
  server.unifiedServer(req, res)
})

/**create an universal hnadler */
server.unifiedServer = function universalHandler(req, res) {

  /*pass request url to get url object */
  const parsedUrl = url.parse(req.url, true);

  /*get pathname*/
  const path = parsedUrl.pathname;

  /*trim the url */
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  /*get http method from request object */
  const method = req.method.toLowerCase();

  /*get headers */
  const header = req.headers;

  /*get query parametrs */
  const queryParams = parsedUrl.query;

  /**get request body */
  const decoder = new stringDecoder('utf-8');
  let buffer = '';

  req.on('data', (message) => {
    buffer += decoder.write(message)
  });

  req.on('end', () => {
    buffer += decoder.end();
    /**construct object for all params */
    const data = {
      'payload': helpers.jsonParsedObject(buffer),
      'trimmedPath': trimmedPath,
      'headers': header,
      'queryParams': queryParams,
      'method': method
    }

    /**use a handler that matches or use a default handler */
    let chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    chosenHandler(data, (statusCode, payload) => {
      /**use a default statusCode if not is passed */
      statusCode = typeof (statusCode) === 'number' ? statusCode : 200;

      /**return empty object if no payload is passed */
      payload = typeof (payload) === 'object' ? payload : {};
      stringifyPayload = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode)
      res.end(stringifyPayload)
    })

  })

}


/**object to hold all routes in the application */
server.router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens,
  'checks': handlers.checks
}

// init script
server.init = function () {
  // make the server to listen on port 3000/3001
  server.httpServer.listen(config.httpPort, () => {
    console.log(`server is running on port ${config.httpPort} in ${config.envName} mode`);
  });

  // make the server to listen on port 5000/5001
  server.httpsServer.listen(config.httpsPort, () => {
    console.log(`server is running on port ${config.httpsPort} in ${config.envName} mode`);
  });
}

//Export the module
module.exports = server;

