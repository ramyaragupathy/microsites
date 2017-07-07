#!/usr/bin/env bash
set -e # halt script on error

# If this is the deploy branch, push it up to gh-pages
echo "Get ready, we're pushing to gh-pages!"
cd _site

SSH_REPO="git@github.com:${TRAVIS_REPO_SLUG}.git"
SHA=`git rev-parse --verify HEAD`

# init the repo
git init
git config user.name "Travis-CI"
git config user.email "travis@somewhere.com"
git add .
git commit -m "CI deploy to master ${SHA}"
git show-ref

# get deploy key
ENCRYPTED_KEY_VAR="encrypted_${ENCRYPTION_LABEL}_key"
ENCRYPTED_IV_VAR="encrypted_${ENCRYPTION_LABEL}_iv"
ENCRYPTED_KEY=${!ENCRYPTED_KEY_VAR}
ENCRYPTED_IV=${!ENCRYPTED_IV_VAR}
openssl aes-256-cbc -K $ENCRYPTED_KEY -iv $ENCRYPTED_IV -in ../.build_scripts/deploy_key.enc -out deploy_key -d
chmod 600 deploy_key
eval `ssh-agent -s`
ssh-add deploy_key

git push --force --quiet $SSH_REPO master:gh-pages
