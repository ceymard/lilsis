if (!require('streamline/module')(module)) return;

var logs = require("./logs")
var settings = require("./settings")

var platform = settings.platform

/**
    Start the polling of the activity of the user.
**/
exports.startMonitoring = function(_) {
    var last = new Date()
    var total = 0
    var last_info = null

    function _do(_) {
        try {
            var now = new Date()

            var info = platform.getActiveWindowInfo(_)
            var idle = platform.getIdleTime(_)

            // time of more than 90s of inactivity doesn't get logged
            if (idle < settings.IDLE_TIME)
                total += now.getTime() - last.getTime()

            last = now

            // If we just changed window, log the time spent in the given window and start
            // logging the time we are now spending in the new window
            if (!last_info || last_info.title != info.title) {
                if (last_info) {
                    logs.getCurrentLogger(_).log({
                        "title": last_info.title,
                        "command": last_info.command,
                        "duration": Math.ceil(total / 1000),
                        "timestamp": now.getTime()
                    })

                    total = 0 // We reset the counter
                }

                last_info = info
            }

            // Continue execution.
            setTimeout(_do, settings.POLLING_INTERVAL)
        } catch (e) {
            console.log(e)
        }
    }

    _do(_)
}
