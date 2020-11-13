// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for module (to be exported)
const lib = {}

// Base directory of data folder
const dirPath = path.join(__dirname, '/../.data/');

// Write data to a file
lib.create = function (dir, filename, data, callback) {

  // serialize directory path
  const serializePath = `${dirPath}${dir}/${filename}.json`;

  // Open the file for writing
  fs.open(serializePath, 'wx', (error, fileDescriptor) => {

    if (!error && fileDescriptor) {
      // Convert data to string
      stringifyData = JSON.stringify(data)

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringifyData, (error) => {
        if (!error) {
          fs.close(fileDescriptor, (error) => {
            if (!error) {
              callback(false, { 'Success': 'file created successfully' })
            } else {
              callback({ 'Error': 'could not close filesystem' })
            }
          })
        } else {
          callback({ 'Error': 'error occurred while trying to create file' })
        }
      })
    } else {
      callback({ 'Error': 'file could not open. Try again' })
    }
  });
}

// Read data from a file
lib.read = function (dir, filename, callback) {
  // serialize directory path
  const serializePath = `${dirPath}${dir}/${filename}.json`;

  fs.readFile(serializePath, { encoding: 'utf-8', flag: 'r' }, (error, data) => {
    if (!error && data) {
      const parsedData = helpers.jsonParsedObject(data)
      callback(false, parsedData);
    } else {
      callback({ 'Error': 'file could not be read at the moment' }, data);
    }
  })
}

// Update data in a file
lib.update = function (dir, filename, data, callback) {
  const serializePath = `${dirPath}${dir}/${filename}.json`;

  // Open the file for writing
  fs.open(serializePath, 'r+', (error, fileDescriptor) => {

    if (!error) {

      // Truncate the file
      fs.ftruncate(fileDescriptor, (error) => {
        if (!error) {
          // Convert data to string
          const stringifyData = JSON.stringify(data)
          // Write to file and close it
          fs.writeFile(fileDescriptor, stringifyData, (error) => {
            if (!error) {
              fs.close(fileDescriptor, (error) => {
                if (!error) {
                  callback(false, { 'Success': 'user updated successfully' })
                } else {
                  callback({ 'Error': 'file could not be closed' })
                }
              })
            } else {
              callback({ 'Error': 'file could not be written to' })
            }
          })
        } else {
          callback({ 'Error': 'file could not be written truncated' })
        }
      })
    } else {
      callback({ 'Error': 'file could not be open for written' });
    }
  })

}

lib.delete = function (dir, filename, callback) {
  const serializePath = `${dirPath}${dir}/${filename}.json`;

  fs.unlink(serializePath, (error) => {
    if (!error) {
      callback(false, { 'Success': 'user deleted successfully' });
    } else {
      callback({ 'Error': 'user could not be deleted' })
    }
  })
}

//list all the items in a directory
lib.list = function (dir, callback) {
  fs.readdir(lib.dirPath + dir + '/', function (error, data) {
    if (!error && data && data.length > 0) {
      let trimmedFilenames = [];
      data.forEach((fileName) => {
        trimmedFilenames.push(fileName.replace('.json', ''));
      });
      callback(false, trimmedFilenames);
    } else {
      callback(error, data);
    }
  });
};

module.exports = lib;