"use strict";

var Q = require("q");
var HTTP = require("q-io/http");
var expect = require("chai").expect;
var FakeRestAPI = require("../index");

describe("successful responses from api", function () {
  var serverPort = 4000, response, fakeAPI;
  var expectedContentType = "application/json; charset=utf-8";

  var makeRequest = function () {
    return HTTP.request({
      host: "localhost",
      port: serverPort,
      headers: {
        "content-type": expectedContentType
      }
    })
    .then(function (r) {
      response = r;
    })
    .thenResolve();
  };

  before(function (done) {
    fakeAPI = new FakeRestAPI({ port: serverPort });
    fakeAPI.start()
    .then(makeRequest)
    .then(done, done);
  });

  it("successfully returns", function () {
    expect(response).to.have.property("status", 200);
    expect(response.headers).to.have.property("content-type", expectedContentType);
  });

  it("returns a status of 'ok'", function (done) {
    response.body.read()
    .then(function (body) {
      var parsedBody = JSON.parse(body);
      expect(parsedBody).to.deep.equal({ status: "ok" });
    })
    .then(done, done);
  });

  describe("fails on the next request", function () {
    var errorMessage = "because you don't like cats";
    before(function (done) {
      fakeAPI.failOnNextRequest(errorMessage);
      makeRequest().then(done, done);
    });

    it("successfully returns", function () {
      expect(response).to.have.property("status", 200);
      expect(response.headers).to.have.property("content-type", expectedContentType);
    });

    it("returns a status of 'error' and the error message", function (done) {
      response.body.read()
      .then(function (body) {
        var parsedBody = JSON.parse(body);
        expect(parsedBody).to.deep.equal({ status: "error", message: errorMessage });
      })
      .then(done, done);
    });
  });

  describe("does not fail on the next request", function () {
    before(function (done) {
      makeRequest().then(done, done);
    });

    it("returns a status of 'ok'", function (done) {
      response.body.read()
      .then(function (body) {
        var parsedBody = JSON.parse(body);
        expect(parsedBody).to.deep.equal({ status: "ok" });
      })
      .then(done, done);
    });
  });

  describe("returns specific body on the next request", function () {
    var expectedBody = { status: "ok", cats: [ "siberian", "moggy" ] };

    before(function (done) {
      fakeAPI.setJSONForNextRequest(expectedBody);
      makeRequest().then(done, done);
    });

    it("successfully returns", function () {
      expect(response).to.have.property("status", 200);
      expect(response.headers).to.have.property("content-type", expectedContentType);
    });

    it("returns status of 'ok' and the expected body", function (done) {
      response.body.read()
      .then(function (body) {
        var parsedBody = JSON.parse(body);
        expect(parsedBody).to.deep.equal(expectedBody);
      })
      .then(done, done);
    });
  });

  describe("returns usual response on the next request", function () {
    before(function (done) {
      makeRequest().then(done, done);
    });

    it("returns a status of 'ok'", function (done) {
      response.body.read()
      .then(function (body) {
        var parsedBody = JSON.parse(body);
        expect(parsedBody).to.deep.equal({ status: "ok" });
      })
      .then(done, done);
    });
  });
});
