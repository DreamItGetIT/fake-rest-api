"use strict";

var Q = require("q");
var HTTP = require("q-io/http");

var server = null;
var failOnNextRequestMessage = null;
var bodyForNextRequest = null;
var contentType = "application/json; charset=utf-8";

exports.restart = function () {
  return exports.start(exports.port);
};

exports.setJSONForNextRequest = function (data) {
  bodyForNextRequest = JSON.stringify(data);
};

exports.failOnNextRequest = function (message) {
  failOnNextRequestMessage = message;
};

exports.start = function (port) {
  port = port || 0;
  exports.requests = [];

  server = HTTP.Server(handleRequest);

  return server.listen(port)
  .then(function (server) {
    exports.port = server.address().port;
  });
};

exports.waitForRequests = function (count) {
  function check() {
    if (exports.requests.length === count) {
      return Q(exports.requests);
    }
    return Q.delay(10).then(check);
  }

  return check();
};

exports.stop = function () {
  if (server !== null) {
    server.stop();
    server = null;
  }
};

function handleRequest(request, response) {
  exports.requests.push(request);

  if (failOnNextRequestMessage) {
    var msg = failOnNextRequestMessage;
    failOnNextRequestMessage = null;
    return {
      "status": 200,
      "headers": {
        "content-type": contentType
      },
      "body": [
        "{ \"status\": \"error\", \"message\": \"" + msg + "\" }"
      ]
    };
  }

  var body = bodyForNextRequest || "{ \"status\": \"ok\" }";
  bodyForNextRequest = null;

  return {
    "status": 200,
    "headers": {
      "content-type": contentType
    },
    "body": [ body ]
  };
}
