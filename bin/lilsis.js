#!/usr/bin/env node

var opt = require("optimist")
    .options('c', {
        alias: 'client-only',
        default: false
    })
    .options('w', {
        alias: 'web-only',
        default: false
    })
var argv = opt.argv

var lilsis = require("lilsis")

// Only start the client
if (!argv.w) {
    console.log("Starting monitoring.")
    lilsis.startMonitoring(function(err, stat) {})
}

// Only start the webserver.
if (!argv.c) {
    lilsis.startWebServer()
}