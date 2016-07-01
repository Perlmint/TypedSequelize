/// <reference path="../typings/index.d.ts" />
import * as ts from "typescript";
import {DBTypes} from "./decorator";

export interface PropertyOption {
    internal: boolean;
    concretType?: DBTypes;
    embeded: Property[];
    primaryKey: boolean;
}

export interface Property {
    name: string;
    tsType: ts.Type;
    option: PropertyOption;
    internalFields?: string[];
}

export interface Interface {
    name: string;
    properties: Property[];
};

export type InterfaceMap = ts.Map<Interface>;

export type ParsedInfo = {
    interfaces: InterfaceMap;
    indecies: ts.Map<string[]>;
    imports: ts.Map<string[]>;
};
