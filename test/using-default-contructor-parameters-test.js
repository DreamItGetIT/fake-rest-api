"use strict";

var expect = require("chai").expect;
var helper = require('./helper');
var FakeRestAPI = require("../index");

describe("An instance created with default parameters", function () {
  var serverPort = 4000, response, fakeAPI;
  var expectedContentType = "application/json; charset=utf-8";
  var requestOptions = {
    port: serverPort,
    headers: {
      "content-type": expectedContentType
    }
  };

  before(function (done) {
    fakeAPI = new FakeRestAPI();
    fakeAPI.start(serverPort)
    .then(helper.makeRequest.bind(null, requestOptions))
    .then(function (resp) {
      response = resp;
    }).then(done, done);
  });

  after(function (done) {
    fakeAPI.stop().then(done, done);
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
      helper.makeRequest(requestOptions)
      .then(function (resp) {
        response = resp;
      }).then(done, done);
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
      }).then(done, done);
    });
  });

  describe("does not fail on the next request", function () {
    before(function (done) {
      helper.makeRequest(requestOptions)
      .then(function (resp) {
        response = resp;
      }).then(done, done);
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
      helper.makeRequest(requestOptions)
      .then(function (resp) {
        response = resp;
      }).then(done, done);
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
      helper.makeRequest(requestOptions)
      .then(function (resp) {
        response = resp;
      }).then(done, done);
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
