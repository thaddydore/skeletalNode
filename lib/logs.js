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

//list all the logs and optionally include the compressed logs
lib.list = function (includeCompressedLogs, callback) {
  fs.readdir(lib.dirPath, (error, data) => {
    if (!error && data && data.length > 0) {
      const trimmedFileNames = [];
      data.forEach(fileName => {
        //add the .logs files
        if (fileName.indexOf('.log') > -1) {
          trimmedFileNames.push(fileName.replace('.log', ''));
        }

        //add on ghe .gz files 
        if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
          trimmedFileNames.push(fileName.replace('.gz.b64', ''));
        }
      });
      callback(false, trimmedFileNames);
    } else {
      callback(error, data)
    }
  })
};

//compress the contents of one .log file into a .gz.b64 file within the same directory
lib.compress = function (logId, newFileId, callback) {
  const sourceFile = logId + '.log';
  const destFile = newFileId + '.gz.64';

  //Read the source file
  fs.readFile(lib.dirPath + sourceFile, 'utf8', (error, inputString) => {
    if (!error && inputString) {
      //compress the data using gzip
      zlib.gzip(inputString, (error, buffer) => {
        if (!error && buffer) {
          //send the compress data to the destination of file
          fs.open(lib.dirPath + destFile, 'wx', (error, fileDescriptor) => {
            if (!error && fileDescriptor) {
              //write the destination file
              fs.writeFile(fileDescriptor, buffer.toString('base64'), (error) => {
                if (!error) {
                  //close the destination file
                  fs.close(fileDescriptor, (error) => {
                    if (!error) {
                      callback(false);
                    } else {
                      callback(error);
                    }
                  })
                } else {
                  callback(error);
                }
              })
            } else {
              callback(error);
            }
          });
        } else {
          callback(error);
        }
      });
    } else {
      callback(error);
    }
  });
};

//decompress the content of a .gz.base64 into a string variable
lib.decompress = function (fileId, callback) {
  const fileName = fileId + '.gz.b64';
  fs.readFile(lib.dirPath + fileName, 'utf8', (error, str) => {
    if (!error && str) {
      //decompress the data
      const inputBuffer = Buffer.from(str, 'base64');
      zlib.unzip(inputBuffer, (error, outputBuffer) => {
        if (!error && outputBuffer) {
          //callback
          const str = outputBuffer.toString();
          callback(false, str);
        } else {
          callback(error);
        }
      });
    } else {
      callback(error);
    }
  });
};

//truncate a file
lib.truncate = function (logId, callback) {
  fs.truncate(lib.dirPath + logId + '.log', 0, (error) => {
    if (!error) {
      callback(false);
    } else {
      callback(error);
    }
  });
};

// export the module
module.exports = lib;
