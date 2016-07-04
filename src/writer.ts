/// <reference path="../typings/index.d.ts" />
import {ParsedInfo, Interface, Property} from './types';
import {ParsedPath, relative, join, dirname} from 'path';
import {WriteStream} from 'fs';
import {tsTypeToString} from './util';
import {SequelizeMap} from './decorator';
import {sprintf} from 'sprintf-js';
import * as _ from "lodash";

export interface WriteInfo {
    srcPath: string;
    outDir: string;
    rootDir: string;
    outStream: WriteStream;
    outName: string;
    outTypesStream: WriteStream;
    outTypesName: string;
};

function makeProperty(prop: Property, prefix: string = ""): string {
    if (prefix !== "") {
        prefix += "_";
    }
    let name = prefix + prop.name;
    let propDef = sprintf(`    '%s': {
      type: sequelize.`, name);
    let getter: string = null, setter: string = null, concreteType: string;
    if (prop.option.embeded !== null) {
        propDef = _.map(prop.option.embeded,
                        (embeded) => makeProperty(embeded, name)).concat(propDef).join(",\n");
        concreteType = "VIRTUAL";
        getter = "        return {\n" +_.map(prop.option.embeded,
                       (embeded) =>
                       sprintf("          '%s': this.get('%s_%s')",
                               embeded.name,
                               name,
                               embeded.name)).join(',\n') + "\n        };";
        setter = _.map(prop.option.embeded,
                       (embeded) =>
                       sprintf("        this.setDataValue('%s_%s', val.%s);",
                               name,
                               embeded.name,
                               embeded.name)).join('\n');
    }
    else if (prop.option.arrayJoinedWith !== null) {
        concreteType = "STRING";
        getter = sprintf("        return (<string>this.getDataValue('%s') || '').split('%s');",
                         name, prop.option.arrayJoinedWith);
        setter = sprintf("        this.setDataValue('%s', val.join('%s'));", name, prop.option.arrayJoinedWith);
    }
    else {
        concreteType = SequelizeMap[prop.option.concreteType];
    }
    propDef += concreteType;
    if (prop.option.primaryKey) {
        propDef += ",\n      primaryKey: true";
    }
    if (getter !== null) {
        propDef += sprintf(`,
      get: function(): %s {
%s
      }`, tsTypeToString(prop.tsType), getter);
    }
    if (setter !== null) {
        propDef += sprintf(`,
      set: function(val: %s) {
%s
      }`, tsTypeToString(prop.tsType), setter);
    }
    return propDef + "\n    }";
}

function writeInterface(stream: WriteStream, interf: Interface, name: string) {
    stream.write(sprintf("export interface %sInterface {\n", name));
    if (!interf.hasPrimaryKey) {
        stream.write(`    id: number; // auto generated property\n`);
    }
    if (interf.createdAt) {
        stream.write(`    ${interf.createdAt}: Date; // auto generated property\n`);
    }
    if (interf.updatedAt) {
        stream.write(`    ${interf.updatedAt}: Date; // auto generated property\n`);
    }
    _.forEach(interf.properties, (prop) => {
        stream.write(sprintf("    %s?: %s;\n", prop.name, tsTypeToString(prop.tsType)));
    });
    stream.write("}\n\n");
}

function writeModelDef(stream: WriteStream, interf: Interface, name: string) {
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
        _.map(interf.properties, (prop) => makeProperty(prop)).join(',\n'));
    stream.write("\n");
    stream.write("  }, {");
    let embeded = _.filter(interf.properties, (prop) => {
        return !prop.option.embeded;
    });
    stream.write("  });\n\n");
    stream.write(sprintf(`  %sInitialized = true;
}`, name));
}

export function writeModel(info: ParsedInfo, writeInfo: WriteInfo) {
    let stream = writeInfo.outStream;

    // write typings reference
    stream.write(sprintf("/// <reference path=\"%s\" />\n\n",
                         relative(writeInfo.outDir,
                                  join(writeInfo.rootDir,
                                       "typings/index.d.ts"))
                         .replace(new RegExp("\\\\", "g"), "/")));

    // write dependency - sequelize
    stream.write("import * as sequelize from 'sequelize';\n\n");

    // write dependencies - user defined types
    function writeDependency(stream: WriteStream) {
        _.forEach(info.imports, (items: string[], moduleName: string) => {
            if (moduleName[0] === ".") {
                moduleName = relative(writeInfo.outDir,
                                      join(dirname(writeInfo.srcPath), moduleName))
                    .replace(new RegExp("\\\\", "g"), "/");
            }
            stream.write(sprintf("import { %s } from '%s';\n",
                                 items.join(", "), moduleName));
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
        stream.write(sprintf("  init%s(seq);\n", name));
    });
    stream.write("};");
}
