#!/usr/bin/env bash
set -e # halt script on error

if [ $TRAVIS_PULL_REQUEST = "false" ] && [ $TRAVIS_BRANCH = ${STAGING_BRANCH} ]; then
	echo "Building site"
	node_modules/.bin/gulp stage
elif [ $TRAVIS_PULL_REQUEST = "false" ] && [ $TRAVIS_BRANCH = ${PRODUCTION_BRANCH} ]; then
	echo "Building site"
	node_modules/.bin/gulp prod
else
	echo "Not building"
fi