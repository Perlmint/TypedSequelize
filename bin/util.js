"use strict";
/// <reference path="../typings/index.d.ts" />
const ts = require("typescript");
function tsTypeToString(t, associated = false) {
    var typename = _tsTypeToString(t);
    if (associated) {
        typename = typename.replace(/(\[])?$/, "Interface$&");
    }
    return typename;
}
exports.tsTypeToString = tsTypeToString;
function _tsTypeToString(t) {
    if (t.flags & ts.TypeFlags.String) {
        return "string";
    }
    if (t.flags & ts.TypeFlags.Boolean) {
        return "boolean";
    }
    if (t.flags & (ts.TypeFlags.Number | ts.TypeFlags.Enum)) {
        return "number";
    }
    switch (t.getSymbol().name) {
        case "Date":
            return "Date";
        case "Buffer":
            return "Buffer";
        case "Array":
            let arrayt = t;
            return tsTypeToString(arrayt.typeArguments[0]) + "[]";
        default:
            return t.getSymbol().name;
    }
}
