if (!require('streamline/module')(module)) return;

var fs = require("fs")
var cp = require("child_process")
var ffi = require("node-ffi")

/**
    Declare the structure that will be used to get the result of the
    query to the xscreensaver library for idle times.
**/
var XScreenSaverInfo = ffi.Struct([
    ['ulong', 'window'],
    ['int',   'state'],
    ['int',   'kind'],
    ['ulong', 'since'],
    ['ulong', 'idle'],
    ['ulong', 'event_mask']
])

/**
    Bindings to the functions of the XLib we need.
**/
var xlib = ffi.Library("libX11", {
    "XOpenDisplay": ["pointer", ["string"]],
    "XDefaultRootWindow": ["ulong", ["pointer"]]
})

/**
    Bindings to the screensaver lib.
**/
var libxss = ffi.Library("libXss", {
    "XScreenSaverAllocInfo": ["pointer", []],
    "XScreenSaverQueryInfo": ["pointer", ["pointer", "ulong", "pointer"]]
})

// Get the current display
var display = xlib.XOpenDisplay(process.env.DISPLAY)

// Allocate the structure to get the idle results.
var xssinfo = libxss.XScreenSaverAllocInfo()

/**
    Get all the possible informations from the currently active window.
**/
exports.getActiveWindowInfo = function(_) {
    var wid = cp.execFile("xdotool", ["getactivewindow"], _)
    var title = cp.execFile("xdotool", ["getwindowname", wid.trim()], _).trim()
    var procid = cp.execFile("xprop", ["-id", wid, "_NET_WM_PID"], _).trim()
    procid = procid.split(" ")
    procid = procid[procid.length - 1]

    try {
    var cmdline = fs.readFile("/proc/" + procid + "/cmdline", "utf-8", _)
        .replace(/\u0000/g, " ")
        .trim()
    } catch(e) {
        cmdline = '-nocommand-'
    }

    return {
        "title": title,     // Window Title
        "command": cmdline  // Command line of the process
    } // Sending the current window name.
}

/**
    Get idle time as reported by the OS.
**/
exports.getIdleTime = function(_) {
    libxss.XScreenSaverQueryInfo(display, xlib.XDefaultRootWindow(display), xssinfo)
    // Actually wrap the result into a readable structure
    var sinfo = XScreenSaverInfo(xssinfo)
    return sinfo.idle
}


/**
    Get the base path where we will store the information.
**/
exports.getDefaultPath = function() {
    return "{home}/.config/lilsis".format({
        home: process.env.HOME
    })
}


/**
    Get the default user name.
**/
exports.getUserName = function() {
    return process.env.USER || "default"
}
