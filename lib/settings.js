require("./overrides") // just to get the overriden functions into
    // their object's prototypes.

exports.platform = null
// Get the correct library for information handling.
switch (process.platform) {
    case "linux":
    case "linux2":
    case "linux3":
        exports.platform = require("./linux")
        break
    case "darwin":
        exports.platform = require("./osx")
        break
    case "windows":
        exports.platform = require("./windows")
        break
}

// Every five minutes
exports.SYNC_INTERVAL = 300

// Every 2 seconds
// Do NOT set this at less than one second.
exports.POLLING_INTERVAL = 2000

// 90 seconds
exports.IDLE_TIME = 90000