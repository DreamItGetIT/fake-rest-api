"use strict";

var _ = require("lodash");
var HTTP = require("q-io/http");
var expect = require("chai").expect;
var FakeRestAPI = require("../");

describe("FakeRestAPI", function () {
  function makeRequest(opts) {
    return HTTP.request({
      host: "localhost",
      port: opts.port,
      method: opts.method
    }).then(function (r) {
      return r.body.read().then(function (body) {
        try {
          r.bodyAsObject = JSON.parse(body);
        } catch (e) {
          throw new Error("Cannot parse body: " + body);
        }
      }).thenResolve(r);
    });
  }

  describe("configuring", function () {
    describe("port", function () {
      var restAPI;

      before(function (done) {
        restAPI = new FakeRestAPI({ port: 54321 });
        restAPI.start().then(done, done);
      });

      after(function (done) {
        restAPI.stop().then(done, done);
      });

      it("allows the port to be configured", function () {
        expect(restAPI).to.have.property("port", 54321);
      });
    });
  });

  describe("default behaviour", function () {
    var restAPI;

    before(function (done) {
      restAPI = new FakeRestAPI();

      restAPI.start().then(done, done);
    });

    after(function (done) {
      restAPI.stop().then(done, done);
    });

    it("has a random port", function () {
      expect(restAPI).to.have.property("port");
      expect(parseInt(restAPI.port, 10)).to.not.equal(NaN);
    });

    ["GET", "POST", "PUT", "DELETE", "PATCH"].forEach(function (method) {
      describe("when making a " + method + " request", function () {
        var response;

        before(function (done) {
          makeRequest({ port: restAPI.port, method: method })
          .then(function (r) {
            response = r;
          }).then(done, done);
        });

        it("responds with a 200 status code", function () {
          expect(response).to.have.property("status", 200);
        });

        it("sends a 'content-type' header with content 'application/json'", function () {
          expect(response.headers).to.have.property("content-type", "application/json; charset=utf-8");
        });

        it("sends a body with just a status property of 'ok'", function () {
          expect(response.bodyAsObject).to.deep.equal({ status: "ok" });
        });

        it("stores the request for verification", function () {
          var lastRequest = _.last(restAPI.requests);

          expect(lastRequest).to.not.be.undefined;

          expect(lastRequest.method).to.equal(method);
        });
      });
    });
  });

  describe("overriding the next response", function () {
    var restAPI;

    before(function (done) {
      restAPI = new FakeRestAPI();
      restAPI.start().then(done, done);
    });

    after(function (done) {
      restAPI.stop().then(done, done);
    });

    it("the status code can be overridden", function (done) {
      restAPI.overrideNextResponse({ status: 404 });

      makeRequest({ port: restAPI.port, method: "GET" })
      .then(function (r) {
        expect(r).to.have.property("status", 404);
      }).then(done, done);
    });

    it("the headers code can be overridden", function (done) {
      restAPI.overrideNextResponse({
        headers: {
          "content-type": "text/plain"
        }
      });

      makeRequest({ port: restAPI.port, method: "GET" })
      .then(function (r) {
        expect(r.headers).to.have.property("content-type", "text/plain");
      }).then(done, done);
    });

    it("the response body can be overridden", function (done) {
      restAPI.overrideNextResponse({ body: [JSON.stringify({ status: "Hello" })] });

      makeRequest({ port: restAPI.port, method: "GET" })
      .then(function (r) {
        expect(r.bodyAsObject).to.deep.equal({ status: "Hello" });
      }).then(done, done);
    });

    it("only overrides the next request", function (done) {
      restAPI.overrideNextResponse({ body: [JSON.stringify({ status: "Hello" })] });
      makeRequest({ port: restAPI.port, method: "GET" })
      .then(function () {
        return makeRequest({ port: restAPI.port, method: "GET" })
        .then(function (r) {
          expect(r.bodyAsObject).to.deep.equal({ status: "ok" });
        });
      }).then(done, done);
    });
  });

  describe("making the next request return a standard error response", function () {
    var restAPI, response;

    before(function (done) {
      restAPI = new FakeRestAPI();
      restAPI.start()
      .then(function () {
        restAPI.makeNextResponseAnError("This is the error.");

        return makeRequest({ port: restAPI.port, method: "GET" });
      })
      .then(function (r) { response = r; })
      .then(done, done);
    });

    after(function (done) {
      restAPI.stop().then(done, done);
    });

    it("responds with a 200 status code", function () {
      expect(response).to.have.property("status", 200);
    });

    it("sends a 'content-type' header with content 'application/json'", function () {
      expect(response.headers).to.have.property("content-type", "application/json; charset=utf-8");
    });

    it("sends a body with status property of 'error'", function () {
      expect(response.bodyAsObject).to.have.property("status", "error");
    });

    it("sends a body with the supplied error message", function () {
      expect(response.bodyAsObject).to.have.property("message", "This is the error.");
    });
  });

  describe("waiting for a number of requests to have been received", function () {
    var restAPI;

    before(function (done) {
      restAPI = new FakeRestAPI();
      restAPI.start()
      .then(done, done);
    });

    after(function (done) {
      restAPI.stop().then(done, done);
    });

    it("waits until the specified number of requests have been made", function (done) {
      var waitPromise = restAPI.waitForRequests(5);

      _.times(5, function (i) {
        makeRequest({ port: restAPI.port, method: "GET", headers: { "x-request-number": i } });
      });

      waitPromise.then(function () {
        expect(restAPI.requests).to.have.property("length", 5);
      }).then(done, done);
    });
  });
});
