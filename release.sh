#!/bin/bash

npm run zip
version=$(node -p "require('./package.json').version")
zip=".output/samay-${version}-chrome.zip"
gh release create "v${version}" $zip
