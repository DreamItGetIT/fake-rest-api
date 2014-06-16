"use strict";

var Q = require("q");
var HTTP = require("q-io/http");

var CONTENT_TYPE = "application/json; charset=utf-8";

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

  if (!options) {
    options = {};
  }

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

  this.requests = null;
  this.responsesBody = null;
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

FakeRestAPI.prototype.start = function (port) {
  var _this = this;

  this.requests = [];
  this.responsesBody = [];
  this.server = HTTP.Server(handleRequest.bind(null, this));
  return this.server.listen(port)
  .then(function (server) {
    _this.port = server.address().port;
  });
};

FakeRestAPI.prototype.restart = function () {
  return this.stop(this.start.bind(this));
};

FakeRestAPI.prototype.waitForRequests = function (count) {
  function check() {
    if (_this.requests.length === count) {
      return Q(_this.requests);
    }
    return Q.delay(10).then(check);
  }

  var _this = this;
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
