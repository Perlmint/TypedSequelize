"use strict";
const path_1 = require('path');
const util_1 = require('./util');
const decorator_1 = require('./decorator');
const _ = require("lodash");
;
function makeProperty(prop, prefix = "") {
    if (prefix !== "") {
        prefix += "_";
    }
    let name = prefix + prop.name;
    let propDef = `    '${name}': {
      type: sequelize.`;
    let getter = null, setter = null, concreteType;
    if (prop.option.embeded !== null) {
        propDef = _.map(prop.option.embeded, (embeded) => makeProperty(embeded, name)).concat(propDef).join(",\n");
        concreteType = "VIRTUAL";
        getter = "        return {\n" + _.map(prop.option.embeded, (embeded) => `          '${embeded.name}': this.get('${name}_${embeded.name}')`).join(',\n') + "\n        };";
        setter = _.map(prop.option.embeded, (embeded) => `        this.setDataValue('${name}_${embeded.name}', val.${embeded.name});`).join('\n');
    }
    else if (prop.option.arrayJoinedWith !== null) {
        concreteType = "STRING";
        getter = `        return (<string>this.getDataValue('${name}') || '').split('${prop.option.arrayJoinedWith}');`;
        setter = `        this.setDataValue('${name}', val.join('${prop.option.arrayJoinedWith}'));`;
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
      get: function(): ${util_1.tsTypeToString(prop.tsType)} {
${getter}
      }`;
    }
    if (setter !== null) {
        propDef += `,
      set: function(val: ${util_1.tsTypeToString(prop.tsType)}) {
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
        stream.write(`    ${prop.name}?: ${util_1.tsTypeToString(prop.tsType)};\n`);
    });
    stream.write("}\n\n");
}
function writeModelDef(stream, interf, name) {
    stream.write(`interface ${name}Instance extends sequelize.Instance<${name}Interface>, ${name}Interface {}\n\n`);
    stream.write(`interface ${name}Model extends sequelize.Model<${name}Instance, ${name}Interface> {}\n\n`);
    stream.write(`var ${name}Initialized: boolean = false;\n`);
    stream.write(`export var ${name}: ${name}Model;\n`);
    stream.write(`export function init${name}(seq: sequelize.Sequelize): void {
  if (${name}Initialized) {
    return;
  }

`);
    stream.write(`  ${name} = <${name}Model>seq.define<${name}Instance, ${name}Interface>('${name}', {\n`);
    stream.write(_.map(interf.properties, (prop) => makeProperty(prop)).join(',\n'));
    stream.write("\n");
    stream.write("  }, {");
    let embeded = _.filter(interf.properties, (prop) => {
        return !prop.option.embeded;
    });
    stream.write("  });\n\n");
    stream.write(`  ${name}Initialized = true;
}`);
}
function writeModel(info, writeInfo) {
    let stream = writeInfo.outStream;
    // write typings reference
    let typings_path = path_1.relative(writeInfo.outDir, path_1.join(writeInfo.rootDir, "typings/index.d.ts"))
        .replace(new RegExp("\\\\", "g"), "/");
    stream.write(`/// <reference path="${typings_path}" />\n\n`);
    // write dependency - sequelize
    stream.write("import * as sequelize from 'sequelize';\n\n");
    // write dependencies - user defined types
    function writeDependency(stream) {
        _.forEach(info.imports, (items, moduleName) => {
            if (moduleName[0] === ".") {
                moduleName = path_1.relative(writeInfo.outDir, path_1.join(path_1.dirname(writeInfo.srcPath), moduleName))
                    .replace(new RegExp("\\\\", "g"), "/");
            }
            let joined_items = items.join(", ");
            stream.write(`import { ${joined_items} } from '${moduleName}';\n`);
        });
        stream.write("\n");
    }
    writeDependency(stream);
    writeDependency(writeInfo.outTypesStream);
    _.forEach(info.interfaces, writeInterface.bind(null, writeInfo.outTypesStream));
    stream.write('import {');
    stream.write(_.map(info.interfaces, (i) => `${i.name}Interface`).join(', '));
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
