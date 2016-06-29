/// <reference path="../typings/index.d.ts" />

import {readFileSync, createWriteStream, mkdirSync, accessSync} from "fs";
import {basename, join, relative} from "path";
import * as ts from "typescript";
import {ArgumentParser} from "argparse";
import {DBTypes, SequelizeMap, DefaultDBType} from "./decorator";
import * as _ from "lodash";
import {sprintf} from "sprintf-js";

var parser = new ArgumentParser({
    version: "DEV_VERSION",
    addHelp: true,
    description: "Sequelize Definition generator"
});
parser.addArgument(
    ["outdir"],
    {
        type: "string",
        help: "output directory"
    }
);
parser.addArgument(
    ["rootdir"],
    {
        type: "string",
        help: "output root directory for typescript reference"
    }
);
parser.addArgument(
    ["inputs"],
    {
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
        dest: "watch",
        action: "storeTrue",
        help: "Watch source definitions"
    }
);

interface Property {
    name: string
    tsType: string,
    internal: boolean,
    concretType: DBTypes
}
type InterfaceMap = ts.Map<{
    name: string,
    properties: Property[]
}>

function watch(rootFileNames: string[], options: ts.CompilerOptions) {
}

function parse(fileName: string) {
    let source = ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES5, true);
    const interfaces : InterfaceMap = {};

    traverse(source);

    function traverse(node: ts.Node) {
        switch (node.kind) {
        case ts.SyntaxKind.ClassDeclaration:
            let decl = (<ts.ClassDeclaration>node);
            let members = [];
            decl.members.forEach((member, i) => {
                if (member.kind != ts.SyntaxKind.PropertyDeclaration) {
                    return;
                }
                let prop = (<ts.PropertyDeclaration>member);

                let isInternal = false, concretType = null;
                if (prop.decorators) {
                    prop.decorators.forEach((decorator, i) => {
                        let name: string, args: ts.Expression[] = [];
                        switch (decorator.expression.kind) {
                        case ts.SyntaxKind.Identifier:
                            let id = (<ts.Identifier>decorator.expression);
                            name = id.text;
                            break;
                        case ts.SyntaxKind.CallExpression:
                            let call = (<ts.CallExpression>decorator.expression);
                            name = call.expression.getText();
                            args = call.arguments.map<ts.Expression>((v, i) => {return v;});
                            break;
                        }
                        switch (name) {
                        case 'internal':
                            isInternal = true;
                            break;
                        case 'concretType':
                            concretType = DBTypes[(<ts.PropertyAccessExpression>args[0]).name.text];
                            break;
                        }
                    });
                }
                let prop_type = "";
                switch (prop.type.kind) {
                case ts.SyntaxKind.StringKeyword:
                    prop_type = "string";
                    break;
                case ts.SyntaxKind.NumberKeyword:
                    prop_type = "number";
                    break;
                case ts.SyntaxKind.TypeReference:
                    switch ((<ts.TypeReferenceNode>prop.type).typeName.getText()) {
                    case "Date":
                        prop_type = "Date";
                        break;
                    case "Buffer":
                        prop_type = "Buffer";
                        break;
                    }
                    break;
                default:
                    console.log(ts.SyntaxKind[prop.type.kind]);
                    console.log(prop.type);
                }
                if (concretType == null) {
                    if (DefaultDBType.has(prop_type)) {
                        concretType = DefaultDBType.get(prop_type);
                    }
                    else {
                    }
                }
                members.push({
                    name: prop.name.getText(),
                    tsType: prop_type,
                    internal: isInternal,
                    concretType: concretType
                });
            });
            interfaces[decl.name.text] = {
                name: decl.name.text,
                properties: members
            };
            break;
        default:
            ts.forEachChild(node, traverse);
        }
    }

    return interfaces;
}

var args = parser.parseArgs();
if (args.watch) {
    watch(args.inputs, {});
} else {
    var interfaces: InterfaceMap = {};
    var interfacesByFile: ts.Map<InterfaceMap> = {};
    (<string[]>args.inputs).forEach((v, i) => {
        let parsed = parse(v);
        _.assign(interfaces, parsed);
        interfacesByFile[v] = parsed
    });
    try {
        mkdirSync(args.outdir);
    }
    catch (e) {
    }
    _.forEach(interfacesByFile, (v, k) => {
        let basefilename = basename(k, '.ts');
        let outfilename = basefilename + '_models.ts';
        var stream = createWriteStream(join(args.outdir, outfilename));
        stream.write(sprintf("/// <reference path=\"%s/index.d.ts\" />\n\n",
                             relative(outfilename, join(args.rootdir, "typings"))));
        stream.write("import * as sequelize from 'sequelize';\n\n");
        _.forEach(v, (interf, name) => {
            stream.write(sprintf("interface %sInterface {\n", name));
            _.forEach(interf.properties, (prop) => {
                stream.write(sprintf("    %s?: %s;\n", prop.name, prop.tsType));
            });
            stream.write("}\n\n");
            stream.write(sprintf("interface %sInstance extends sequelize.Instance<%sInstance, %sInterface>, %sInterface {}\n\n", name, name, name, name));
            stream.write(sprintf("interface %sModel extends sequelize.Model<%sInstance, %sInterface> {}\n\n", name, name, name));
            stream.write(sprintf("var %sInitialized: boolean = false;\n", name));
            stream.write(sprintf("export var %s: %sModel;\n", name, name));
            stream.write(sprintf(`export function init%s(seq: sequelize.Sequelize): void {
  if (%sInitialized) {
    return;
  }

`, name, name))
            stream.write(sprintf("  %s = <%sModel>sequelize.define<%sInstance, %sInterface>('%s', {\n", name, name, name, name, name));
            stream.write(
                _.map(interf.properties, (prop) => {
                    return sprintf("    '%s': sequelize.%s", prop.name, SequelizeMap[prop.concretType])
                }).join(',\n'));
            stream.write("\n");
            stream.write("  });\n\n");
            stream.write(sprintf(`  %sInitialized = true;
}`, name));
        });
        stream.write("\n\nexport function init(seq: sequelize.Sequelize): void {\n");
        _.forEach(v, (interf, name) => {
            stream.write(sprintf("  init%s(seq);\n", name));
        });
        stream.write("};");
    });
}
