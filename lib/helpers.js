/**
 * helpers for various task
 */
//dependencies
const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');

//container for helper functions
const helpers = {};

//create a SHA256 hash
helpers.hash = function (str) {
  if (typeof (str) === 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
}

// parse a json string to an object
helpers.jsonParsedObject = function (str) {
  try {
    const obj = JSON.parse(str)
    return obj;
  } catch (error) {
    return { 'Error': 'could not parse Object' };
  }
}

// create a random string of alphanumeric
helpers.createRandomString = function (strLength) {
  
  strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    // define list of all possible charactaer
    const possibleCharacter = 'abcdefghijklmnopqrstuvwxyz123456789';
    let str = '';
    for (let i = 1; i <= strLength; i++) {
      // get a random character from the possible character
      let randomCharacter = possibleCharacter.charAt(Math.floor(Math.random() * possibleCharacter.length));
      // append the character to the final str
      str += randomCharacter
    }
    return str;
  } else {
    return false
  }
}

//send sms via twillo
helpers.sendTwilloSms = function (phone, msg, callback) {
  //validate the parameters
  phone = typeof (phone) === 'string' && phone.trim().length >= 10 ? phone.trim() : false;
  msg = typeof (msg) === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

  if (phone && msg) {
    // configure the payload
    const payload = {
      'From': config.twilio.fromPhone,
      'To': '+234' + phone,
      'Body': msg
    };

    //stringify the payload
    const stringifyPayload = querystring.stringify(payload);

    //configure the request details
    const requestDetails = {
      'protocol': 'https:',
      'hostname': 'api.twilio.com',
      'method': 'POST',
      'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringifyPayload)
      }
    }

    //instanciate the request object
    const req = https.request(requestDetails, (res) => {
      const status = res.statusCode;

      // if request was successful callback to our user
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback('Status code returned was ' + status)
      }
    })

    // bind to the error event so it doesn't get thrown
    req.on('error', (error) => {
      callback(error)
    })
    // add the payload
    req.write(stringifyPayload)
    //end the req
    req.end();
  } else {
    callback('Missing parameters or invalid parameters');
  }
}















module.exports = helpers;