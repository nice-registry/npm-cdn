var fmt = require("util").format
var request = require("request")
var tar = require("tar-fs")
var fs = require("fs")
var glob = require("glob")
var path = require("path")
var cachedir = "/tmp/npm-cdn"

var Package = module.exports = function Package(name, version, opts) {
  this.name = name
  this.version = version
  this.opts = opts
};

Package.prototype = {
  get directory() {
    return path.resolve(cachedir, this.name, this.version)
  },
  get tarball_url() {
    return fmt("http://registry.npmjs.org/%s/-/%s-%s.tgz", this.name, this.name, this.version)
  },
  get is_cached() {
    return fs.existsSync(this.directory)
  }
}

Package.prototype.download = function(callback) {
  var _this = this
  request(this.tarball_url)
  .pipe(require("zlib").createGunzip())
  .pipe(tar.extract(this.directory))
  .on("finish", function(err) {
    if (err) return callback(err)
    _this.buildFileTree(callback)
  })
  .on("error", callback)
}

Package.prototype.buildFileTree = function(callback) {
  var _this = this
  var finder = require('findit')(_this.directory)
  _this.files = []

  finder.on('file', function (file, stat) {
    _this.files.push(file.replace(_this.directory + "/package/", ""))
  });

  finder.on('end', function () {
    // TODO write ___index.json and ___index.html
    return callback(null)
  });
}

Package.prototype.streamFile = function(filename, callback) {
  var _this = this

  var file = path.resolve(this.directory, "package", filename)

  if (this.is_cached) {

    if (!filename) {
      return callback(null, JSON.stringify(this.files))
    }

    if (!fs.existsSync(file)) {
      return callback(new Error("File not found: " + file))
    }
    return callback(null, fs.createReadStream(file))
  }

  this.download(function(err) {
    if (err) return callback(err);

    if (!filename) {
      return callback(null, JSON.stringify(_this.files))
    }

    if (!fs.existsSync(file)) {
      return callback(new Error("File not found: " + file))
    }
    return callback(null, fs.createReadStream(file))
  })
}
