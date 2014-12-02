var fs = require("fs")
var restify = require("restify")
var Package = require("./lib/package")
var port = Number(process.env.PORT || 8080)
var urlPattern = /\/(.*)@(\d+\.\d+\.\d+)\/(.*)/ // {name}@{version}/{filepath}

function respond(req, res, next) {
  var name =    req.params[0]
  var version = req.params[1]
  var file =    req.params[2]
  var pkg = new Package(name, version)
  pkg.streamFile(file, function(err, stream) {
    stream.pipe(res)
    next()
  })
}

var server = restify.createServer()
server.get(urlPattern, respond)
server.head(urlPattern, respond)

server.listen(port, function() {
  console.log("%s listening at %s", server.name, server.url);
});
