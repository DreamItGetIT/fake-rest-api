"use strict";

var HTTP = require("q-io/http");
var _ = require("lodash");
var Q = require("q");

var DEFAULT_RESPONSE = {
  status: 200,
  headers: {
    "content-type": "application/json; charset=utf-8"
  },
  body: [JSON.stringify({ status: "ok" })]
};

function FakeRestAPI(opts) {
  opts = opts || {};
  this.requests = [];
  this.port = opts.port;
  this.defaultResponse = opts.defaultResponse || DEFAULT_RESPONSE;
}

FakeRestAPI.prototype.start = function () {
  var port = this.port || 0;

  this.server = HTTP.Server(handleRequest.bind(null, this));

  return this.server.listen(port)
  .then(function (server) {
    this.port = server.address().port;
  }.bind(this));
};

FakeRestAPI.prototype.stop = function () {
  if (!this.server) {
    return Q();
  }
  var server = this.server;
  this.server = null;
  return server.stop();
};

FakeRestAPI.prototype.overrideNextResponse = function (r) {
  this.nextResponse = r;
};

FakeRestAPI.prototype.makeNextResponseAnError = function (message) {
  this.overrideNextResponse({
    body: [JSON.stringify({
      status: "error",
      message: message
    })]
  });
};

FakeRestAPI.prototype.waitForRequests = function (count) {
  var api = this;

  function check() {
    if (api.requests.length === count) {
      return Q(api.requests);
    }
    return Q.delay(10).then(check);
  }

  return check();
};

function handleRequest(fakeRestAPI, req) {
  fakeRestAPI.requests.push(req);

  var response = _.extend({}, fakeRestAPI.defaultResponse, fakeRestAPI.nextResponse);
  fakeRestAPI.nextResponse = undefined;
  return response;
}

module.exports = FakeRestAPI;
