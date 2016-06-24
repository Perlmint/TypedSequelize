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

export var SequelizeMap: {[key:number]:string} = (() => {
    let ret: {[key:number]:string} = {};

    ret[DBTypes.Tinyint] = 'INTEGER';

    ret[DBTypes.Smallint] = 'INTEGER';
    ret[DBTypes.Int] = 'INTEGER';
    ret[DBTypes.Integer] = 'INTEGER';
    ret[DBTypes.Mediumint] = 'INTEGER';
    ret[DBTypes.Bigint] = 'INTEGER';
    ret[DBTypes.Year] = 'INTEGER';

    ret[DBTypes.Float] = 'DECIMAL';
    ret[DBTypes.Double] = 'DECIMAL';
    ret[DBTypes.Decimal] = 'DECIMAL';

    ret[DBTypes.Timestamp] = 'DATE';
    ret[DBTypes.Date] = 'DATE';
    ret[DBTypes.Datetime] = 'DATE';

    ret[DBTypes.Tinyblob] = 'BLOB';
    ret[DBTypes.Mediumblob] = 'BLOB';
    ret[DBTypes.Longblob] = 'BLOB';
    ret[DBTypes.Blob] = 'BLOB';
    ret[DBTypes.Binary] = 'BLOB';
    ret[DBTypes.Varbinary] = 'BLOB';
    ret[DBTypes.Bit] = 'BLOB';

    ret[DBTypes.Char] = 'STRING';
    ret[DBTypes.Varchar] = 'STRING';
    ret[DBTypes.Tinytext] = 'STRING';
    ret[DBTypes.Mediumtext] = 'STRING';
    ret[DBTypes.Longtext] = 'STRING';
    ret[DBTypes.Text] = 'STRING';
    ret[DBTypes.Enum] = 'STRING';
    ret[DBTypes.Set] = 'STRING';
    ret[DBTypes.Time] = 'STRING';
    ret[DBTypes.Geometry] = 'STRING';

    return ret;
})();

export function concretType(t: DBTypes) {
    return Reflect.metadata("ConcretType", t);
}
