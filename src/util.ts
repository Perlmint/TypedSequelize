import * as ts from "typescript";

export function tsTypeToString(t: ts.Type, associated: boolean = false) : string {
    var typename = _tsTypeToString(t);
    if (associated) {
        typename = typename.replace(/(\[])?$/, "Interface$&");
    }
    return typename;
}

function _tsTypeToString(t: ts.Type): string {
    if (t.flags & ts.TypeFlags.String) {
        return "string";
    }
    if (t.flags & ts.TypeFlags.Number) {
        return "number";
    }
    if (t.flags & ts.TypeFlags.Boolean) {
        return "boolean";
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
