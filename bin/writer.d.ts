/// <reference types="node" />
import { ParsedInfo } from "./types";
import { WriteStream } from "fs";
export interface IWriteInfo {
    srcPath: string;
    outDir: string;
    rootDir: string;
    outStream: WriteStream;
    outName: string;
    outTypesStream: WriteStream;
    outTypesName: string;
    targetUseTypings: boolean;
}
export declare function writeModel(info: ParsedInfo, writeInfo: IWriteInfo): void;
