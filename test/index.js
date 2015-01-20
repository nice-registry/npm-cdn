var assert = require("assert")
var fs = require("fs")
var path = require("path")
var rimraf = require("rimraf")
var supertest = require("supertest")
var Package = require("../lib/package")
var app = require("../server")

describe("Package", function() {
  var pkg

  beforeEach(function() {
    pkg = new Package("ghwd", "1.0.0")
  })

  afterEach(function(done) {
    rimraf(pkg.directory, done)
  })

  it("has a name property", function() {
    assert.equal(pkg.name, "ghwd")
  })

  it("has a version property", function() {
    assert.equal(pkg.version, "1.0.0")
  })

  it("has a directory property based on name and version", function() {
    assert.equal(pkg.directory, "/tmp/npm-cdn/ghwd/1.0.0")
  })

  it("has a tarball_url property based on name and version", function() {
    assert.equal(pkg.tarball_url, "http://registry.npmjs.org/ghwd/-/ghwd-1.0.0.tgz")
  })

  it("downloads files", function(done) {
    assert(!pkg.is_cached)
    pkg.download(function(e){
      assert(!e)
      assert(pkg.is_cached)
      assert(fs.existsSync(path.join(pkg.directory, "package", "package.json")))
      done()
    })
  })

  it("streams files", function(done) {
    this.timeout(5000)
    pkg.streamFile("package.json", function(err, stream) {
      stream.on("data", function(data) {/* noop */})
      stream.on("end", done)
    })
  })

  it("handles missing files", function(done) {
    pkg.streamFile("nope.json", function(err, stream) {
      assert(err)
      assert(!stream)
      done()
    })
  })

  it("returns directory tree if file is blank", function(done) {
    pkg.streamFile("", function(err, stream) {
      assert(stream)
      assert(JSON.parse(stream).length)
      done()
    })
  })

})

describe("server", function() {

  it("returns 200 for files that exist", function(done) {
    supertest(app)
      .get("/schemeless@1.1.0/package.json")
      .expect(200, done)
  })

  it("returns 404 for files that don't", function(done) {
    supertest(app)
    .get("/schemeless@1.1.0/nope.json")
    .expect(404, done)
  })

})
