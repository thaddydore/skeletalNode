const enviroments = {};

enviroments.stagging = {
  'envName': 'stagging',
  'httpPort': 3000,
  'httpsPort': 3001,
  'hashingSecret': 'thaddydore'
}

enviroments.production = {
  'envName': 'production', 
  'http': 5000,
  'httpsPort': 5001,
  'hashingSecret': 'thaddydore'
}

let currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

let environmentToExport = typeof(enviroments[currentEnvironment]) == 'object' ? enviroments[currentEnvironment] : enviroments.stagging;

/**export the current enironment */

module.exports = environmentToExport;