'use strict';

var expect = require('chai').expect;
var helper = require('./helper');
var FakeRestAPI = require('../index');

describe('An instance created with default parameters', function () {
  var fakeRestAPI;
  var expectedContentType = 'application/json; charset=utf-8';
  var requestOptions = {
    port: 0,
    headers: {
      'content-type': expectedContentType
    }
  };

  before(function (done) {
    fakeRestAPI = new FakeRestAPI();
    fakeRestAPI.start()
    .then(function () {
      requestOptions.port = fakeRestAPI.port;
    })
    .then(done, done);
  });

  after(function (done) {
    fakeRestAPI.stop().then(done, done);
  });

  describe('which it is specified with the 10 next responses', function () {
    var responses, requestsTypes;

    before(function (done) {
      var it = 0;

      requestsTypes = [];

      for (it = 0; it < 10; it++) {
        if (Math.random() < 0.5) {
          requestsTypes.push('ok');
          fakeRestAPI.setJSONForRequest({ status: 'ok' });
        } else {
          requestsTypes.push('error');
          fakeRestAPI.failOnNextRequest();
        }
      }

      helper.makeRequestBatch(requestOptions, 10)
      .then(function (resps) {
        responses = resps;
        return fakeRestAPI.waitForRequests(10)
        .thenResolve();
      }).then(done, done);
    });

    it('returns the 10 expected responses', function () {
      responses.forEach(function (response, idx) {
        expect(response).to.have.property('status', 200);
        expect(response.headers).to.have.property('content-type', expectedContentType);

        response.body.read(function (body) {
          body = JSON.parse(body);
          expect(body).to.have.property('status', requestsTypes[idx]);
        });
      });
    });
  });
});
