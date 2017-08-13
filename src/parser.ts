import * as ts from "typescript";
import {DBTypes, DefaultDBType} from "./decorator";
import * as _ from "lodash";
import {InterfaceMap, ParsedInfo, PropertyOption, Interface,
        RelationshipType, Relationship} from "./types";
import {tsTypeToString} from "./util";

function getDecoratorName(decorator: ts.Decorator): string {
    
    switch (decorator.expression.kind) {
        case ts.SyntaxKind.Identifier:
            {
                const id = (decorator.expression as ts.Identifier);
                return id.text;
            }
        case ts.SyntaxKind.CallExpression:
            {
                const call = (decorator.expression as ts.CallExpression);
                return (call.expression as ts.Identifier).text;
            }
    }
    return null;
}

function getDecoratorArgs(decorator: ts.Decorator): ts.Expression[] {
    if (decorator.expression.kind === ts.SyntaxKind.CallExpression) {
        const call = (decorator.expression as ts.CallExpression);
        return call.arguments.map<ts.Expression>((v) => { return v; });
    }
    return [];
}

export function parse(fileName: string): ParsedInfo {
    let program = ts.createProgram([fileName], {
        target: ts.ScriptTarget.ES2015
    });
    var source = program.getSourceFile(fileName); //ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES5, true);
    var typeChecker = program.getTypeChecker();
    var interfaces : InterfaceMap = {};

    var imports: {[key:string]:string} = {};
    var usedImports: {[key:string]:string[]} = {};
    var usedDeclaration: {
        name: string;
        begin: number;
        end: number;
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
            _.findIndex(node.decorators,
                (d: ts.Decorator) => getDecoratorName(d) === "model") === -1) {
            return;
        }

        let t = typeChecker.getTypeAtLocation(node);
        let name = t.getSymbol().getName();
        let newInterface: Interface = {
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
            const info = parseProperty(prop.getDeclarations()[0] as ts.PropertyDeclaration);
            if (info == null) {
                continue;
            }

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
                    index = newInterface.indexes[info[3]] = {unique: false, fields: []};
                }
                index.fields.push(propName);
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
            arrayJoinedWith: null,
            associated: null
        };

        if (decorators === undefined) {
            return ret;
        }
        for (var decorator of decorators) {
            let name: string = getDecoratorName(decorator);
            const args = getDecoratorArgs(decorator);
            switch (name) {
            case "internal":
                ret.internal = true;
                break;
            case "concreteType":
                ret.concreteType = DBTypes[(args[0] as ts.PropertyAccessExpression).name.text as keyof typeof DBTypes];
                break;
            case "embededField":
                ret.embeded = [];
                break;
            case "primaryKey":
                ret.primaryKey = true;
                break;
            case "arrayJoinedWith":
                ret.arrayJoinedWith = (<ts.StringLiteral>args[0]).text;
                break;
            }
        }
        return ret;
    }

    function parseProperty(decl: ts.PropertyDeclaration): [PropertyOption, ts.Type, Relationship, string] {
        let ret: PropertyOption = {
            concreteType: null,
            embeded: null,
            internal: false,
            primaryKey: false,
            arrayJoinedWith: null,
            associated: null
        };
        if (decl.kind != ts.SyntaxKind.PropertyDeclaration) {
            return;
        }
        var decorators = decl.decorators;
        let propType = typeChecker.getTypeAtLocation(decl.type);
        let tsType: string = tsTypeToString(propType);
        let baseType: string = tsType.replace("[]", "");
        let typeDecl: ts.Declaration = null;
        let relationship: Relationship = null;
        let index: string = null;
        let isArray: boolean = false;
        if (propType.symbol) {
            if (propType.symbol.name === "Array") {
                isArray = true;
                if ((propType as ts.GenericType).typeArguments[0].symbol) {
                    typeDecl = (propType as ts.GenericType).typeArguments[0].symbol.declarations[0];
                }
            }
            else {
                typeDecl = propType.symbol.declarations[0];
            }
        }

        const indexInfo = _.find(decorators, (dec) => getDecoratorName(dec) === "Index");
        if (indexInfo !== undefined) {
            const args = getDecoratorArgs(indexInfo);
            index = (args[0] as ts.StringLiteral).text;
        }
        // import
        if (typeDecl) {
            let moduleName = imports[baseType];
            let typeDecoratorNames = _.map(typeDecl.decorators, getDecoratorName);
            if (_.includes(typeDecoratorNames, "model")) {
                // model - relation
                relationship = {
                    type: isArray?RelationshipType.OneToMany:RelationshipType.ManyToOne,
                    name : null,
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
        // declared in same file or default
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
            if (DefaultDBType.has(tsType)) {
                ret.concreteType = DefaultDBType.get(tsType);
            }
            else if (ret.embeded != null) {
                for (var embededProp of typeChecker.getPropertiesOfType(propType)) {
                    let name = embededProp.getName();
                    let info = parseProperty(<ts.PropertyDeclaration>embededProp.getDeclarations()[0]);
                    if (info == null) {
                        continue;
                    }
                    ret.embeded.push({
                        name: name,
                        option: info[0],
                        tsType: info[1]
                    });
                }
            } else if (propType.flags & ts.TypeFlags.Enum || propType.flags & ts.TypeFlags.EnumLiteral) {
                ret.concreteType = DBTypes.Int;
            }
        }
        return [ret, propType, relationship, index];
    }

    function isNodeType(typename: string): boolean {
        return _.includes(["string", "number", "boolean", "Date"],
                          typename.replace("[]",""));
    }

    const declarations: {[key:string]:string} = {};
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
