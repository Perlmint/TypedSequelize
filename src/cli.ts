/// <reference path="../typings/index.d.ts" />

import {readFileSync} from "fs";
import * as ts from "typescript";
import {ArgumentParser} from "argparse";
import {DBTypes, SequelizeMap} from "./decorator";

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
    type: ts.TypeNode
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
                            concretType = (<ts.PropertyAccessExpression>args[0]).name.text;
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
                    
                }
                members.push({
                    name: prop.name.getText(),
                    tsType: prop_type,
                    internal: isInternal,
                    concretType: concretType
                });
            });
            console.log(members);
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
    (<string[]>args.inputs).forEach((v, i) => {
        parse(v);
    });
}
