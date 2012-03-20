
exports.Timer = function() {
    this.last = new Date()
}
var Timer = exports.Timer


Timer.prototype.time = function () {
    var now = new Date()

    return now.getTime() - this.last.getTime()
}


Timer.prototype.reset = function () {
    this.last = new Date()
}
