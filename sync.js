const chokidar = require('chokidar');
const fs = require('fs');
const fse = require('fs-extra');
const path = require("path");
const ignore = require('ignore');
const os = require('os');


function start() {
  const args = process.argv.slice(2);
  initializeWatcher(...args);
}

function initializeWatcher(source, target, gitignoreFileName = '.gitignore') {
  const sourceExists = fse.pathExistsSync(source);
  if(!sourceExists) {
    console.error('Source does not exists.');
    return;
  }
  try {
    console.log('Initializating sync', source, 'to', target);
    const gitignorePath = path.join(source, gitignoreFileName);
    const gitignoreParser = initializeGitIgnoreParser(gitignorePath);
    const watcher = chokidar
      .watch(source, { persistent: true })
      .on("ready", watcherReady())
      .on("error", watcherError())
      .on("add", watcherCopy(source, target, gitignoreParser))
      .on("addDir", watcherCopy(source, target, gitignoreParser))
      .on("change", watcherCopy(source, target, gitignoreParser))
      .on("unlink", watcherRemove(source, target))
      .on("unlinkDir", watcherRemove(source, target));
  }
  catch(e) {
    console.log(e);
  }
}

function watcherReady() {
  return () => console.log('Sync is ready.');
}

function watcherError() {
  return (e) => console.log(e);
}

function watcherCopy(source, target, ignore) {
  return (file) => {
    const relativeFilePath = path.relative(source, file);
    const targetPath = path.join(target, relativeFilePath);
    copy(file, targetPath, relativeFilePath, ignore);
  };
}

function watcherRemove(source, target) {
  return (file) => remove(path.join(target, path.relative(source, file)));
}

function copy(source, target, relativeFilePath, ig) {
  if(!shouldCopy(ig, source, relativeFilePath)) return;
  fse.copy(source, target, err => {
    if(err) {
      return console.log('copying failed with error code ', err.code);
    }
    console.log('coppied:', source, ' --> ', target); 
  });
}

function remove(file) {
  fse.remove(file, err => {
    if(err) {
      console.log('error', e);
    }
    console.log('removed', file);
  });
}

function shouldCopy(ig, src, relativeFilePath) { 
  return (!isDirectory(src) && !ig.ignores(relativeFilePath));
}

function isDirectory(path) {
  try {
    return fs.lstatSync(path).isDirectory();
  } catch(e) {
    return false;
  }
}

function initializeGitIgnoreParser(filepath) {
  const gitIgnorePatterns = getFilesToIgnore(filepath).concat(filepath);
  return ignore().add(gitIgnorePatterns);
}

function getFilesToIgnore(filepath) {
  try {
    return fse
      .readFileSync(filepath)
      .toString()
      .split('\n')
      .filter(isPath)
      .map(row => row.trim())
  } catch(e) {
    console.log('Parsing', filename, 'failed. No single file is ignored.');
    return [];
  }
}

function isPath(str) {
  return !(str === '' || str.trim().startsWith('#'));
}

start();
