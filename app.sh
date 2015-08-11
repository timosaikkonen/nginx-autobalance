#!/bin/bash
cd /usr/src/app
/etc/init.d/nginx start
forever -f index.js