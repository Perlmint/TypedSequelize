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

export type InterfaceMap = ts.Map<{
    name: string;
    properties: Property[];
}>;

export type ParsedInfo = {
    interfaces: InterfaceMap;
    indecies: ts.Map<string[]>;
    imports: ts.Map<string[]>;
};
