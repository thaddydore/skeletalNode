//  dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');

//declare the app
const app = {};

//init function
app.init = function () {
  //start the app
  server.init();

  //start the workers
  workers.init();
};

//execute
app.init();

//export the app
module.exports = app;