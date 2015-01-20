var fs = require("fs")
var restify = require("restify")
var Package = require("./lib/package")
var port = Number(process.env.PORT || 8080)
var urlPattern = /\/(.*)@(\d+\.\d+\.\d+)\/(.*)/ // {name}@{version}/{filepath}

function serveFile(req, res, next) {
  var name    = req.params[0]
  var version = req.params[1]
  var file    = req.params[2]
  var pkg     = new Package(name, version)
  pkg.streamFile(file, function(err, stream) {
    if (err) return res.send(404, {error: err})
    stream.pipe(res)
    next()
  })
}

var server = module.exports = restify.createServer()
server.get(urlPattern, serveFile)
server.head(urlPattern, serveFile)

server.listen(port, function() {
  console.log("%s listening at %s", server.name, server.url);
});
