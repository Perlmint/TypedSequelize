/// <reference path="../typings/index.d.ts" />

import {readFileSync, createWriteStream, mkdirSync, accessSync} from "fs";
import {basename, join, relative, sep, normalize,
        parse as parsePath, isAbsolute, dirname} from "path";
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
    ["--rootdir"],
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

interface PropertyOption {
    internal: boolean;
    concretType?: DBTypes;
    embeded: Property[];
}

interface Property {
    name: string;
    tsType: ts.Type;
    option: PropertyOption;
    internalFields?: string[];
}

type InterfaceMap = ts.Map<{
    name: string;
    properties: Property[];
}>;
type ParsedInfo = {
    interfaces: InterfaceMap;
    imports: ts.Map<string[]>;
};

function watch(rootFileNames: string[], options: ts.CompilerOptions) {
}

function tsTypeToString(t: ts.Type): string {
    switch (t.flags) {
    case ts.TypeFlags.String:
        return "string";
    case ts.TypeFlags.Boolean:
        return "boolean";
    case ts.TypeFlags.Number:
        return "number";
    case ts.TypeFlags.Enum:
        return "number";
    default:
        switch (t.getSymbol().name) {
        case "Date":
            return "Date";
        case "Buffer":
            return "Buffer";
        default:
            return t.getSymbol().name;
        }
    }
}

