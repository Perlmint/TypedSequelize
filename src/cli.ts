/// <reference path="../typings/index.d.ts" />

import {readFileSync, createWriteStream, mkdirSync, accessSync} from "fs";
import {basename, join, relative, sep, normalize,
        parse as parsePath, isAbsolute, dirname} from "path";
import * as ts from "typescript";
import {ArgumentParser} from "argparse";
import * as _ from "lodash";
import {parse} from './parser';
import {writeModel, WriteInfo} from './writer';
import {InterfaceMap, ParsedInfo} from './types';

interface options {
    outdir: string
    rootdir: string
    inputs: string[],
    watch: boolean
}

function watch(rootFileNames: string[], options: ts.CompilerOptions) {
}

var args: options = {
    outdir: "",
    rootdir: "",
    watch: false,
    inputs: []
};

try {
    accessSync('typedseq.json');
    args = Object.assign(args, JSON.parse(readFileSync('typedseq.json', 'utf8')));
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

var parsedArgs: options = parser.parseArgs();
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
    var normalized = normalize((<string[]>args.inputs)[0]);
    if (!isAbsolute(normalized)) {
        normalized = join(process.cwd(), normalized);
    }
    var samplePath = parsePath(normalized);
    while(samplePath.root !== samplePath.dir) {
        try {
            accessSync(join(samplePath.dir, 'typings'));
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
    var interfacesByFile: ts.Map<ParsedInfo> = {};
    (<string[]>args.inputs).forEach((v, i) => {
        let srcAbsPath = isAbsolute(v) ? v : join(process.cwd(), v);
        let parsed = parse(srcAbsPath);
        _.assign(interfaces, parsed.interfaces);
        interfacesByFile[srcAbsPath] = parsed;
    });
    _.forEach(interfacesByFile, (v, k) => {
        let basefilename = basename(k, '.ts');
        let outName = basefilename + '_models', outTypesName = basefilename + '_types';
        writeModel(v, {
            outDir: args.outdir,
            outStream: createWriteStream(join(args.outdir, outName + '.ts')),
            outName: outName,
            outTypesStream: createWriteStream(join(args.outdir, outTypesName + '.ts')),
            outTypesName: outTypesName,
            rootDir: args.rootdir,
            srcPath: k
        });
    });
}
