import "reflect-metadata";
export declare function internal(): {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
};
export declare enum DBTypes {
    Boolean = 0,
    Int = 1,
    Smallint = 2,
    Integer = 3,
    Tinyint = 4,
    Mediumint = 5,
    Bigint = 6,
    Year = 7,
    Float = 8,
    Double = 9,
    Decimal = 10,
    Datetime = 11,
    Timestamp = 12,
    Date = 13,
    Blob = 14,
    Tinyblob = 15,
    Mediumblob = 16,
    Longblob = 17,
    Binary = 18,
    Varbinary = 19,
    Bit = 20,
    Varchar = 21,
    Char = 22,
    Tinytext = 23,
    Mediumtext = 24,
    Longtext = 25,
    Text = 26,
    Enum = 27,
    Set = 28,
    Time = 29,
    Geometry = 30,
}
export declare const DefaultDBType: Map<string, DBTypes>;
export declare var SequelizeMap: {
    [key: number]: string;
};
export declare function concreteType(t: DBTypes): {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
};
export declare function embededField(): {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
};
export declare function primaryKey(): {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
};
export declare function arrayJoinedWith(seperator: string): {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
};
export declare function rpc(path: string): {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
};
export declare function find<T>(query: T | {}): T[];
export declare function findOne<T>(query: T | {}): T;
export declare function model(): {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
};
export declare function index(name?: string, uniq?: boolean): {
    (target: Function): void;
    (target: Object, propertyKey: string | symbol): void;
};