function parse(fileName: string): ParsedInfo {
    let program = ts.createProgram([fileName], {
        target: ts.ScriptTarget.ES6
    });
    var source = program.getSourceFile(fileName); //ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES5, true);
    var typeChecker = program.getTypeChecker();
    var interfaces : InterfaceMap = {};

    var imports: ts.Map<string> = {};
    var usedImports: ts.Map<string[]> = {};
    ts.forEachChild(source, visit);

    function visit(node: ts.Node) {
        if (!isNodeExported(node)) {
            return;
        }

        if (node.kind !== ts.SyntaxKind.ClassDeclaration) {
            if (node.kind === ts.SyntaxKind.ImportDeclaration) {
                let importDecl = <ts.ImportDeclaration>node;
                let moduleName = (<ts.StringLiteral>importDecl.moduleSpecifier).text;
                for (var namedBinding of (<ts.NamedImports>importDecl.importClause.namedBindings).elements) {
                    imports[namedBinding.name.text] = moduleName;
                }
            }
            return;
        }

        var props: Property[] = [];
        let t = typeChecker.getTypeAtLocation(node);
        let name = t.getSymbol().getName();
        for (var prop of typeChecker.getPropertiesOfType(t)) {
            let propName = prop.name;
            let info = parseProperty(<ts.PropertyDeclaration>prop.getDeclarations()[0]);

            props.push({
                name: propName,
                tsType: info[1],
                option: info[0]
            });
        }

        interfaces[name] = {
            name: name,
            properties: props
        };
    }

    function parseDecorators(decorators: ts.NodeArray<ts.Decorator>): PropertyOption {
        let ret: PropertyOption = {
            concretType: null,
            embeded: null,
            internal: false
        };

        if (decorators === undefined) {
            return ret;
        }
        for (var decorator of decorators) {
            let name: string, args: ts.Expression[] = [];
            switch (decorator.expression.kind) {
            case ts.SyntaxKind.Identifier:
                let id = (<ts.Identifier>decorator.expression);
                name = id.text;
                break;
            case ts.SyntaxKind.CallExpression:
                let call = (<ts.CallExpression>decorator.expression);
                name = (<ts.Identifier>call.expression).text;
                args = call.arguments.map<ts.Expression>((v, i) => {return v;});
                break;
            }
            switch (name) {
            case 'internal':
                ret.internal = true;
                break;
            case 'concretType':
                ret.concretType = DBTypes[(<ts.PropertyAccessExpression>args[0]).name.text];
                break;
            case 'embededField':
                ret.embeded = [];
                break;
            }
        }
        return ret;
    }

    function parseProperty(decl: ts.PropertyDeclaration): [PropertyOption, ts.Type] {
        let ret: PropertyOption = {
            concretType: null,
            embeded: null,
            internal: false
        };
        var decorators: ts.NodeArray<ts.Decorator> = decl.decorators;
        let propType = typeChecker.getTypeAtLocation(decl.type);
        let tsType: string = tsTypeToString(propType);
        if (tsType in imports) {
            let moduleName = imports[tsType];
            usedImports[moduleName] = [tsType].concat(usedImports[moduleName]);
        }
        Object.assign(ret, parseDecorators(decorators));

        // fill concretType
        if (ret.concretType == null) {
            if (DefaultDBType.has(tsType)) {
                ret.concretType = DefaultDBType.get(tsType);
            }
            else if (ret.embeded != null) {
                for (var embededProp of typeChecker.getPropertiesOfType(propType)) {
                    let name = embededProp.getName();
                    let info = parseProperty(<ts.PropertyDeclaration>embededProp.getDeclarations()[0])
                    ret.embeded.push({
                        name: name,
                        option: info[0],
                        tsType: info[1]
                    });
                }
            }
        }
        return [ret, propType];
    }

    function isNodeExported(node: ts.Node): boolean {
        return (node.flags & ts.NodeFlags.Export) !== 0 ||
            (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
    }

    return {
        interfaces: interfaces,
        imports: usedImports
    };
}

var args = parser.parseArgs();
if (args.watch) {
    watch(args.inputs, {});
} else {
    var interfaces: InterfaceMap = {};
    var interfacesByFile: ts.Map<ParsedInfo> = {};
    (<string[]>args.inputs).forEach((v, i) => {
        let parsed = parse(v);
        _.assign(interfaces, parsed.interfaces);
        interfacesByFile[v] = parsed
    });
    try {
        mkdirSync(args.outdir);
    }
    catch (e) {
    }
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
    _.forEach(interfacesByFile, (v, k) => {
        let srcAbsPath = isAbsolute(k) ? k : join(process.cwd(), k);
        let basefilename = basename(k, '.ts');
        let outfilename = basefilename + '_models.ts';
        let outPath = join(args.outdir, outfilename);
        var stream = createWriteStream(outPath);
        stream.write(sprintf("/// <reference path=\"%s\" />\n\n",
                             relative(args.outdir,
                                      join(args.rootdir,
                                           "typings/index.d.ts"))
                             .replace(new RegExp("\\\\", "g"), "/")));
        stream.write("import * as sequelize from 'sequelize';\n\n");
        _.forEach(v.imports, (items: string[], moduleName: string) => {
            if (moduleName[0] === ".") {
                moduleName = relative(args.outdir,
                                      join(dirname(srcAbsPath), moduleName))
                    .replace(new RegExp("\\\\", "g"), "/");
            }
            stream.write(sprintf("import { %s } from '%s';\n",
                                 items.join(", "), moduleName));
        });
        stream.write("\n");
        _.forEach(v.interfaces, (interf, name) => {
            stream.write(sprintf("export interface %sInterface {\n", name));
            _.forEach(interf.properties, (prop) => {
                stream.write(sprintf("    %s?: %s;\n", prop.name, tsTypeToString(prop.tsType)));
            });
            stream.write("}\n\n");
            stream.write(sprintf("interface %sInstance extends sequelize.Instance<%sInterface>, %sInterface {}\n\n", name, name, name));
            stream.write(sprintf("interface %sModel extends sequelize.Model<%sInstance, %sInterface> {}\n\n", name, name, name));
            stream.write(sprintf("var %sInitialized: boolean = false;\n", name));
            stream.write(sprintf("export var %s: %sModel;\n", name, name));
            stream.write(sprintf(`export function init%s(seq: sequelize.Sequelize): void {
  if (%sInitialized) {
    return;
  }

`, name, name))
            stream.write(sprintf("  %s = <%sModel>seq.define<%sInstance, %sInterface>('%s', {\n", name, name, name, name, name));
            stream.write(
                _.map(interf.properties, (prop) => {
                    if (prop.option.embeded === null) {
                        return sprintf("    '%s': sequelize.%s", prop.name, SequelizeMap[prop.option.concretType])
                    }
                    else {
                        let def = sprintf(`    '%s': {
      type: sequelize.VIRTUAL,
      get: (): %s => {
        return {
%s
        };
      },
      set: (val: %s) => {
%s
      }
}`, prop.name, tsTypeToString(prop.tsType),
                                          _.map(prop.option.embeded,
                                                (embeded) =>
                                                sprintf("        '%s': this.get('%s_%s')", embeded.name, prop.name, embeded.name)).join(',\n'),
                                          tsTypeToString(prop.tsType),
                                          _.map(prop.option.embeded,
                                                (embeded) =>
                                                sprintf("        this.setDataValue('%s_%s', val.%s);", prop.name, embeded.name, embeded.name)).join('\n'));
                        return (_.map(prop.option.embeded, (embeded) => {
                            return sprintf("    '%s_%s': sequelize.%s", prop.name, embeded.name, SequelizeMap[embeded.option.concretType]);
                        }).concat(def)).join(',\n');
                    }
                }).join(',\n'));
            stream.write("\n");
            stream.write("  }, {");
            let embeded = _.filter(interf.properties, (prop) => {
                return !prop.option.embeded;
            });
            stream.write("  });\n\n");
            stream.write(sprintf(`  %sInitialized = true;
}`, name));
        });
        stream.write("\n\nexport function init(seq: sequelize.Sequelize): void {\n");
        _.forEach(v.interfaces, (interf, name) => {
            stream.write(sprintf("  init%s(seq);\n", name));
        });
        stream.write("};");
    });
}
