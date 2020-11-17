/***
 * worker related task
 *
 */
//dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const http = require('http');
const https = require('https');
const helpers = require('./helpers');
const url = require('url');
const _log = require('./logs');

// instanciate the worker object
const workers = {};

//lookup all the checks, get their data and send to a validator
workers.gatherAllChecks = function () {
  //get all the checks that exist in the system
  _data.list('checks', (error, checks) => {
    if (!error && checks && checks.length > 0) {
      checks.forEach(check => {
        _data.read('checks', check, (error, originalCheckData) => {
          if (!error && originalCheckData) {
            // pass the checkdata to the check validator and the let that function continue or log error to the console
            workers.validateCheckData(originalCheckData);
          } else {
            console.log('Error reading one the checks data');
          }
        });
      });
    } else {
      console.log('Error: could not find any check to process');
    }
  });
};

//sanity-checking the check-data
workers.validateCheckData = function (originalCheckData) {
  originalCheckData = typeof (originalCheckData) === 'object' && originalCheckData != null ? originalCheckData : {};
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
    'Protocol': originalCheckData.protocol + ':',
    'hostname': hostname,
    'method': originalCheckData.method.toUpperCase(),
    'path': path,
    'timeout': originalCheckData.timeoutSeconds * 1000

  }
  //instanciate the request object using either the http or the htpps module 
  const moduleToUse = originalCheckData.protocol === 'https' ? http : https;
  const req = moduleToUse.request(requestDetail, function (res) {
    //grab the status of the request 
    const status = res.statusCode;

    //update the check outcome and pass the data along
    checkOutcome.responseCode = status;

    if (!outcomeSent) {
      workers.processCheckOut(originalCheckData, checkOutcome);
      outcomeSent = true;
    }

  });

  //bind to the error event so that it doesn't get thrown
  req.on('error', function (error) {
    //update the checkout and pass the along 
    checkOutcome.error = {
      'error': true,
      'value': error
    }

    if (!outcomeSent) {
      workers.processCheckOut(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on('timeout', function (error) {
    //update the checkout and pass the along 
    checkOutcome.error = {
      'error': true,
      'value': 'timeout'
    }

    if (!outcomeSent) {
      workers.processCheckOut(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  //end the request
  req.end();
};
//process the check out and update the check data as needed and send an alert to the user if needed

workers.processCheckOut = function (originalCheckData, checkOutcome) {
  //decide if the check is considered up or down 
  const state = !checkOutcome && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

  //decide if an alert is wanted 
  const alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

  //log the outcome
  let timeOfCheck = Date.now();
  workers.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck);

  //update the check data
  const newCheckedData = originalCheckData;
  newCheckedData.sate = state;
  newCheckedData.lastChecked = timeOfCheck;

  //save the update
  _data.update('checks', newCheckedData.id, newCheckedData, (error, checkData) => {
    if (!error && checkData) {
      //send the check data to the next phase in the process if needed 
      if (alertWarranted) {
        workers.alertUsersStatusChange(newCheckedData);
      } else {
        console.log('check outcome has not changed, no alert needed');
      }

    } else {
      callback('Error: trying to save on of the update to disk');
    }
  });
}

//alert the user as to a change in their check status 
workers.alertUsersStatusChange = function (newCheckedData) {
  const msg = `Alert: youar check for ${newCheckedData.method.toUpperCase()} ${newCheckedData.protocol}://${newCheckedData.url} is currently ${newCheckedData.state}`;
  helpers.sendTwilloSms(newCheckedData.userPhone, msg, (error) => {
    if (!error) {
      console.log('Success: user was alerted to a status change in check via sms', msg);
    } else {
      console.log('Error : could not send to user has a state change in their check');
    }
  })
};

//log to the file
workers.log = function (originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck) {
  //form the log data
  const logData = {
    'check': originalCheckData,
    'outcome': checkOutcome,
    'state': state,
    'alert': alertWarranted,
    'time': timeOfCheck
  };

  //convert data to string
  const logString = JSON.stringify(logData);

  //determine the name of the log file
  const logfileName = originalCheckData.id;

  //append the log string to the file
  _log.append(logfileName, logString, function (error) {
    if (!error) {
      console.log('logging to file is succeeded')
    } else {
      console.log('logging to file failed')
    }
  })
};

//this is a timer to execute the workers process once per minute
workers.loop = function () {
  setInterval(function () {
    workers.gatherAllChecks();
  }, 1000 * 60)
};

//rotate(compress) the log file
workers.rotateLogs = function () {
  //list all the logs that are not compressed in the log folder
  _log.list(false, (error, logs) => {
    if (!error && logs && logs.length > 0) {
      logs.forEach(logName => {
        //compress the data to a different file
        const logId = logName.replace('.log', '');
        const newFileId = logId + '-' + Date.now();
        _log.compress(logId, newFileId, (error) => {
          if (!error) {
            //truncate the log
            _log.truncate(logId, (error) => {
              if (!error) {
                console.log('Success truncating log file');
              } else {
                console.log('Error truncating log file');
              }
            })
          } else {
            console.log("Error compressing of the log files", error);
          }
        });
      })
    } else {
      console.log("Error : could not find any log to rotate")
    }
  });
}

//Time to execute the log rotation process once per day
workers.logRotationLoop = function () {
  setInterval(function () {
    workers.rotateLogs();
  }, 1000 * 60 * 60 * 24)
}

//init script 
workers.init = function () {
  // execute all the checks
  workers.gatherAllChecks();

  //call the loop so that they check execute later on
  workers.loop();

  // compress all the logs immediately
  workers.rotateLogs();

  //call the compression loops so logs will be compress later  on
  workers.logRotationLoop();
}
module.exports = workers;



