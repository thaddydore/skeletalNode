const enviroments = {};

enviroments.stagging = {
  'envName': 'stagging',
  'httpPort': 3000,
  'httpsPort': 3001,
  'hashingSecret': 'thaddydore',
  'maxChecks': 5,
  'twilio': {
    'accountSid': 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone': '+15005550006'
  }
}

enviroments.production = {
  'envName': 'production', 
  'http': 5000,
  'httpsPort': 5001,
  'hashingSecret': 'thaddydore',
  'maxChecks': 5,
  'twilio': {
    'accountSid': 'AC3bdf5ca75e5fea1d663322283a25618d',
    'authToken': 'dbc425cf1f1227a4a906e0b07060abb8',
    'fromPhone': '+15005550006'
  }
}

let currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

let environmentToExport = typeof(enviroments[currentEnvironment]) == 'object' ? enviroments[currentEnvironment] : enviroments.stagging;

/**export the current enironment */

module.exports = environmentToExport;