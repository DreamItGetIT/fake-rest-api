'use strict';

var expect = require('chai').expect;
var helper = require('./helper');
var FakeRestAPI = require('../index');

describe('An instances created with personalised default responses parameters', function () {
  var fakeRestAPI;
  var expectedContentType = 'application/json; charset=utf-8';
  var defaultErrorResponseFormat = {
    error: true
  };
  var defaultSuccessfulResponse = {
    error: false
  };
  var requestOptions = {
    port: 0,
    headers: {
      'content-type': expectedContentType
    }
  };

  before(function (done) {
    fakeRestAPI = new FakeRestAPI({
      defaultResponse: defaultSuccessfulResponse,
      failResponseFormat: defaultErrorResponseFormat
    });
    fakeRestAPI.start()
    .then(function () {
      requestOptions.port = fakeRestAPI.port;
    })
    .then(done, done);
  });

  after(function (done) {
    fakeRestAPI.stop().then(done, done);
  });

  describe('sending a request without any parametrisation', function () {
    var response, body;

    before(function (done) {
      helper.makeRequest(requestOptions)
      .then(function (resp) {
        response = resp;
        return response.body.read()
        .then(function (jsonBody) {
          body = JSON.parse(jsonBody);
        });
      })
      .then(done, done);
    });

    it('responses successfully', function () {
      expect(response).to.have.property('status', 200);
      expect(response.headers).to.have.property('content-type', expectedContentType);
    });

    it('responses with error "false"', function () {
      expect(body).to.have.property('error', false);
    });

    it('responses with any property more', function () {
      expect(body).to.deep.equal({ error: false });
    });
  });

  describe('sending a request afer specifying that the response have to fail', function () {
    describe('with an error message', function () {
      var response, body;

      before(function (done) {
        fakeRestAPI.failOnNextRequest('this is a crazy error');
        helper.makeRequest(requestOptions)
        .then(function (resp) {
          response = resp;
          return response.body.read()
          .then(function (jsonBody) {
            body = JSON.parse(jsonBody);
          });
        })
        .then(done, done);
      });

      it('responses successfully', function () {
        expect(response).to.have.property('status', 200);
        expect(response.headers).to.have.property('content-type', expectedContentType);
      });

      it('responses with error "true"', function () {
        expect(body).to.have.property('error', true);
      });

      it('responses with the specified message', function () {
        expect(body).to.have.property('message', 'this is a crazy error');
      });

      it('responses with any property more', function () {
        expect(Object.keys(body)).to.deep.equal(['error', 'message']);
      });
    });

    describe('with a customised error body', function () {
      var response, body, wantedErrorBody;

      before(function (done) {
        wantedErrorBody = { standard: 'no', alert: 'This is a crazy error' };
        fakeRestAPI.failOnNextRequest(wantedErrorBody);
        helper.makeRequest(requestOptions)
        .then(function (resp) {
          response = resp;
          return response.body.read()
          .then(function (jsonBody) {
            body = JSON.parse(jsonBody);
          });
        })
        .then(done, done);
      });

      it('responses successfully', function () {
        expect(response).to.have.property('status', 200);
        expect(response.headers).to.have.property('content-type', expectedContentType);
      });

      it('response with the specified body', function () {
        expect(body).to.deep.equal(wantedErrorBody);
      });
    });
  });

  describe('and the next request', function () {
    var response, body;

    before(function (done) {
      helper.makeRequest(requestOptions)
      .then(function (resp) {
        response = resp;
        return response.body.read()
        .then(function (jsonBody) {
          body = JSON.parse(jsonBody);
        });
      })
      .then(done, done);
    });

    it('responses successfully', function () {
      expect(response).to.have.property('status', 200);
      expect(response.headers).to.have.property('content-type', expectedContentType);
    });

    it('responses with error "false"', function () {
      expect(body).to.have.property('error', false);
    });

    it('responses with any property more', function () {
      expect(body).to.deep.equal({ error: false });
    });
  });
});
