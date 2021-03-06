import "reflect-metadata";

export function internal() {
    return Reflect.metadata("internal", true);
}

// first one is default type
export enum DBTypes {
    // boolean
    Boolean,

    // number
    Int,
    Smallint,
    Integer,
    Tinyint,
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
    ["Buffer", DBTypes.Blob],
    ["boolean", DBTypes.Boolean]
]);

export var SequelizeMap: {[key:number]:string} = (() => {
    let ret: {[key:number]:string} = {};

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

export function concreteType(t: DBTypes) {
    return Reflect.metadata("ConcreteType", t);
}

export function embededField() {
    return Reflect.metadata("EmbededField", null);
}

export function primaryKey() {
    return Reflect.metadata("PrimaryKey", null);
}

export function arrayJoinedWith(seperator: string) {
    return Reflect.metadata("arrayJoinedWith", seperator);
}

export function rpc(path: string) {
    return Reflect.metadata("rpc", path);
}

export function find<T>(query: T|{}): T[] {
    return null;
}

export function findOne<T>(query: T|{}): T {
    return null;
}

export function model() {
    return Reflect.metadata("Model", null);
}

export function index(name?: string, uniq?: boolean) {
    return Reflect.metadata("Index", name);
}