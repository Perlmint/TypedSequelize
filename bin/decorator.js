"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
function internal() {
    return Reflect.metadata("internal", true);
}
exports.internal = internal;
// first one is default type
var DBTypes;
(function (DBTypes) {
    // boolean
    DBTypes[DBTypes["Boolean"] = 0] = "Boolean";
    // number
    DBTypes[DBTypes["Int"] = 1] = "Int";
    DBTypes[DBTypes["Smallint"] = 2] = "Smallint";
    DBTypes[DBTypes["Integer"] = 3] = "Integer";
    DBTypes[DBTypes["Tinyint"] = 4] = "Tinyint";
    DBTypes[DBTypes["Mediumint"] = 5] = "Mediumint";
    DBTypes[DBTypes["Bigint"] = 6] = "Bigint";
    DBTypes[DBTypes["Year"] = 7] = "Year";
    DBTypes[DBTypes["Float"] = 8] = "Float";
    DBTypes[DBTypes["Double"] = 9] = "Double";
    DBTypes[DBTypes["Decimal"] = 10] = "Decimal";
    // Date
    DBTypes[DBTypes["Datetime"] = 11] = "Datetime";
    DBTypes[DBTypes["Timestamp"] = 12] = "Timestamp";
    DBTypes[DBTypes["Date"] = 13] = "Date";
    // Buffer
    DBTypes[DBTypes["Blob"] = 14] = "Blob";
    DBTypes[DBTypes["Tinyblob"] = 15] = "Tinyblob";
    DBTypes[DBTypes["Mediumblob"] = 16] = "Mediumblob";
    DBTypes[DBTypes["Longblob"] = 17] = "Longblob";
    DBTypes[DBTypes["Binary"] = 18] = "Binary";
    DBTypes[DBTypes["Varbinary"] = 19] = "Varbinary";
    DBTypes[DBTypes["Bit"] = 20] = "Bit";
    // String
    DBTypes[DBTypes["Varchar"] = 21] = "Varchar";
    DBTypes[DBTypes["Char"] = 22] = "Char";
    DBTypes[DBTypes["Tinytext"] = 23] = "Tinytext";
    DBTypes[DBTypes["Mediumtext"] = 24] = "Mediumtext";
    DBTypes[DBTypes["Longtext"] = 25] = "Longtext";
    DBTypes[DBTypes["Text"] = 26] = "Text";
    DBTypes[DBTypes["Enum"] = 27] = "Enum";
    DBTypes[DBTypes["Set"] = 28] = "Set";
    DBTypes[DBTypes["Time"] = 29] = "Time";
    DBTypes[DBTypes["Geometry"] = 30] = "Geometry";
})(DBTypes = exports.DBTypes || (exports.DBTypes = {}));
exports.DefaultDBType = new Map([
    ["string", DBTypes.Varchar],
    ["number", DBTypes.Int],
    ["Date", DBTypes.Datetime],
    ["Buffer", DBTypes.Blob],
    ["boolean", DBTypes.Boolean]
]);
exports.SequelizeMap = (() => {
    let ret = {};
    ret[DBTypes.Boolean] = 'BOOLEAN';
    ret[DBTypes.Smallint] = 'INTEGER';
    ret[DBTypes.Int] = 'INTEGER';
    ret[DBTypes.Integer] = 'INTEGER';
    ret[DBTypes.Tinyint] = 'INTEGER(1)';
    ret[DBTypes.Mediumint] = 'INTEGER';
    ret[DBTypes.Bigint] = 'BIGINT';
    ret[DBTypes.Year] = 'INTEGER';
    ret[DBTypes.Float] = 'FLOAT';
    ret[DBTypes.Double] = 'REAL';
    ret[DBTypes.Decimal] = 'DECIMAL';
    ret[DBTypes.Timestamp] = 'DATE';
    ret[DBTypes.Date] = 'DATE';
    ret[DBTypes.Datetime] = 'DATE';
    ret[DBTypes.Tinyblob] = 'BLOB(\'tiny\')';
    ret[DBTypes.Mediumblob] = 'BLOB(\'medium\')';
    ret[DBTypes.Longblob] = 'BLOB(\'long\')';
    ret[DBTypes.Blob] = 'BLOB';
    ret[DBTypes.Binary] = 'BLOB';
    ret[DBTypes.Varbinary] = 'BLOB';
    ret[DBTypes.Bit] = 'BLOB';
    ret[DBTypes.Char] = 'STRING';
    ret[DBTypes.Varchar] = 'STRING';
    ret[DBTypes.Tinytext] = 'TEXT(\'tiny\')';
    ret[DBTypes.Mediumtext] = 'TEXT(\'medium\')';
    ret[DBTypes.Longtext] = 'TEXT(\'long\')';
    ret[DBTypes.Text] = 'TEXT';
    ret[DBTypes.Enum] = 'STRING';
    ret[DBTypes.Set] = 'STRING';
    ret[DBTypes.Time] = 'STRING';
    ret[DBTypes.Geometry] = 'GEOMETRY';
    return ret;
})();
function concreteType(t) {
    return Reflect.metadata("ConcreteType", t);
}
exports.concreteType = concreteType;
function embededField() {
    return Reflect.metadata("EmbededField", null);
}
exports.embededField = embededField;
function primaryKey() {
    return Reflect.metadata("PrimaryKey", null);
}
exports.primaryKey = primaryKey;
function arrayJoinedWith(seperator) {
    return Reflect.metadata("arrayJoinedWith", seperator);
}
exports.arrayJoinedWith = arrayJoinedWith;
function rpc(path) {
    return Reflect.metadata("rpc", path);
}
exports.rpc = rpc;
function find(query) {
    return null;
}
exports.find = find;
function findOne(query) {
    return null;
}
exports.findOne = findOne;
function model() {
    return Reflect.metadata("Model", null);
}
exports.model = model;
function index(name, uniq) {
    return Reflect.metadata("Index", name);
}
exports.index = index;
//# sourceMappingURL=decorator.js.map