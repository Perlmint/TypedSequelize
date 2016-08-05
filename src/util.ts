/// <reference path="../typings/index.d.ts" />
import * as ts from "typescript";

export function tsTypeToString(t: ts.Type): string {
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
        let arrayt = <ts.TypeReference>t;
        return tsTypeToString(arrayt.typeArguments[0]) + "[]";
    default:
        return t.getSymbol().name;
    }
}
