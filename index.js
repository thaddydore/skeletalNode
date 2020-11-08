/*
app that listens to all http verb commands
*/

/*list of Dependencies */

const http = require('http');
const url = require('url');
const https = require('https');
const stringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const config = require('./lib/config');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

/*create a http server instance*/
const httpServer = http.createServer(universalHandler)

// make the server to listen on port 3000/3001
httpServer.listen(config.httpPort, () => {
  console.log(`server is running on port ${config.httpPort} in ${config.envName} mode`);
});

/*create a https server instance*/
const option = {
  'key': fs.readFileSync('./httpsCert/key.pem'),
  'cert': fs.readFileSync('./httpsCert/cert.pem')
}

/*create a https server instance*/
const httpsServer = https.createServer(option, universalHandler)

// make the server to listen on port 5000/5001
httpsServer.listen(config.httpsPort, () => {
  console.log(`server is running on port ${config.httpsPort} in ${config.envName} mode`);
});


/**create an universal hnadler */
function universalHandler(req, res){

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
    let chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

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
let router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens
}


// create a function callled pop with no parameter
// check if head exist, reutrn undefine if it doesn't exist
//create two variables to store current node and new tail
// create a while loop that runs if their is still a node
// set the newtail to the current
// set the current to the next node

// set the tail to newtail
// set the next tail to null
//reduce the length of the node by 1
//check if the length is zero
//set the head to null
// set the tail to null
// return current

