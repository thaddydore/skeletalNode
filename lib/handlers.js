/**
 * @description list of all dependencies
 */
const _data = require('./data');
const helpers = require('./helpers');

/**object to hold all route handlers */
let handlers = {};

handlers.users = function (data, callback) {
  const acceptedMethods = ['post', 'get', 'put', 'delete']

  if (acceptedMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// container for submethods
handlers._users = {};

handlers._users.post = function (data, callback) {
  // check for required parameters firstname, lastname, phonenumber, T&agreement;
  const firstname = typeof (data.payload.firstname) === 'string' && data.payload.firstname.trim().length > 0 ? data.payload.firstname.trim() : false;
  const lastname = typeof (data.payload.lastname) === 'string' && data.payload.lastname.trim().length > 0 ? data.payload.lastname.trim() : false;
  const phonenumber = typeof (data.payload.phonenumber) === 'string' && data.payload.phonenumber.trim().length > 9 ? data.payload.phonenumber.trim() : false;
  const password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 7 ? data.payload.password.trim() : false;
  const toagreement = typeof (data.payload.toagreement) === 'boolean' && data.payload.toagreement === true ? true : false;

  if (firstname, lastname, phonenumber, password, toagreement) {
    //check if a user already exiist using it's phonenumber 
    _data.read('users', phonenumber, function (error, data) {
      if (error && !data) {
        //hash a user password
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          // create user object
          const user = {
            'firstname': firstname,
            'lastname': lastname,
            'phonenumber': phonenumber,
            'password': hashedPassword,
            'toagreement': true,
          }

          // persist the user to disk
          _data.create('users', phonenumber, user, (error, data) => {
            if (!error && data) {
              delete data.password
              callback(200, data);
            } else {
              callback(500, { 'Error': 'could not create a new user' })
            }
          })
        } else {
          callback(500, { 'Error': 'could not hash password' })
        }
      } else {
        callback(400, { 'Error': 'user already exist' })
      }
    })
  } else {
    callback(400, { 'Error': 'Missing parameter required' })
  }
}

// allow user to access it's own object only
handlers._users.get = function (data, callback) {
  //check that the phonenumber is valid
  const phone = typeof (data.queryParams.phonenumber) === 'string' && data.queryParams.phonenumber.trim().length > 9 ? data.queryParams.phonenumber.trim() : false;

  if (phone) {
    const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
    //verify that the token is valid for the given phonenumber
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        
      } else {
        callback(403, {'Error': 'missing parameter token in headers'})
      }
    });
    _data.read('users', phone, (error, data) => {
      if (!error && data) {
        // remove the hashed password before returning to the user
        delete data.password;
        callback(200, data);
      } else {
        callback(404, { 'Error': 'user not found' });
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required parameter' });
  }
}

handlers._users.put = function (data, callback) {
  // authenticate a user
  const phone = typeof (data.payload.phonenumber) === 'string' && data.payload.phonenumber.trim().length > 9 ? data.payload.phonenumber.trim() : false;

  // check for required parameters
  const firstname = typeof (data.payload.firstname) === 'string' && data.payload.firstname.trim().length > 0 ? data.payload.firstname.trim() : false;
  const lastname = typeof (data.payload.lastname) === 'string' && data.payload.lastname.trim().length > 0 ? data.payload.lastname.trim() : false;
  const password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 7 ? data.payload.password.trim() : false;

  if (phone) {
    if (firstname || lastname || password) {
      _data.read('users', phone, (error, data) => {
        if (!error && data) {
          if (firstname) {
            data.firstname = firstname;
          }
          if (lastname) {
            data.lastname = lastname;
          }
          if (password) {
            data.password = helpers.hash(password);
          }

          _data.update('users', phone, data, (error, data) => {
            if (!error && data) {
              callback(200, data)
            } else {
              callback(500, { 'Error': 'user info could not be updated' })
            }
          })
        } else {
          callback(404, { 'Error': 'user not found' });
        }
      })
    } else {
      callback(400, { 'Error': 'missing field to update' });
    }
  } else {
    callback(400, { 'Error': 'Missing parameter' });
  }
}

handlers._users.delete = function (data, callback) {
  const phone = typeof (data.queryParams.phonenumber) === 'string' && data.queryParams.phonenumber.trim().length > 9 ? data.queryParams.phonenumber.trim() : false;

  if (phone) {
    _data.read('users', phone, (error, data) => {
      if (!error && data) {
        // remove the hashed password before returning to the user
        _data.delete('users', phone, (error, data) => {
          if (!error && data) {
            callback(200, data);
          } else {
            callback(500, error);
          }
        })
      } else {
        callback(404, { 'Error': 'user not found' });
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required parameter' });
  }
}

handlers.tokens = function (data, callback) {
  const acceptedMethods = ['post', 'get', 'put', 'delete']

  if (acceptedMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// container for all token methods
handlers._tokens = {};

// required parameter includes phone and password
handlers._tokens.post = function (data, callback) {
  const phonenumber = typeof (data.payload.phonenumber) === 'string' && data.payload.phonenumber.trim().length > 9 ? data.payload.phonenumber.trim() : false;
  const password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 7 ? data.payload.password.trim() : false;

  if (phonenumber && password) {
    // look up user with a phonenumber
    _data.read('users', phonenumber, (error, data) => {
      if (!error && data) {
        // hash password the password and compare it to the one stored in db
        const hashedPassword = helpers.hash(password);
        if (hashedPassword === data.password) {
          // craete a new token with random name and set expiration date to 1hr in the future
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() * 1000 * 60 * 60;
          const tokenObject = {
            'phone': phonenumber,
            'id': tokenId,
            'expires': expires
          }
          // store token to disk
          _data.create('tokens', tokenId, tokenObject, (error, data) => {
            if (!error && data) {
              callback(200, tokenObject)
            } else {
              callback(500, { 'Error': 'could not create new token' })
            }
          })

        } else {
          callback(400, { 'Error': 'incorrect password ' })
        }
      } else {
        callback(400, { 'Error': 'user does not exist' });
      }
    })
  } else {
    callback(400, { 'Error': 'missing parameters required' });
  }
}

// required data is the id
handlers._tokens.get = function (data, callback) {
  const id = typeof (data.queryParams.id) === 'string' && data.queryParams.id.trim().length === 20 ? data.queryParams.id.trim() : false;

  if (id) {
    _data.read('tokens', id, (error, data) => {
      if (!error && data) {
        callback(200, data);
      } else {
        callback(400, { 'Error': 'could read token' });
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required parameter' });
  }
}

handlers._tokens.put = function (data, callback) {
  const id = typeof (data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;
  const extend = typeof (data.payload.extend) === 'boolean' && data.payload.extend === true ? true : false;

  if (id && extend) {
    _data.read('tokens', id, (error, data) => {
      if (!error && data) {
        // check if token hasn't expire
        if (data.expires > Date.now()) {
          data.expires = Date.now() * 1000 * 60 * 60;

          _data.update('tokens', id, data, (error, data) => {
            if (!error, data) {
              callback(200, { 'success': 'token updated successfully' });
            } else {
              callback(500, { 'Error': 'could not update token' });
            }
          })
        } else {
          callback(400, { 'Error': 'token has expired' });
        }
      } else {
        callback(404, { 'Error': 'token does not exist' });
      }
    })
  } else {
    callback(400, { 'Error': 'missing required parameter' });
  }
}

handlers._tokens.delete = function (data, callback) {
  const id = typeof (data.queryParams.id) === 'string' && data.queryParams.id.trim().length === 20 ? data.queryParams.id.trim() : false;

  if (id) {
    _data.read('tokens', id, (error, data) => {
      if (!error && data) {
        // remove the hashed password before returning to the user
        _data.delete('tokens', id, (error, data) => {
          if (!error && data) {
            callback(200, {'success': 'token deleted successfully'});
          } else {
            callback(500, {'Error': 'token could not deleted'});
          }
        })
      } else {
        callback(404, { 'Error': 'token not found' });
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required parameter' });
  }
}

// verify if a given token_id is valid for a given user
handlers.tokens.verifyToken = function(id, phone, callback) {
  // look up for token data
  _data.read('token', id, (error, tokenData) => {
    if (!error && tokenData) {
      if (tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true)
      } else {
        callback(false)
      }
    } else {
      callback(false);
    }
  })
}


handlers.ping = function (data, callback) {
  callback(200, { 'sucess': 'server is up and running' })
};

handlers.notFound = function (data, callback) {
  callback(404, { 'Error': 'route does not exist' });
};

module.exports = handlers;