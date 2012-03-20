if (!require('streamline/module')(module)) return;

var fs = require("fs")
var path = require("path")
var util = require("util")

var Timer = require("./timer").Timer
var settings = require("./settings")

var STAMP = 0,
    DURATION = 1,
    TITLE = 2,
    PROCESS = 3,
    TAGS = 4

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
}


/**

**/
exports.Logger = function (path, data) {
    if (path instanceof Date) {
        // FIXME: get the path for the given date.
        path = this.getPathForDate(path)
    }

    if (!data) {
        this._cache = {
            header: {
                version: "0.1",
                date: null
            },
            tags: [],
            namevalues: [],
            logs: []
        }
    } else {
        this._cache = data
    }

    var now = new Date()

    this.timer = new Timer()
    this.stamp = new Date(now.getFullYear(), now.getMonth(), now.getDate())
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
    Name/value store for the current log of window titles and
    process names.
**/
Logger.prototype.getNameValue = function(name) {
    var index = this._cache.namevalues[name]
    if (!index) {
        this._cache.namevalues.push(name)
        index = this._cache.namevalues[name] = this._cache.namevalues.length - 1
    }
    return index
}

/**
    Add a log entry to the cache, and sync it to the hard
    drive every x minutes.
**/
Logger.prototype.log = function(infos) {
    var l = this._cache.logs

    var to_store = [
        Math.ceil((infos.timestamp - this.stamp) / 1000),
        infos.duration,
        this.getNameValue(infos.title),
        this.getNameValue(infos.command),
    ]

    // We want the log entries to be as contiguous as possible, so that
    // the stamp + duration of the last entry is exactly equal to the stamp
    // of the new entry.
    // The only time where we're not interested in adjusting the logs is when
    // the new timestamp is beyond the idle limit.
    if (l.length > 0) {
        var last_end = l[l.length - 1]

        // We tolerate 10 seconds of difference; it could be more, but in practice this
        // should not really happen.
        if (Math.abs(last_end[STAMP] + last_end[DURATION] - to_store[STAMP]) < 10) {
            last_end[DURATION] = to_store[STAMP] - last_end[STAMP]
        }
    }

    l.push(to_store)

    // Only save every SYNC_INTERVAL seconds, to avoid constantly rewriting the file
    // on the disk.
    //if (this.timer.time() > settings.SYNC_INTERVAL) {
    //    this.timer.reset()
        process.nextTick(this.save.bind(this))
    //}

    return this
}

/**
    Dichotomic search of an entry by its timestamp
    value.
**/
Logger.prototype.getIndexOfEntry = function(stamp) {
    var l = this._cache.logs
    var i = Math.floor(l.length / 2)
    var lower = 0
    var upper = l.length - 1

    while (true) {
        if (l[i][STAMP] < stamp) {
            lower = i
            i = Math.floor((upper - lower) / 2)
        }
        if (l[i][STAMP] > stamp) {
            upper = i
            i = Math.floor((upper - lower) / 2)
        }
        if (lower == upper && i == lower && l[i][STAMP] != stamp)
            return -1
        return i // They are equal.
    }
}

/**
    Tag a range of entries in the log.
    `from` and `to` are timestamps. Everything between them inclusive
    will have the given tag added.
**/
Logger.prototype.rangeMap = function(from, to, fn) {
    var i = this.getIndexOfEntry(from)
    var l = this._cache.logs
    var _ref = null

    if (i == -1) throw new Error("No such entry for start range")

    for (; i < l.length; i++) {
        _ref = l[i]
        l[i] = fn(_ref) || _ref

        if (_ref[STAMP] == to)
            break
    }
    // FIXME
}

Logger.prototype.rangeAddTag = function(from, to, tag) {
    tag = this._cache.tags[tag]

    if (!tag) {
        this._cache.tags.push(tag)
        tag = this._cache.tags[tag] = this._cache.tags.length - 1
    }

    this.rangeMap(from, to, function(elt) {
        if (!elt[TAGS])
            elt[TAGS] = []
        t = elt[TAGS]

        if (t.indexOf(tag) == -1) // Add only if not already present
            t.push(tag)
    })
}


Logger.prototype.rangeRemoveTag = function(from, to, tag) {
    tag = this._cache.tags[tag]
    if (!tag) return

    this.rangeMap(from, to, function (elt) {
        var _t = elt[TAGS]
        var _i = -1

        // Remove the tag if present in the tags
        if (t && (_i = t.indexOf(tag)) != -1)
            elt[TAGS] = _t.splice(i, 1)
    })
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
    var i = 0

    try {
        var filecontents = fs.readFile(this.path, "utf-8", _)
        // We restore the file.
        this._cache = JSON.parse(filecontents)
        var nm = this._cache.namevalues
        var tags = this._cache.tags

        // Restoring the namevalues.
        for (i = 0; i < nm.length; i++)
            nm[nm[i]] = i

        // Restoring the cache on the tag names.
        for (i = 0; i < tags.length; i++)
            tags[tags[i]] = i

    } catch(e) {
        // Nothing to see, we just can't load something that doesn't
        // exist.
    }

    return this
}


/**
    Compute the metadata on the whole logs.

    Metadatas are the aggregation of the tags values.

    The structure of the metadata is as follow ->

    version: 0.1
    total:
        tag1: 39284
        tag2: 3984
    total_untagged: 3940
    history:
        tag1: [ [39483, 49], [38493, 42], [39483, 492] ]
        ...
    history_untagged: [ [3939, 493], ... ]

    Where
    * `total` is an object containing the total time spent in seconds for
    each tag.
    * `total_untagged` is the total time spent in entries that have no tags
    * `history` is an object with for each tags as keys a list of [seconds since start of day, duration]
    * `history_untagged` is the same, but for entries that have no tags.

    Tags are "squashed" in their history: two contiguous entries that have the same tags
    are condensed into one, if the timestamp + the duration of the first one equals the
    timestamp of the following entry.



**/
Logger.prototype.computeAggregate = function() {
    var res = {
        version: "0.1",
        total: {},
        total_untagged: 0,
        history: {},
        history_untagged: 0
    }

    // Last tags timestamp and durations, used to know if we're
    // going to "squash" entries into one.
    var ltt = {}

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
        _currentLogger = new Logger(now).load(_)
    }

    return _currentLogger
}
var _currentLogger = null
