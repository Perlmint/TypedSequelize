/// <reference path="../typings/index.d.ts" />

import {readFileSync, createWriteStream, mkdirSync, accessSync} from "fs";
import {basename, join, relative, sep, normalize,
        parse as parsePath, isAbsolute, dirname} from "path";
import * as ts from "typescript";
import {ArgumentParser} from "argparse";
import * as _ from "lodash";
import {parse} from "./parser";
import {writeModel, IWriteInfo} from "./writer";
import {InterfaceMap, ParsedInfo} from "./types";

interface IOptions {
    outdir: string;
    rootdir: string;
    inputs: string[];
    watch: boolean;
}

function watch(rootFileNames: string[], options: ts.CompilerOptions) {
}

var args: IOptions = {
    outdir: "",
    rootdir: "",
    watch: false,
    inputs: []
};

try {
    accessSync("typedseq.json");
    args = _.assign(args, JSON.parse(readFileSync("typedseq.json", "utf8"))) as any;
}
catch (e) {
}

var parser = new ArgumentParser({
    version: "DEV_VERSION",
    addHelp: true,
    description: "Sequelize Definition generator"
});
parser.addArgument(
    ["--outdir"],
    {
        defaultValue: args.outdir,
        type: "string",
        help: "output directory"
    }
);
parser.addArgument(
    ["--rootdir"],
    {
        defaultValue: args.rootdir,
        type: "string",
        help: "output root directory for typescript reference"
    }
);
parser.addArgument(
    ["--inputs"],
    {
        defaultValue: args.inputs,
        nargs: "+",
        type: "string",
        help: "Model interface definition files"
    }
);
parser.addArgument(
    ["-r", "--rpc"],
    {
        dest: "rpc",
        choices: ["none", "express"],
        type: "string",
        help: "RPC support",
        defaultValue: "none"
    }
);
parser.addArgument(
    ["-p", "--prefix"],
    {
        dest: "prefix",
        type: "string",
        help: "output filename prefix",
        defaultValue: "ts-"
    }
);
parser.addArgument(
    ["-w", "--watch"],
    {
        defaultValue: args.watch,
        dest: "watch",
        action: "storeTrue",
        help: "Watch source definitions"
    }
);

var parsedArgs: IOptions = parser.parseArgs();
if (parsedArgs.inputs) {
    args.inputs = parsedArgs.inputs;
}
if (parsedArgs.outdir) {
    args.outdir = parsedArgs.outdir;
}

// create out dir
try {
    mkdirSync(args.outdir);
}
catch (e) {
}

// inference rootdir
if (args.rootdir === null) {
    var normalized = normalize((args.inputs)[0]);
    if (!isAbsolute(normalized)) {
        normalized = join(process.cwd(), normalized);
    }
    var samplePath = parsePath(normalized);
    while(samplePath.root !== samplePath.dir) {
        try {
            accessSync(join(samplePath.dir, "typings"));
            args.rootdir = samplePath.dir;
            break;
        }
        catch (e) {
            samplePath = parsePath(samplePath.dir);
        }
    }
}

if (args.watch) {
    watch(args.inputs, {});
} else {
    var interfaces: InterfaceMap = {};
    var interfacesByFile: {[key:string]:ParsedInfo} = {};
    (args.inputs).forEach((v) => {
        const srcAbsPath = isAbsolute(v) ? v : join(process.cwd(), v);
        const parsed = parse(srcAbsPath);
        _.assign(interfaces, parsed.interfaces);
        interfacesByFile[srcAbsPath] = parsed;
    });
    _.forEach(interfacesByFile, (v, k) => {
        const basefilename = basename(k, ".ts");
        const outName = `${basefilename}_models`;
        const outTypesName = `${basefilename}_types`;
        writeModel(v, {
            outDir: args.outdir,
            outStream: createWriteStream(join(args.outdir, `${outName}.ts`)),
            outName: outName,
            outTypesStream: createWriteStream(join(args.outdir, `${outTypesName}.ts`)),
            outTypesName: outTypesName,
            rootDir: args.rootdir,
            srcPath: k
        });
    });
}
