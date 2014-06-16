"use strict";

var Q = require("q");
var HTTP = require("q-io/http");

var CONTENT_TYPE = "application/json; charset=utf-8";

function validateRequiredOptions(options) {
  if ('number' !== typeof options.port) {
    throw new Error('port is required option');
  }
}

function clonePlainObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function handleRequest(fakeRestAPI, request) {
  var body = fakeRestAPI.responsesBody.shift() || fakeRestAPI.defaultResponse;

  fakeRestAPI.requests.push(request);
  return {
    status: 200,
    headers: {
      'content-type': CONTENT_TYPE
    },
    body: [body]
  };
}

function FakeRestAPI(options) {
  if (!(this instanceof FakeRestAPI)) {
    return new FakeRestAPI(options);
  }

  validateRequiredOptions(options);

  if (options.defaultResponse) {
    this.defaultResponse = ('string' === typeof options.defaultResponse) ? options.defaultResponse : JSON.stringify(options.defaultResponse);
  } else {
    this.defaultResponse = require('fs').readFileSync(__dirname + '/default-ok-response-body.json', { encoding: 'utf-8' });
  }

  if (options.failResponseFormat) {
    this.failResponseFormat = ('object' === typeof options.failResponseFormat) ? options.failResponseFormat : JSON.parse(options.failResponseFormat);
  } else {
    this.failResponseFormat = require('./default-error-response-body.json');
  }

  this.port = options.port;
  this.requests = [];
  this.responsesBody = [];
  this.server = null;
}

FakeRestAPI.prototype.setJSONForRquest = function (body) {
  this.responsesBody.push(('string' === typeof body) ? body : JSON.stringify(body));
};

FakeRestAPI.prototype.setJSONForNextRequest = function (body) {
  this.responsesBody.unshift(('string' === typeof body) ? body : JSON.stringify(body));
};

FakeRestAPI.prototype.failOnNextRequest = function (objOrMsg) {
  var respBody;

  if ('string' === typeof objOrMsg) {
    respBody = clonePlainObject(this.failResponseFormat);
    respBody.message = objOrMsg;
  } else {
    respBody = objOrMsg;
  }

  this.responsesBody.unshift(JSON.stringify(respBody));
};

FakeRestAPI.prototype.start = function () {
  this.server = HTTP.Server(handleRequest.bind(null, this));
  return this.server.listen(this.port).thenResolve();
};

FakeRestAPI.prototype.restart = function () {
  return this.stop(this.start.bind(this));
};

FakeRestAPI.prototype.waitForRequests = function (number) {
  function check() {
    if (_this.requests.length === number + startIdx) {
      return Q(_this.requests.slice(startIdx));
    }
    return Q.delay(10).then(check);
  }

  var _this = this;
  var startIdx = this.requests.length;
  return check();
};

FakeRestAPI.prototype.stop = function () {
  if (this.server !== null) {
    try {
      return this.server.stop();
    } finally {
      this.server = null;
    }
  } else {
    return Q();
  }
};

module.exports = FakeRestAPI;

//exports.restart = function () {
//  return exports.start(exports.port);
//};

//exports.setJSONForNextRequest = function (data) {
//  bodyForNextRequest = JSON.stringify(data);
//};

//exports.failOnNextRequest = function (message) {
//  failOnNextRequestMessage = message;
//};

//exports.start = function (port) {
//  port = port || 0;
//  exports.requests = [];
//
//  server = HTTP.Server(handleRequest);
//
//  return server.listen(port)
//  .then(function (server) {
//    exports.port = server.address().port;
//  });
//};

//exports.waitForRequests = function (count) {
//  function check() {
//    if (exports.requests.length === count) {
//      return Q(exports.requests);
//    }
//    return Q.delay(10).then(check);
//  }
//
//  return check();
//};

//exports.stop = function () {
//  if (server !== null) {
//    server.stop();
//    server = null;
//  }
//};

//function handleRequest(request, response) {
//  exports.requests.push(request);
//
//  printRequest(request);
//
//  if (failOnNextRequestMessage) {
//    var msg = failOnNextRequestMessage;
//    failOnNextRequestMessage = null;
//    return {
//      "status": 200,
//      "headers": {
//        "content-type": contentType
//      },
//      "body": [
//        "{ \"status\": \"error\", \"message\": \"" + msg + "\" }"
//      ]
//    };
//  }
//
//  var body = bodyForNextRequest || "{ \"status\": \"ok\" }";
//  bodyForNextRequest = null;
//
//  return {
//    "status": 200,
//    "headers": {
//      "content-type": contentType
//    },
//    "body": [ body ]
//  };
//}
