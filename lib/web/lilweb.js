var express = require("express")
var jinjs = require("jinjs")
var parse_pwilang = require("pwilang").parse

jinjs.registerExtension(".niml")

exports.startWebServer = function() {
    var app = express.createServer()

    console.log("Starting webserver.")

    app.set('views', __dirname + '/views');
    app.set('view options', {
        layout: false,
        jinjs_pre_compile: function (str) {
            return parse_pwilang(str);
        }
    })
    app.set('view engine', 'jinjs')

    app.get('/', function(req, res){
        console.log(req)
        res.render('base', {

        })
    })

    app.listen(3000);

}