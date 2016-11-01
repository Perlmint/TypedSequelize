/// <reference path="../typings/index.d.ts" />
"use strict";
require("reflect-metadata");
function internal() {
    return Reflect.metadata("internal", true);
}
exports.internal = internal;
// first one is default type
(function (DBTypes) {
    // boolean
    DBTypes[DBTypes["Tinyint"] = 0] = "Tinyint";
    // number
    DBTypes[DBTypes["Int"] = 1] = "Int";
    DBTypes[DBTypes["Smallint"] = 2] = "Smallint";
    DBTypes[DBTypes["Integer"] = 3] = "Integer";
    DBTypes[DBTypes["Mediumint"] = 4] = "Mediumint";
    DBTypes[DBTypes["Bigint"] = 5] = "Bigint";
    DBTypes[DBTypes["Year"] = 6] = "Year";
    DBTypes[DBTypes["Float"] = 7] = "Float";
    DBTypes[DBTypes["Double"] = 8] = "Double";
    DBTypes[DBTypes["Decimal"] = 9] = "Decimal";
    // Date
    DBTypes[DBTypes["Datetime"] = 10] = "Datetime";
    DBTypes[DBTypes["Timestamp"] = 11] = "Timestamp";
    DBTypes[DBTypes["Date"] = 12] = "Date";
    // Buffer
    DBTypes[DBTypes["Blob"] = 13] = "Blob";
    DBTypes[DBTypes["Tinyblob"] = 14] = "Tinyblob";
    DBTypes[DBTypes["Mediumblob"] = 15] = "Mediumblob";
    DBTypes[DBTypes["Longblob"] = 16] = "Longblob";
    DBTypes[DBTypes["Binary"] = 17] = "Binary";
    DBTypes[DBTypes["Varbinary"] = 18] = "Varbinary";
    DBTypes[DBTypes["Bit"] = 19] = "Bit";
    // String
    DBTypes[DBTypes["Varchar"] = 20] = "Varchar";
    DBTypes[DBTypes["Char"] = 21] = "Char";
    DBTypes[DBTypes["Tinytext"] = 22] = "Tinytext";
    DBTypes[DBTypes["Mediumtext"] = 23] = "Mediumtext";
    DBTypes[DBTypes["Longtext"] = 24] = "Longtext";
    DBTypes[DBTypes["Text"] = 25] = "Text";
    DBTypes[DBTypes["Enum"] = 26] = "Enum";
    DBTypes[DBTypes["Set"] = 27] = "Set";
    DBTypes[DBTypes["Time"] = 28] = "Time";
    DBTypes[DBTypes["Geometry"] = 29] = "Geometry";
})(exports.DBTypes || (exports.DBTypes = {}));
var DBTypes = exports.DBTypes;
exports.DefaultDBType = new Map([
    ["string", DBTypes.Varchar],
    ["number", DBTypes.Int],
    ["Date", DBTypes.Datetime],
    ["Buffer", DBTypes.Blob],
    ["boolean", DBTypes.Tinyint]
]);
exports.SequelizeMap = (() => {
    let ret = {};
    ret[DBTypes.Tinyint] = 'INTEGER(1)';
    ret[DBTypes.Smallint] = 'INTEGER';
    ret[DBTypes.Int] = 'INTEGER';
    ret[DBTypes.Integer] = 'INTEGER';
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
