/// <reference path="../typings/index.d.ts" />
import * as ts from "typescript";
import {DBTypes} from "./decorator";

export interface PropertyOption {
    internal: boolean;
    concreteType?: DBTypes;
    embeded: Property[];
    primaryKey: boolean;
    arrayJoinedWith?: string;
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
    imports: ts.Map<string[]>;
};
