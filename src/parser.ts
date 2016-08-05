/// <reference path="../typings/index.d.ts" />
import * as ts from "typescript";
import {DBTypes, SequelizeMap, DefaultDBType} from "./decorator";
import * as _ from "lodash";
import {InterfaceMap, ParsedInfo, Property, PropertyOption, Interface,
        RelationshipType, Relationship} from "./types";
import {tsTypeToString} from "./util";

function getDecoratorName(decorator: ts.Decorator): string {
    switch (decorator.expression.kind) {
        case ts.SyntaxKind.Identifier:
            let id = (<ts.Identifier>decorator.expression);
            return id.text;
        case ts.SyntaxKind.CallExpression:
            let call = (<ts.CallExpression>decorator.expression);
            return (<ts.Identifier>call.expression).text;
    }
    return null;
}

export function parse(fileName: string): ParsedInfo {
    let program = ts.createProgram([fileName], {
        target: ts.ScriptTarget.ES6
    });
    var source = program.getSourceFile(fileName); //ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES5, true);
    var typeChecker = program.getTypeChecker();
    var interfaces : InterfaceMap = {};

    var imports: ts.Map<string> = {};
    var usedImports: ts.Map<string[]> = {};
    var usedDeclaration: {
        name: string
        begin: number
        end: number
    }[] = [];
    ts.forEachChild(source, visit);

    function visit(node: ts.Node) {
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

        // only model exports
        if (node.decorators == null ||
            node.decorators.findIndex(
                (d: ts.Decorator) => getDecoratorName(d) == "model") == -1) {
            return;
        }

        let t = typeChecker.getTypeAtLocation(node);
        let name = t.getSymbol().getName();
        let newInterface: Interface = {
            name: name,
            properties: [],
            createdAt: 'createdAt',
            deletedAt: null,
            updatedAt: 'updatedAt',
            hasPrimaryKey: false,
            relationships: []
        };
        for (var prop of typeChecker.getPropertiesOfType(t)) {
            let propName = prop.name;
            var info = parseProperty( <ts.PropertyDeclaration>prop.getDeclarations()[0]);

            if (info[2] == null) {
                newInterface.properties.push({
                    name: propName,
                    tsType: info[1],
                    option: info[0]
                });
                if (info[0].primaryKey) {
                    newInterface.hasPrimaryKey = true;
                }
            }
            else {
                info[2].name = propName;
                newInterface.relationships.push(info[2]);
            }
        }

        interfaces[name] = newInterface;
    }

    function parseDecorators(decorators: ts.NodeArray<ts.Decorator>): PropertyOption {
        let ret: PropertyOption = {
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
            let name: string = getDecoratorName(decorator), args: ts.Expression[] = [];
            if (decorator.expression.kind == ts.SyntaxKind.CallExpression) {
                let call = (<ts.CallExpression>decorator.expression);
                args = call.arguments.map<ts.Expression>((v, i) => {return v;});
            }
            switch (name) {
            case 'internal':
                ret.internal = true;
                break;
            case 'concreteType':
                ret.concreteType = DBTypes[(<ts.PropertyAccessExpression>args[0]).name.text];
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

    function parseProperty(decl: ts.PropertyDeclaration): [PropertyOption, ts.Type, Relationship] {
        let ret: PropertyOption = {
            concreteType: null,
            embeded: null,
            internal: false,
            primaryKey: false,
            arrayJoinedWith: null
        };
        var decorators: ts.NodeArray<ts.Decorator> = decl.decorators;
        let propType = typeChecker.getTypeAtLocation(decl.type);
        let tsType: string = tsTypeToString(propType);
        let baseType: string = tsType.replace('[]', '');
        let typeDecl: ts.Declaration = null;
        let relationship: Relationship = null;
        if (propType.symbol && (propType.flags & ts.TypeFlags.Enum) == 0) {
            if (propType.symbol.name == "Array") {
                if ((propType as ts.GenericType).typeArguments[0].symbol) {
                    typeDecl = (propType as ts.GenericType).typeArguments[0].symbol.declarations[0];
                }
            }
            else {
                typeDecl = propType.symbol.declarations[0];
            }
        }
        // import
        if (baseType in imports) {
            let moduleName = imports[baseType];
            let typeDecoratorNames = _.map(typeDecl.decorators, getDecoratorName);
            if (_.includes(typeDecoratorNames, 'model')) {
                // model - relation
                relationship = {
                    type: RelationshipType.OneToMany,
                    name : null,
                    targetName: baseType,
                    targetModule: moduleName
                };
            }
            else {
                if (!(moduleName in usedImports)) {
                    usedImports[moduleName] = []
                }
                usedImports[moduleName].push(baseType);
            }
        }
        // declared in same file or default
        else if (!isNodeType(tsType)) {
            if (decl.getSourceFile() == source) {
                usedDeclaration.push({
                    name: tsType,
                    begin: typeDecl.pos,
                    end: typeDecl.end
                });
            }
            else {
                // something wrong
            }
        }
        Object.assign(ret, parseDecorators(decorators));

        // fill concreteType
        if (ret.concreteType == null) {
            if (DefaultDBType.has(tsType)) {
                ret.concreteType = DefaultDBType.get(tsType);
            }
            else if (ret.embeded != null) {
                for (var embededProp of typeChecker.getPropertiesOfType(propType)) {
                    let name = embededProp.getName();
                    let info = parseProperty(<ts.PropertyDeclaration>embededProp.getDeclarations()[0]);
                    ret.embeded.push({
                        name: name,
                        option: info[0],
                        tsType: info[1]
                    });
                }
            }
        }
        return [ret, propType, relationship];
    }

    function isNodeExported(node: ts.Node): boolean {
        return (node.flags & ts.NodeFlags.Export) !== 0;
    }

    function isNodeType(typename: string): boolean {
        return _.includes(['string', 'number', 'boolean', 'Date'],
                          typename.replace("[]",""));
    }

    let declarations: {[key:string]:string} = {};
    _.forEach(usedDeclaration, (declInfo) => {
        if (interfaces[declInfo.name]) {
            return;
        }
        var code = source.text.slice(declInfo.begin, declInfo.end).trim();
        if (!code.startsWith('export')) {
            code = 'export ' + code;
        }
        declarations[declInfo.name] = code;
    });

    return {
        interfaces: interfaces,
        declarations: declarations,
        imports: usedImports
    };
}
