import * as ts from "typescript";
import {DBTypes} from "./decorator";

export interface PropertyOption {
    internal: boolean;
    concreteType?: DBTypes;
    embeded: Property[];
    primaryKey: boolean;
    arrayJoinedWith?: string;
    associated: Relationship;
}

export interface Property {
    name: string;
    tsType: ts.Type;
    option: PropertyOption;
    internalFields?: string[];
}

export enum RelationshipType {
    OneToMany,
    ManyToMany,
    ManyToOne
}

export interface Relationship {
    type: RelationshipType;
    targetName: string;
    targetModule: string;
    name: string;
};

export interface IndexInfo {
    unique: boolean;
    fields: string[];
}

export interface Interface {
    name: string;
    properties: Property[];
    hasPrimaryKey: boolean;
    createdAt: boolean | string;
    updatedAt: boolean | string;
    deletedAt: boolean | string;
    relationships: Relationship[];
    indexes: {[key:string]:IndexInfo};
};

export type InterfaceMap = {[key:string]:Interface};

export type ParsedInfo = {
    interfaces: InterfaceMap;
    declarations: {[key:string]:string};
    imports: {[key:string]:string[]};
};
