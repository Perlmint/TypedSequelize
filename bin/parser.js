"use strict";
/// <reference path="../typings/index.d.ts" />
const ts = require("typescript");
const decorator_1 = require("./decorator");
const util_1 = require("./util");
function parse(fileName) {
    let program = ts.createProgram([fileName], {
        target: ts.ScriptTarget.ES6
    });
    var source = program.getSourceFile(fileName); //ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES5, true);
    var typeChecker = program.getTypeChecker();
    var interfaces = {};
    var imports = {};
    var usedImports = {};
    ts.forEachChild(source, visit);
    function visit(node) {
        if (node.kind !== ts.SyntaxKind.ClassDeclaration) {
            if (node.kind === ts.SyntaxKind.ImportDeclaration) {
                let importDecl = node;
                let moduleName = importDecl.moduleSpecifier.text;
                for (var namedBinding of importDecl.importClause.namedBindings.elements) {
                    imports[namedBinding.name.text] = moduleName;
                }
            }
            return;
        }
        if (!isNodeExported(node)) {
            return;
        }
        let t = typeChecker.getTypeAtLocation(node);
        let name = t.getSymbol().getName();
        let newInterface = {
            name: name,
            properties: [],
            createdAt: 'createdAt',
            deletedAt: null,
            updatedAt: 'updatedAt',
            hasPrimaryKey: false
        };
        for (var prop of typeChecker.getPropertiesOfType(t)) {
            let propName = prop.name;
            let info = parseProperty(prop.getDeclarations()[0]);
            newInterface.properties.push({
                name: propName,
                tsType: info[1],
                option: info[0]
            });
            if (info[0].primaryKey) {
                newInterface.hasPrimaryKey = true;
            }
        }
        interfaces[name] = newInterface;
    }
    function parseDecorators(decorators) {
        let ret = {
            concreteType: null,
            embeded: null,
            internal: false,
            primaryKey: false,
            arrayJoinedWith: null
        };
        if (decorators === undefined) {
            return ret;
        }
        for (var decorator of decorators) {
            let name, args = [];
            switch (decorator.expression.kind) {
                case ts.SyntaxKind.Identifier:
                    let id = decorator.expression;
                    name = id.text;
                    break;
                case ts.SyntaxKind.CallExpression:
                    let call = decorator.expression;
                    name = call.expression.text;
                    args = call.arguments.map((v, i) => { return v; });
                    break;
            }
            switch (name) {
                case 'internal':
                    ret.internal = true;
                    break;
                case 'concreteType':
                    ret.concreteType = decorator_1.DBTypes[args[0].name.text];
                    break;
                case 'embededField':
                    ret.embeded = [];
                    break;
                case 'primaryKey':
                    ret.primaryKey = true;
                    break;
                case 'arrayJoinedWith':
                    ret.arrayJoinedWith = args[0].text;
                    break;
            }
        }
        return ret;
    }
    function parseProperty(decl) {
        let ret = {
            concreteType: null,
            embeded: null,
            internal: false,
            primaryKey: false,
            arrayJoinedWith: null
        };
        var decorators = decl.decorators;
        let propType = typeChecker.getTypeAtLocation(decl.type);
        let tsType = util_1.tsTypeToString(propType);
        if (tsType in imports) {
            let moduleName = imports[tsType];
            if (!(moduleName in usedImports)) {
                usedImports[moduleName] = [];
            }
            usedImports[moduleName].push(tsType);
        }
        Object.assign(ret, parseDecorators(decorators));
        // fill concreteType
        if (ret.concreteType == null) {
            if (decorator_1.DefaultDBType.has(tsType)) {
                ret.concreteType = decorator_1.DefaultDBType.get(tsType);
            }
            else if (ret.embeded != null) {
                for (var embededProp of typeChecker.getPropertiesOfType(propType)) {
                    let name = embededProp.getName();
                    let info = parseProperty(embededProp.getDeclarations()[0]);
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
    function isNodeExported(node) {
        return (node.flags & ts.NodeFlags.Export) !== 0;
    }
    return {
        interfaces: interfaces,
        imports: usedImports
    };
}
exports.parse = parse;
