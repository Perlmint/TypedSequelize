/// <reference path="../typings/index.d.ts" />
"use strict";
const fs_1 = require("fs");
const path_1 = require("path");
const argparse_1 = require("argparse");
const _ = require("lodash");
const parser_1 = require('./parser');
const writer_1 = require('./writer');
function watch(rootFileNames, options) {
}
var args = {
    outdir: "",
    rootdir: "",
    watch: false,
    inputs: []
};
try {
    fs_1.accessSync('typedseq.json');
    args = Object.assign(args, JSON.parse(fs_1.readFileSync('typedseq.json', 'utf8')));
}
catch (e) {
}
var parser = new argparse_1.ArgumentParser({
    version: "DEV_VERSION",
    addHelp: true,
    description: "Sequelize Definition generator"
});
parser.addArgument(["--outdir"], {
    defaultValue: args.outdir,
    type: "string",
    help: "output directory"
});
parser.addArgument(["--rootdir"], {
    defaultValue: args.rootdir,
    type: "string",
    help: "output root directory for typescript reference"
});
parser.addArgument(["--inputs"], {
    defaultValue: args.inputs,
    nargs: "+",
    type: "string",
    help: "Model interface definition files"
});
parser.addArgument(["-r", "--rpc"], {
    dest: "rpc",
    choices: ["none", "express"],
    type: "string",
    help: "RPC support",
    defaultValue: "none"
});
parser.addArgument(["-p", "--prefix"], {
    dest: "prefix",
    type: "string",
    help: "output filename prefix",
    defaultValue: "ts-"
});
parser.addArgument(["-w", "--watch"], {
    defaultValue: args.watch,
    dest: "watch",
    action: "storeTrue",
    help: "Watch source definitions"
});
var parsedArgs = parser.parseArgs();
if (parsedArgs.inputs) {
    args.inputs = parsedArgs.inputs;
}
if (parsedArgs.outdir) {
    args.outdir = parsedArgs.outdir;
}
// create out dir
try {
    fs_1.mkdirSync(args.outdir);
}
catch (e) {
}
// inference rootdir
if (args.rootdir === null) {
    var normalized = path_1.normalize(args.inputs[0]);
    if (!path_1.isAbsolute(normalized)) {
        normalized = path_1.join(process.cwd(), normalized);
    }
    var samplePath = path_1.parse(normalized);
    while (samplePath.root !== samplePath.dir) {
        try {
            fs_1.accessSync(path_1.join(samplePath.dir, 'typings'));
            args.rootdir = samplePath.dir;
            break;
        }
        catch (e) {
            samplePath = path_1.parse(samplePath.dir);
        }
    }
}
if (args.watch) {
    watch(args.inputs, {});
}
else {
    var interfaces = {};
    var interfacesByFile = {};
    args.inputs.forEach((v, i) => {
        let srcAbsPath = path_1.isAbsolute(v) ? v : path_1.join(process.cwd(), v);
        let parsed = parser_1.parse(srcAbsPath);
        _.assign(interfaces, parsed.interfaces);
        interfacesByFile[srcAbsPath] = parsed;
    });
    _.forEach(interfacesByFile, (v, k) => {
        let basefilename = path_1.basename(k, '.ts');
        let outName = basefilename + '_models', outTypesName = basefilename + '_types';
        writer_1.writeModel(v, {
            outDir: args.outdir,
            outStream: fs_1.createWriteStream(path_1.join(args.outdir, outName + '.ts')),
            outName: outName,
            outTypesStream: fs_1.createWriteStream(path_1.join(args.outdir, outTypesName + '.ts')),
            outTypesName: outTypesName,
            rootDir: args.rootdir,
            srcPath: k
        });
    });
}
