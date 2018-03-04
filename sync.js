const chokidar = require('chokidar');
const fs = require('fs');
const fse = require('fs-extra');
const path = require("path");
const ignore = require('ignore');
const os = require('os');


function start() {
  const args = process.argv.slice(2);
  initializeWatcher.apply(null, args);
}

function initializeWatcher(source, target, ignoreFilesSource = '.gitignore') {
  const sourceExists = fse.pathExistsSync(source);
  if(!sourceExists) {
    console.error('Source does not exists.');
    return;
  }
  try {
    console.log('Initializating sync', source, 'to', target);
    const filesToIgnore = getFilesToIgnore(ignoreFilesSource).concat(ignoreFilesSource);
    const ig = ignore().add(filesToIgnore);
    const watcher = chokidar
      .watch(source, {
        persistent: true,
        ignored: new RegExp(filesToIgnore.join('|'))
      })
      .on("ready", watcherReady())
      .on("error", watcherError())
      .on("add", watcherCopy(source, target, ig))
      .on("addDir", watcherCopy(source, target, ig))
      .on("change", watcherCopy(source, target, ig))
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
    const targetPath = path.join(target, path.relative(source, file));
    copy(file, targetPath, ignore);
  };
}

function watcherRemove(source, target) {
  return (file) => remove(path.join(target, path.relative(source, file)));
}

function copy(source, target, ig) {
  if(!shouldCopy(ig, source)) return;
  try {
    fse.copySync(source, target);
    console.log('coppied:', source, ' --> ', target);  
  } 
  catch (e) {
    console.log('copying failed with error code ', e.code);
  }
}

function remove(file) {
  try {
    fse.removeSync(file);
    console.log('removed', file);
  } catch (e) {
    console.log('error', e);
  }
}

function shouldCopy(ig, src) { 
  return (!isDirectory(src) && !ig.ignores(src));
}

function isDirectory(path) {
  try {
    return fs.lstatSync(path).isDirectory();
  } catch(e) {
    return false;
  }
}

function getFilesToIgnore(filename) {
  try {
    return fse
      .readFileSync(filename)
      .toString()
      .split(os.EOL)
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