var fmt = require("util").format
var request = require("request")
var tar = require("tar-fs")
var fs = require("fs")
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
  request(this.tarball_url)
  .pipe(require("zlib").createGunzip())
  .pipe(tar.extract(this.directory))
  .on("finish", callback)
  .on("error", callback)
}

Package.prototype.streamFile = function(filename, callback) {
  var file = path.resolve(this.directory, "package", filename)

  if (this.is_cached) {
    if (!fs.existsSync(file)) {
      return callback(new Error("File not found: " + file))
    }
    return callback(null, fs.createReadStream(file))
  }

  this.download(function(err) {
    if (err) return callback(err);
    if (!fs.existsSync(file)) {
      return callback(new Error("File not found: " + file))
    }
    return callback(null, fs.createReadStream(file))
  })
}
