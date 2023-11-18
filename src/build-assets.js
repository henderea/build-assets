const fs = require('fs');
const path = require('path');

module.exports = function buildAssets(assetsFile) {
  const rootDir = path.dirname(assetsFile);

  const assetsData = JSON.parse(fs.readFileSync(assetsFile, { encoding: 'utf8' }));

  const assetsDir = path.join(rootDir, assetsData.directory || 'assets');

  if(!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }

  const module = assetsData.module !== false;

  let extension = assetsData.extension || (module ? '.mjs' : '.js');
  if(!/^\./.test(extension)) {
    extension = `.${extension}`;
  }

  const assets = assetsData.assets;

  function saveAsset(fileName, varName, value) {
    let content;
    if(module) {
      content = `const ${varName} = ${JSON.stringify(value)};\nexport default ${varName};\n`;
    } else {
      content = `const ${varName} = ${JSON.stringify(value)};\nmodule.exports = ${varName};\n`;
    }
    fs.writeFileSync(path.join(assetsDir, fileName), content);
  }

  for(const asset of assets) {
    if(asset.type == 'version') {
      const packageJsonFile = path.join(rootDir, asset.packageJson || 'package.json');
      const version = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8')).version;
      const assetName = asset.name || 'version';

      saveAsset(asset.outputFileName || `${assetName}${extension}`, assetName, version);
    } else if(asset.inputFileName && asset.name) {
      const data = fs.readFileSync(path.join(rootDir, asset.inputFileName), 'utf8');
      saveAsset(asset.outputFileName || `${asset.name}${extension}`, asset.name, data);
    }
  }
};
