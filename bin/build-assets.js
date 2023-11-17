#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const assetsFile = path.resolve(process.argv[2] || 'build-assets.json');
const rootDir = path.dirname(assetsFile);

const assetsData = JSON.parse(fs.readFileSync(assetsFile, { encoding: 'utf8' }));

const assetsDir = path.join(rootDir, assetsData.directory || 'assets');

if(!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

const assets = assetsData.assets;

function saveAsset(fileName, varName, value) {
  fs.writeFileSync(path.join(assetsDir, fileName), `const ${varName} = ${JSON.stringify(value)};\nexport default ${varName};\n`);
}

for(const asset of assets) {
  if(asset.type == 'version' && assets.packageJson) {
    const packageJsonFile = path.join(rootDir, assetsData.packageJson);
    const version = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8')).version;
    const assetName = asset.name || 'version';

    saveAsset(asset.outputFileName || `${assetName}.mjs`, assetName, version);
  } else if(asset.inputFileName && asset.name) {
    const data = fs.readFileSync(path.join(rootDir, asset.inputFileName), 'utf8');
    saveAsset(asset.outputFileName || `${asset.name}.mjs`, asset.name, data);
  }
}
