.PHONY: default lint test
PATH :=./node_modules/.bin/:$(PATH)

default: lint test

lint:
	jshint index.js
	jshint test

test:
	mocha -R spec
