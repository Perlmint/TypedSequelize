"use strict";
const path_1 = require('path');
const util_1 = require('./util');
const decorator_1 = require('./decorator');
const sprintf_js_1 = require('sprintf-js');
const _ = require("lodash");
;
function makeProperty(prop, prefix = "") {
    if (prefix !== "") {
        prefix += "_";
    }
    let name = prefix + prop.name;
    let propDef = sprintf_js_1.sprintf(`    '%s': {
      type: sequelize.`, name);
    let getter = null, setter = null, concreteType;
    if (prop.option.embeded !== null) {
        propDef = _.map(prop.option.embeded, (embeded) => makeProperty(embeded, name)).concat(propDef).join(",\n");
        concreteType = "VIRTUAL";
        getter = "        return {\n" + _.map(prop.option.embeded, (embeded) => sprintf_js_1.sprintf("          '%s': this.get('%s_%s')", embeded.name, name, embeded.name)).join(',\n') + "\n        };";
        setter = _.map(prop.option.embeded, (embeded) => sprintf_js_1.sprintf("        this.setDataValue('%s_%s', val.%s);", name, embeded.name, embeded.name)).join('\n');
    }
    else if (prop.option.arrayJoinedWith !== null) {
        concreteType = "STRING";
        getter = sprintf_js_1.sprintf("        return (<string>this.getDataValue('%s') || '').split('%s');", name, prop.option.arrayJoinedWith);
        setter = sprintf_js_1.sprintf("        this.setDataValue('%s', val.join('%s'));", name, prop.option.arrayJoinedWith);
    }
    else {
        concreteType = decorator_1.SequelizeMap[prop.option.concreteType];
    }
    propDef += concreteType;
    if (prop.option.primaryKey) {
        propDef += ",\n      primaryKey: true";
    }
    if (getter !== null) {
        propDef += sprintf_js_1.sprintf(`,
      get: function(): %s {
%s
      }`, util_1.tsTypeToString(prop.tsType), getter);
    }
    if (setter !== null) {
        propDef += sprintf_js_1.sprintf(`,
      set: function(val: %s) {
%s
      }`, util_1.tsTypeToString(prop.tsType), setter);
    }
    return propDef + "\n    }";
}
function writeInterface(stream, interf, name) {
    stream.write(sprintf_js_1.sprintf("export interface %sInterface {\n", name));
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
        stream.write(sprintf_js_1.sprintf("    %s?: %s;\n", prop.name, util_1.tsTypeToString(prop.tsType)));
    });
    stream.write("}\n\n");
}
function writeModelDef(stream, interf, name) {
    stream.write(sprintf_js_1.sprintf("interface %sInstance extends sequelize.Instance<%sInterface>, %sInterface {}\n\n", name, name, name));
    stream.write(sprintf_js_1.sprintf("interface %sModel extends sequelize.Model<%sInstance, %sInterface> {}\n\n", name, name, name));
    stream.write(sprintf_js_1.sprintf("var %sInitialized: boolean = false;\n", name));
    stream.write(sprintf_js_1.sprintf("export var %s: %sModel;\n", name, name));
    stream.write(sprintf_js_1.sprintf(`export function init%s(seq: sequelize.Sequelize): void {
  if (%sInitialized) {
    return;
  }

`, name, name));
    stream.write(sprintf_js_1.sprintf("  %s = <%sModel>seq.define<%sInstance, %sInterface>('%s', {\n", name, name, name, name, name));
    stream.write(_.map(interf.properties, (prop) => makeProperty(prop)).join(',\n'));
    stream.write("\n");
    stream.write("  }, {");
    let embeded = _.filter(interf.properties, (prop) => {
        return !prop.option.embeded;
    });
    stream.write("  });\n\n");
    stream.write(sprintf_js_1.sprintf(`  %sInitialized = true;
}`, name));
}
function writeModel(info, writeInfo) {
    let stream = writeInfo.outStream;
    // write typings reference
    stream.write(sprintf_js_1.sprintf("/// <reference path=\"%s\" />\n\n", path_1.relative(writeInfo.outDir, path_1.join(writeInfo.rootDir, "typings/index.d.ts"))
        .replace(new RegExp("\\\\", "g"), "/")));
    // write dependency - sequelize
    stream.write("import * as sequelize from 'sequelize';\n\n");
    // write dependencies - user defined types
    function writeDependency(stream) {
        _.forEach(info.imports, (items, moduleName) => {
            if (moduleName[0] === ".") {
                moduleName = path_1.relative(writeInfo.outDir, path_1.join(path_1.dirname(writeInfo.srcPath), moduleName))
                    .replace(new RegExp("\\\\", "g"), "/");
            }
            stream.write(sprintf_js_1.sprintf("import { %s } from '%s';\n", items.join(", "), moduleName));
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
        stream.write(sprintf_js_1.sprintf("  init%s(seq);\n", name));
    });
    stream.write("};");
}
exports.writeModel = writeModel;
