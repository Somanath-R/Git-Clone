const fs = require('fs-extra');
const path = require('path');

function getTimeStamp() {
  return new Date().toISOString().replace(/[:-]/g, '').replace(/\..+/, '') + 'Z';
}

function getProjectPath(name) {
  return path.join(__dirname, '..', 'projects', name);
}

module.exports = {
  getTimeStamp,
  getProjectPath,
};
