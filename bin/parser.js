"use strict";
/// <reference path="../typings/index.d.ts" />
const ts = require("typescript");
const decorator_1 = require("./decorator");
const _ = require("lodash");
const types_1 = require("./types");
const util_1 = require("./util");
function getDecoratorName(decorator) {
    switch (decorator.expression.kind) {
        case ts.SyntaxKind.Identifier:
            {
                const id = decorator.expression;
                return id.text;
            }
        case ts.SyntaxKind.CallExpression:
            {
                const call = decorator.expression;
                return call.expression.text;
            }
    }
    return null;
}
function getDecoratorArgs(decorator) {
    if (decorator.expression.kind === ts.SyntaxKind.CallExpression) {
        const call = decorator.expression;
        return call.arguments.map((v) => { return v; });
    }
    return [];
}
function parse(fileName) {
    let program = ts.createProgram([fileName], {
        target: ts.ScriptTarget.ES6
    });
    var source = program.getSourceFile(fileName); //ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES5, true);
    var typeChecker = program.getTypeChecker();
    var interfaces = {};
    var imports = {};
    var usedImports = {};
    var usedDeclaration = [];
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
        // only model exports
        if (node.decorators == null ||
            _.findIndex(node.decorators, (d) => getDecoratorName(d) === "model") === -1) {
            return;
        }
        let t = typeChecker.getTypeAtLocation(node);
        let name = t.getSymbol().getName();
        let newInterface = {
            name: name,
            properties: [],
            createdAt: "createdAt",
            deletedAt: null,
            updatedAt: "updatedAt",
            hasPrimaryKey: false,
            relationships: [],
            indexes: {}
        };
        for (let prop of typeChecker.getPropertiesOfType(t)) {
            const propName = prop.name;
            const info = parseProperty(prop.getDeclarations()[0]);
            info[0].associated = info[2];
            const [option, tsType] = info;
            newInterface.properties.push({
                name: propName,
                tsType,
                option
            });
            if (info[0].primaryKey) {
                newInterface.hasPrimaryKey = true;
            }
            if (info[2] != null) {
                info[2].name = propName;
                newInterface.relationships.push(info[2]);
            }
            if (info[3] !== null) {
                let index = newInterface.indexes[info[3]];
                if (index == null) {
                    index = newInterface.indexes[info[3]] = { unique: false, fields: [] };
                }
                index.fields.push(propName);
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
            arrayJoinedWith: null,
            associated: null
        };
        if (decorators === undefined) {
            return ret;
        }
        for (var decorator of decorators) {
            let name = getDecoratorName(decorator);
            const args = getDecoratorArgs(decorator);
            switch (name) {
                case "internal":
                    ret.internal = true;
                    break;
                case "concreteType":
                    ret.concreteType = decorator_1.DBTypes[args[0].name.text];
                    break;
                case "embededField":
                    ret.embeded = [];
                    break;
                case "primaryKey":
                    ret.primaryKey = true;
                    break;
                case "arrayJoinedWith":
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
            arrayJoinedWith: null,
            associated: null
        };
        var decorators = decl.decorators;
        let propType = typeChecker.getTypeAtLocation(decl.type);
        let tsType = util_1.tsTypeToString(propType);
        let baseType = tsType.replace("[]", "");
        let typeDecl = null;
        let relationship = null;
        let index = null;
        let isArray = false;
        if (propType.symbol) {
            if (propType.symbol.name === "Array") {
                isArray = true;
                if (propType.typeArguments[0].symbol) {
                    typeDecl = propType.typeArguments[0].symbol.declarations[0];
                }
            }
            else {
                typeDecl = propType.symbol.declarations[0];
            }
        }
        const indexInfo = _.find(decorators, (dec) => getDecoratorName(dec) === "Index");
        if (indexInfo !== undefined) {
            const args = getDecoratorArgs(indexInfo);
            index = args[0].text;
        }
        // import
        if (typeDecl) {
            let moduleName = imports[baseType];
            let typeDecoratorNames = _.map(typeDecl.decorators, getDecoratorName);
            if (_.includes(typeDecoratorNames, "model")) {
                // model - relation
                relationship = {
                    type: isArray ? types_1.RelationshipType.OneToMany : types_1.RelationshipType.ManyToOne,
                    name: null,
                    targetName: baseType,
                    targetModule: moduleName
                };
            }
            else if (baseType in imports) {
                if (!(moduleName in usedImports)) {
                    usedImports[moduleName] = [];
                }
                usedImports[moduleName].push(baseType);
            }
            else if (typeDecl.getSourceFile() === source) {
                usedDeclaration.push({
                    name: tsType,
                    begin: typeDecl.pos,
                    end: typeDecl.end
                });
            }
        }
        else if (!isNodeType(tsType)) {
            console.log(decl);
            if (decl.getSourceFile() === source) {
                usedDeclaration.push({
                    name: tsType,
                    begin: typeDecl.pos,
                    end: typeDecl.end
                });
            }
        }
        _.assign(ret, parseDecorators(decorators));
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
            else if (propType.flags & ts.TypeFlags.Enum) {
                ret.concreteType = decorator_1.DBTypes.Int;
            }
        }
        return [ret, propType, relationship, index];
    }
    function isNodeType(typename) {
        return _.includes(["string", "number", "boolean", "Date"], typename.replace("[]", ""));
    }
    const declarations = {};
    _.forEach(usedDeclaration, (declInfo) => {
        if (interfaces[declInfo.name]) {
            return;
        }
        var code = source.text.slice(declInfo.begin, declInfo.end).trim();
        if (!code.startsWith("export")) {
            code = `export ${code}`;
        }
        declarations[declInfo.name] = code;
    });
    return {
        interfaces: interfaces,
        declarations: declarations,
        imports: usedImports
    };
}
exports.parse = parse;
