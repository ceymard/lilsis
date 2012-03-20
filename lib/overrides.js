/**
    Just a small override of String, which gives it a format
    method that looks like Python's.

    @return The new string.
**/
String.prototype.format = (function() {

    var re_nb = /\{\d+\}/g
    var re_ident = /\{[^\}]+\}/g

    function format() {
        var args = arguments
        return this.replace(re_nb, function(m) {
                // Replace {0}, {1}
                m = m.slice(1, -1) // Removing { and }
                return args[m].toString()
            }).replace(re_ident, function(m) {
                // Replace {ident}
                m = m.slice(1, -1) // Removing { and }
                return args[0][m].toString()
            })
    }

    return format

})()
