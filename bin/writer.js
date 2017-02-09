"use strict";
/// <reference path="../typings/index.d.ts" />
const types_1 = require("./types");
const path_1 = require("path");
const util_1 = require("./util");
const decorator_1 = require("./decorator");
const _ = require("lodash");
;
function makeProperty(prop, prefix = "") {
    if (prefix !== "") {
        prefix += "_";
    }
    const name = prefix + prop.name;
    let propDef = `    '${name}': {
      type: sequelize.`;
    let getter = null, setter = null, concreteType;
    const typename = util_1.tsTypeToString(prop.tsType, prop.option.associated !== null);
    if (prop.option.embeded !== null) {
        propDef = _.map(prop.option.embeded, (embeded) => makeProperty(embeded, name)).concat(propDef).join(",\n");
        concreteType = "VIRTUAL";
        getter = `        const ret = new ${typename}();\n` + _.map(prop.option.embeded, (embeded) => `        ret.${embeded.name} = this.get('${name}_${embeded.name}')`).join(";\n") + "\n        return ret;";
        setter = _.map(prop.option.embeded, (embeded) => `        this.setDataValue('${name}_${embeded.name}', val.${embeded.name});`).join("\n");
    }
    else if (prop.option.arrayJoinedWith !== null) {
        concreteType = "STRING";
        getter = `        return (<string>this.getDataValue('${name}') || '').split('${prop.option.arrayJoinedWith}');`;
        setter = `        this.setDataValue('${name}', val.join('${prop.option.arrayJoinedWith}'));`;
    }
    else if (prop.option.associated !== null) {
        return null;
    }
    else {
        concreteType = decorator_1.SequelizeMap[prop.option.concreteType];
    }
    propDef += concreteType;
    if (prop.option.primaryKey) {
        propDef += ",\n      primaryKey: true";
    }
    if (getter !== null) {
        propDef += `,
      get: function(): ${typename} {
${getter}
      }`;
    }
    if (setter !== null) {
        propDef += `,
      set: function(val: ${typename}) {
${setter}
      }`;
    }
    return propDef + "\n    }";
}
function writeInterface(stream, interf, name) {
    stream.write(`export interface ${name}Interface {\n`);
    if (!interf.hasPrimaryKey) {
        stream.write(`    id?: number; // auto generated property\n`);
    }
    if (interf.createdAt) {
        stream.write(`    ${interf.createdAt}?: Date; // auto generated property\n`);
    }
    if (interf.updatedAt) {
        stream.write(`    ${interf.updatedAt}?: Date; // auto generated property\n`);
    }
    _.forEach(interf.properties, (prop) => {
        var typename = util_1.tsTypeToString(prop.tsType, prop.option.associated !== null);
        if (prop.option.associated === null) {
            stream.write(`    ${prop.name}?: ${typename};\n`);
        }
        else {
            stream.write(`    ${prop.name}Id?: number;\n`);
        }
    });
    stream.write("}\n\n");
}
function writeModelDef(stream, interf, name) {
    stream.write(`export interface ${name}Instance extends sequelize.Instance<${name}Interface>, ${name}Interface {`);
    _.forEach(interf.relationships, (rel) => {
        const capitalizedName = _.upperFirst(rel.name);
        const typeName = rel.targetName + "Interface";
        switch (rel.type) {
            case types_1.RelationshipType.OneToMany:
                stream.write(`
  get${capitalizedName}(): Promise<${typeName}[]>;
  set${capitalizedName}(vals: ${typeName}[]): Promise<${typeName}[]>;
  remove${capitalizedName}(val: ${typeName}): Promise<void>;
  add${capitalizedName}(val: ${typeName}): Promise<void>;`);
                break;
            case types_1.RelationshipType.ManyToOne:
                stream.write(`
  get${capitalizedName}(): Promise<${typeName}>;
  set${capitalizedName}(vals: ${typeName}): Promise<${typeName}>;`);
                break;
        }
    });
    stream.write("\n}\n\n");
    stream.write(`interface ${name}Model extends sequelize.Model<${name}Instance, ${name}Interface> {}\n\n`);
    stream.write(`var ${name}Initialized: boolean = false;\n`);
    stream.write(`export var ${name}: ${name}Model;\n`);
    stream.write(`export function init${name}(seq: sequelize.Sequelize): ${name}Model {
  if (${name}Initialized) {
    return ${name};
  }

`);
    stream.write(`  ${name} = <${name}Model>seq.define<${name}Instance, ${name}Interface>('${name}', {\n`);
    stream.write(_.filter(_.map(interf.properties, (prop) => makeProperty(prop))).join(",\n"));
    stream.write("  }, {");
    stream.write("\n");
    stream.write("    indexes: [\n");
    stream.write(_.map(interf.indexes, (index) => {
        const fields = index.fields.map((d) => `"${d}"`).join(", ");
        return `      {
        fields: [${fields}]
      }`;
    }).join(",\n"));
    stream.write("    ]");
    stream.write("  });\n");
    _.forEach(interf.relationships, (rel) => {
        let moduleName = "";
        if (rel.targetModule != undefined) {
            moduleName = `require('${rel.targetModule}_models').`;
        }
        stream.write(`
  // for setup relation. can't use import in funcion scope
  var ${rel.targetName} = ${moduleName}init${rel.targetName}(seq);`);
        switch (rel.type) {
            case types_1.RelationshipType.OneToMany:
                stream.write(`
  ${name}.hasMany(${rel.targetName}, {as: '${rel.name}'});`);
                break;
            case types_1.RelationshipType.ManyToOne:
                stream.write(`
  ${name}.belongsTo(${rel.targetName}, {as: '${rel.name}'});`);
        }
    });
    stream.write(`

  ${name}Initialized = true;
  return ${name};
}

`);
}
function writeModel(info, writeInfo) {
    const stream = writeInfo.outStream;
    // write typings reference
    const typingsPath = path_1.relative(writeInfo.outDir, path_1.join(writeInfo.rootDir, "typings/index.d.ts"))
        .replace(new RegExp("\\\\", "g"), "/");
    stream.write(`/// <reference path="${typingsPath}" />\n\n`);
    // write dependency - sequelize
    stream.write("import * as sequelize from 'sequelize';\n\n");
    // write dependencies - user defined types
    function writeDependency(stream) {
        _.forEach(info.imports, (items, moduleName) => {
            if (moduleName[0] === ".") {
                moduleName = path_1.relative(writeInfo.outDir, path_1.join(path_1.dirname(writeInfo.srcPath), moduleName))
                    .replace(new RegExp("\\\\", "g"), "/");
            }
            const joinedItems = _.uniq(items).join(", ");
            stream.write(`import { ${joinedItems} } from '${moduleName}';\n`);
        });
        stream.write("\n");
    }
    writeDependency(stream);
    writeDependency(writeInfo.outTypesStream);
    _.forEach(_.sortBy(_.keys(info.declarations)), (k) => {
        writeInfo.outTypesStream.write(info.declarations[k].replace(/\r\n|\r/g, "\n"));
        writeInfo.outTypesStream.write("\n\n");
    });
    var relationDeps = {};
    _.forEach(_.flatten(_.map(info.interfaces, "relationships")), (rel) => {
        if (rel.targetModule === undefined) {
            return;
        }
        if (!relationDeps[rel.targetModule]) {
            relationDeps[rel.targetModule] = [];
        }
        relationDeps[rel.targetModule].push(rel.targetName);
    });
    _.forEach(_.sortBy(_.keys(relationDeps)), (moduleName) => {
        var joinedItems = _.uniq(_.sortBy(_.map(relationDeps[moduleName], (v) => v + "Interface"))).join(", ");
        var importStr = `
import { ${joinedItems} } from '${moduleName}_types';`;
        stream.write(importStr);
    });
    writeInfo.outTypesStream.write("\n");
    _.forEach(info.interfaces, writeInterface.bind(null, writeInfo.outTypesStream));
    stream.write("import {");
    stream.write(_.map(info.interfaces, (i) => `${i.name}Interface`)
        .concat(_.keys(info.declarations))
        .join(", "));
    stream.write(`} from './${writeInfo.outTypesName}';\n\n`);
    _.forEach(info.interfaces, writeModelDef.bind(null, stream));
    // write init function
    stream.write("\n\nexport function init(seq: sequelize.Sequelize): void {\n");
    _.forEach(info.interfaces, (interf, name) => {
        stream.write(`  init${name}(seq);\n`);
    });
    stream.write("};");
}
exports.writeModel = writeModel;
