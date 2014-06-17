'use strict';

var Q = require('q');
var qHttp = require('q-io/http');

function makeRequest(options) {
  return qHttp.request({
    host: "localhost",
    port: options.port,
    headers: (options.headers) ? options.headers : { 'content-type': 'application/json; charset=utf-8' }
  });
}

function makeRequestBatch(options, number) {
  var promises = [];
  var it;

  for(it = 0; it < number; it++) {
    promises.push(makeRequest(options));
  }

  return Q.all(promises);
}

module.exports = {
  makeRequest: makeRequest,
  makeRequestBatch: makeRequestBatch
};

