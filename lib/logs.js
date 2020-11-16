/**
 * a library for storing and rotating logs
 */

//dependencies

const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

//container for the module 
const lib = {};

// Base directory of data folder
lib.dirPath = path.join(__dirname, '/../.logs/');

//append a string to a file. Create the file if it doesnt exist
lib.append = function (file, str, callback) {
  //open the file for appending
  fs.open(lib.dirPath + file + '.log', 'a', (error, fileDescriptor) => {
    if (!error && fileDescriptor) {
      //append to the file and close it
      fs.appendFile(fileDescriptor, str + '\n', function (error) {
        if (!error) {
          fs.close(fileDescriptor, function (error) {
            if (!error) {
              callback(false);
            } else {
              callback('error closing file that was appended');
            }
          });
        } else {
          callback('error appending the file');
        }
      });
    } else {
      callback('could not open file for appending');
    }
  })
};





// export the module
module.exports = lib;
