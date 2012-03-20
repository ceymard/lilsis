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

// Every half seconds
exports.POLLING_INTERVAL = 500

// 90 seconds
exports.IDLE_TIME = 90000