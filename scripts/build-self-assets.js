#!/usr/bin/env node

const path = require('path');

const buildAssets = require('../src/build-assets');

const assetsFile = path.join(__dirname, '../build-assets.json');
buildAssets(assetsFile);
