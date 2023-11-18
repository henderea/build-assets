#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const buildAssets = require('../src/build-assets');

const arg = require('arg');
const argHelper = require('@henderea/arg-helper');

const { argParser } = argHelper(arg);

const { HelpTextMaker, styles } = require('@henderea/simple-colors/helpText');
const { red, green, bold } = styles;

const version = require('../assets/version');

const helpText = new HelpTextMaker('build-assets')
  .wrap()
  .title.nl
  .pushWrap(4)
  .tab.text('A utility for building asset files, such as the version from package.json that can be imported into a package when bundled via a tool like ncc')
  .popWrap()
  .nl
  .nl
  .flags.nl
  .pushWrap(8)
  .dict
  .key.tab.flag('--assets-file', '-a').value.text('A reference to the file containing the asset definitions for build-assets. This is relative to the current working directory. The default value is build-assets.json.').end.nl
  .key.tab.flag('--validate').value.text(`Validate the assets json file and print out what will happen when build-assets is run.`).end.nl
  .nl
  .key.tab.flag('--help', '-h').value.text('Show this help text').end.nl
  .key.tab.flag('--version').value.text('Print out the version of build-assets').end.nl
  .endDict
  .popWrap()
  .nl
  .bold('NOTES:').nl
  .ul
  .tab.li.text('You should make sure to add the assets directory to your gitignore file').nl
  .tab.li.text('The assets created by this tool are mjs file and will have the content of the asset in a string as the default export.')
  .end
  .nl
  .nl
  .bold('Asset File Format').nl
  .ul
  .tab.li.text(`The assets file is a json file containing an object at the top level`).nl
  .tab.li.text('All paths in the assets file are relative to the directory that the assets file is in').nl
  .tab.li.text(`The top-level object can contain an optional field "directory" with the path to the assets output directory`).nl
  .tab.li.text(`The top-level object can contain an optional field "module" with a boolean value. Setting it to true (the default) will create a file with ESM syntax, with a default extension of '.mjs'. Setting it to false will create a file with CommonJS syntax, with a default extension of '.js'`).nl
  .tab.li.text(`The top-level object can contain an optional field "extension" with the extension to give to the output files. The default value is ".mjs" if "module" is true or omitted, or ".js" if "module" is set to false.`).nl
  .tab.li.text(`The top-level object`).space.bold('must').space.text(`contain an "assets" array`).nl
  .tab.li.text(`The "assets" array should be a list of objects containing information on each asset`).nl
  .tab.li.text(`All assets support fields of "name" and "outputFileName"`).nl
  .tab.tab.li.text(`The "name" field is a name to give the variable in the created asset JavaScript file. For the version number asset, it is optional and will default to "version". For all other assets, it is required.`).nl
  .tab.tab.li.text(`The "outputFileName" is an optional field that sets the output file name relative to the assets output directory. The default value is the "name" with the default extension.`).nl
  .tab.li.text(`To create an asset with the version from the package.json file, the object should have a field called "type" that has a value of "version". You can also set an optional "packageJson" field with the path to the package.json file. The default is to use "package.json" in the same directory as the asset file.`).nl
  .tab.li.text(`To create an asset with the content of a text file, the object should have a field called "inputFileName" that contains the path to the file that should be read in and exported as a string from the created asset.`).nl
  .end
  .nl
  .toString(Math.min(argParser.terminalWidth(0.6), 120));

let options = null;
try {
  options = argParser()
    .string('assetsFile', '--assets-file', '-a')
    .bool('validate', '--validate')
    .help(helpText, '--help', '-h')
    .withVersion(version, '--version')
    .argv;
} catch (e) {
  console.error(red.bright(`${bold('Error in arguments:')} ${e.message}`));
  process.exit(1);
}

const assetsFile = path.resolve(options.assetsFile || 'build-assets.json');
if(options.validate) {
  const assetsData = JSON.parse(fs.readFileSync(assetsFile, { encoding: 'utf8' }));

  const assetsDir = assetsData.directory || 'assets';

  const module = assetsData.module !== false;

  let extension = assetsData.extension || (module ? '.mjs' : '.js');
  if(!/^\./.test(extension)) {
    extension = `.${extension}`;
  }

  const assets = assetsData.assets;

  const errors = [];
  const results = [];

  for(const asset of assets) {
    if(asset.type == 'version') {
      const packageJsonFile = asset.packageJson || 'package.json';
      const assetName = asset.name || 'version';
      if(/[^a-zA-Z_$]/.test(assetName)) {
        errors.push(`For version asset, invalid "name" value "${assetName}"`);
      } else {
        results.push(`Create ${module ? 'an ESM' : 'a CJS'} asset at ${path.join(assetsDir, asset.outputFileName || `${assetName}${extension}`)} with the version number from ${packageJsonFile}`);
      }
    } else if(asset.inputFileName && asset.name) {
      if(/[^a-zA-Z_$]/.test(asset.name)) {
        errors.push(`For regular asset, invalid "name" value "${asset.name}"`);
      } else {
        results.push(`Create ${module ? 'an ESM' : 'a CJS'} asset at ${path.join(assetsDir, asset.outputFileName || `${asset.name}${extension}`)} with the text from ${asset.inputFileName}`);
      }
    } else {
      if(!asset.name) {
        errors.push(`For regular asset, missing the "name" field`);
        if(!asset.inputFileName) {
          errors.push(`For regular asset, missing the "inputFileName" field`);
        }
      } else {
        if(/[^a-zA-Z_$]/.test(asset.name)) {
          errors.push(`For regular asset, invalid "name" value "${asset.name}"`);
        }
        if(!asset.inputFileName) {
          errors.push(`For regular asset "${asset.name}", missing the "inputFileName" field`);
        }
      }
    }
  }

  if(errors.length > 0) {
    process.stdout.write(`${red.bright('Invalid!')}\n\n${errors.map((e) => `${bold('*')} ${red.bright(e)}`).join('\n')}\n\n`);
    process.exit(1);
  } else {
    process.stdout.write(`${green.bright('Valid')}\n\n${results.map((e) => `${bold('*')} ${e}`).join('\n')}\n\n`);
    process.exit(0);
  }
}

buildAssets(assetsFile);
