#!/bin/bash

if [ -f /.dockerinit ]; then
  nodejs node_modules/mocha/bin/mocha $@
else
  echo "ERROR: this script is not meant to be run directly. make sure you've got docker-compose set up and run 'npm test'."
  exit 1
fi;