if (!require('streamline/module')(module)) return;

var fs = require("fs")
var path = require("path")
var util = require("util")

var Timer = require("./timer").Timer
var settings = require("./settings")

function mkdirParent(dirPath, mode, _) {
    try {
        fs.mkdir(dirPath, mode, _)
    } catch (e) {
        if (e.errno == 34) { // Only recreate if it doesn't exist.
            mkdirParent(path.dirname(dirPath), mode, _)
            fs.mkdir(dirPath, mode, _)
        }
    }
    return
};


/**

**/
exports.Logger = function (path) {
    if (path instanceof Date) {
        // FIXME: get the path for the given date.
        path = this.getPathForDate(path)
    }

    this._cache = {
        header: {
            version: "0.1",
            date: null
        },
        logs: []
    }

    this.timer = new Timer()
    this.stamp = new Date()
    this.path = path
}

var Logger = exports.Logger

Logger.prototype.getPathForDate = function(date) {
    return "{base}/{user}/{year}/{month}/{day}.json".format({
        base: settings.platform.getDefaultPath(),
        user: settings.platform.getUserName(),
            // FIXME should be changed later by something
            // a little more dynamic

        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate()
    })
}

/**
    Add a log entry to the cache, and sync it to the hard
    drive every x minutes.
**/
Logger.prototype.log = function(infos) {

    var to_store = {
        s: infos.timestamp,
        d: infos.duration,
        t: infos.title,
        c: infos.command,
        a: [] // tags.
    }

    this._cache.logs.push(to_store)

    //if (this.timer.time() > settings.SYNC_INTERVAL) {
    //    this.timer.reset()
        process.nextTick(this.save.bind(this))
    //}

    return this
}


/**
    Save the file to the hard drive.
**/
Logger.prototype.save = function(_) {
    try {
        var toWrite = JSON.stringify(this._cache)
        // FIXME try to create dir recursively
        var dirname = path.dirname(this.path)
        mkdirParent(dirname, 0755, _)
        fs.writeFile(this.path, toWrite, _)
    } catch(e) {
        console.log(e)
    }

    return this
}

Logger.prototype.load = function (_) {
    try {
        var filecontents = fs.readFile(this.path, "utf-8", _)
        // We restore the file.
        this._cache = JSON.parse(filecontents)
    } catch(e) {
        // Nothing to see.
    }

    return this
}


/**
    Compute the metadata on the whole logs.

    Metadatas are the aggregation of the tags values.
**/
Logger.prototype.computeAggregate = function() {
    var tags = {}
    var calendar =

    this._cache.logs.forEach(function(elt) {

    })
}

/**
    Get the logger for the current user and the current day.
    The logger changes everyday at midnight, since we only dump
**/
exports.getCurrentLogger = function(_) {
    var now = new Date()

    // If there is no current logger, or if we are past midnight, we need
    // to instanciate a new one.
    if (!_currentLogger || _currentLogger.stamp.getDate() != now.getDate()) {
        _currentLogger = new Logger(now).load()
    }

    return _currentLogger
}
var _currentLogger = null
