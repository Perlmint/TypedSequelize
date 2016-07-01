"use strict";
/// <reference path="../typings/index.d.ts" />
const ts = require("typescript");
function tsTypeToString(t) {
    switch (t.flags) {
        case ts.TypeFlags.String:
            return "string";
        case ts.TypeFlags.Boolean:
            return "boolean";
        case ts.TypeFlags.Number:
            return "number";
        case ts.TypeFlags.Enum:
            return "number";
        default:
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
}
exports.tsTypeToString = tsTypeToString;
