"use strict";

var crypto = require('crypto');

function randId(bytes) {
  var b = Math.ceil(bytes * 3/4);
  var id = crypto.randomBytes(b).toString('base64').replace(/=+$/, '').substr(0, bytes);
  return id;
}

module.exports = randId;
