/// <reference path="../typings/index.d.ts" />

import "reflect-metadata";

export function internal() {
    return Reflect.metadata("internal", true);
}

// first one is default type
export enum DBTypes {
    // boolean
    Tinyint,

    // number
    Int,
    Smallint,
    Integer,
    Mediumint,
    Bigint,
    Year,
    Float,
    Double,
    Decimal,

    // Date
    Datetime,
    Timestamp,
    Date,

    // Buffer
    Blob,
    Tinyblob,
    Mediumblob,
    Longblob,
    Binary,
    Varbinary,
    Bit,

    // String
    Varchar,
    Char,
    Tinytext,
    Mediumtext,
    Longtext,
    Text,
    Enum,
    Set,
    Time,
    Geometry
}

export const DefaultDBType: Map<string, DBTypes> = new Map([
    ["string", DBTypes.Varchar],
    ["number", DBTypes.Int],
    ["Date", DBTypes.Datetime],
    ["Buffer", DBTypes.Blob]
]);

export var SequelizeMap: {[key:number]:string} = (() => {
    let ret: {[key:number]:string} = {};

    ret[DBTypes.Tinyint] = 'INTEGER';

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

export function concretType(t: DBTypes) {
    return Reflect.metadata("ConcretType", t);
}

export function embededField() {
    return Reflect.metadata("EmbededField", null);
}
