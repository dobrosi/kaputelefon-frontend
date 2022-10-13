#!/bin/sh

build() {
  echo "var version = '$fev';" > src/script/version.js

  git pull
  
  npm install -g gulp-cli
  npm install gulp --save-dev
  npm i gulp-inline-source

  gulp inlinesource

  gzip -f < target/index.html > target/ui-${fev}.gz

  git config --global user.email "dobrosi@gmail.com"
  git config --global user.name "Travis CI"
  git tag "kaputelefon-frontend-$fev"
}

build
