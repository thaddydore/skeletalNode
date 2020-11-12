/**
 * helpers for various task
 */
//dependencies
const crypto = require('crypto');
const config = require('./config');

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
  phone = typeof (phone) === 'string' && phone.trim().length >= 11 ? phone.trim() : false;
  msg = typeof (msg) === 'string' && msg.trim.length > 0 && msg.trim.length <= 1600 ? msg.trim() : false;

  if (phone && message) {
    // configure the payload
    const payload = {
      'From': config.twillo.fromPhone,
      'To': '+1' + phone,
      'Body': msg
    };

    //stringify the payload
    const stringifyPayload = querystring.stringify()
  } else {
    callback('Missing parameters or invalid parameters');
  }
}















module.exports = helpers;