/// <reference path="../typings/index.d.ts" />
import * as ts from "typescript";
import {DBTypes, SequelizeMap, DefaultDBType} from "./decorator";
import * as _ from "lodash";
import {sprintf} from "sprintf-js";
import {InterfaceMap, ParsedInfo, Property, PropertyOption} from "./types";
import {tsTypeToString} from "./util";

export function parse(fileName: string): ParsedInfo {
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
            internal: false,
            primaryKey: false,
            arrayJoinedWith: null
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
            case 'primaryKey':
                ret.primaryKey = true;
                break;
            case 'arrayJoinedWith':
                ret.arrayJoinedWith = (<ts.StringLiteral>args[0]).text;
                break;
            }
        }
        return ret;
    }

    function parseProperty(decl: ts.PropertyDeclaration): [PropertyOption, ts.Type] {
        let ret: PropertyOption = {
            concretType: null,
            embeded: null,
            internal: false,
            primaryKey: false,
            arrayJoinedWith: null
        };
        var decorators: ts.NodeArray<ts.Decorator> = decl.decorators;
        let propType = typeChecker.getTypeAtLocation(decl.type);
        let tsType: string = tsTypeToString(propType);
        if (tsType in imports) {
            let moduleName = imports[tsType];
            if (!(moduleName in usedImports)) {
                usedImports[moduleName] = []
            }
            usedImports[moduleName].push(tsType);
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
