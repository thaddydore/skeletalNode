/***
 * worker related task
 *
 */
//dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const http = require('http');
const https = require('htpps');
const helpers = require('./helpers');
const url = require('url');
const { worker } = require('cluster');

// instanciate the worker object
const workers = {};

//lookup all the checks, get their data and send to a validator
workers.gatherAllChecks = function () {
  //get all the checks that exist in the system
  _data.list('checks', (error, checks) => {
    if (!error && checks && checks.length > 0) {
      checks.forEach(check => {
        _data.read('checks', check, (error, originalCheckData) => {
          if (error && originalCheckData) {
            // pass the checkdata to the check validator and the let that function continue or log error to the console
            workers.validateCheckData(originalCheckData);
          } else {
            console.log('Error reading one the checks data');
          }
        });
      });
    } else {
      console.log('Error: could not find any checkto process');
    }
  });
};

//sanity-checking the check-data
workers.validateCheckData = function (originalCheckData) {
  originalCheckData = typeof (originalCheckData) === 'object' && originalCheckData == null ? originalCheckData : {};
  originalCheckData.id = typeof (originalCheckData.id) === 'string' && originalCheckData.id.trim().length === 20 ? originalCheckData.id.trim() : false;
  originalCheckData.userPhone = typeof (originalCheckData.userPhone) === 'string' && originalCheckData.userPhone.trim().length >= 10 ? originalCheckData.userPhone.trim() : false;
  originalCheckData.protocol = typeof (originalCheckData.protocol) === 'string' && ['https', 'http'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
  originalCheckData.url = typeof (originalCheckData.url) === 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
  originalCheckData.method = typeof (originalCheckData.method) === 'string' && ['get', 'post', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
  originalCheckData.successCodes = typeof (originalCheckData.successCodes) === 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
  originalCheckData.timeoutSeconds = typeof (originalCheckData.timeoutSeconds) === 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

  // set the keys that may not be set if the workers have never seen the check before
  originalCheckData.state = typeof (originalCheckData.state) === 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
  originalCheckData.lastChecked = typeof (originalCheckData.lastChecked) === 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

  // if all the checks pass,  pass the data along to the next step in the process
  if (originalCheckData.id && originalCheckData.userPhone && originalCheckData.protocol && originalCheckData.url && originalCheckData.method && originalCheckData.successCodes && originalCheckData.timeoutSeconds) {
    workers.performCheck(originalCheckData);
  } else {
    console.log('Error: one the checks is not properly formatted. skipping it');
  }
}

//perform the check and send the originalCheckData and the outcome of the check process to the next step in the process
workers.performCheck = function (originalCheckData) {
  //prepare the initial check outcome
  const checkOutcome = {
    'error': false,
    'responseCode': false
  }

  //mark that the outcome has not been sent yet
  let outcomeSent = false;

  //parse the host name and path out of the original check data
  const parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
  const hostname = parsedUrl.hostname;
  const path = parsedUrl.path;

  //construct the request
  const requestDetail = {
    'protocol': originalCheckData.protocol + ':',
    'hostname': hostname,
    'method': originalCheckData.method.toUpperCase(),
    'path': path,
    'timeout': originalCheckData.timeoutSeconds * 1000



  }
};

//this is a timer to execute the workers process once per minute
workers.loop = function () {
  setInterval(function () {
    workers.gatherAllChecks();
  }, 1000 * 60)
};


//init script 
workers.init = function () {
  // execute all the checks
  workers.gatherAllChecks();

  //call the loop so that they check execute later on
  workers.loop();

}
module.exports = workers;



