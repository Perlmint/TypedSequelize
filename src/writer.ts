/// <reference path="../typings/index.d.ts" />
import {ParsedInfo, Interface, Property, RelationshipType} from './types';
import {ParsedPath, relative, join, dirname} from 'path';
import {WriteStream} from 'fs';
import {tsTypeToString} from './util';
import {SequelizeMap} from './decorator';
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
    let propDef = `    '${name}': {
      type: sequelize.`;
    let getter: string = null, setter: string = null, concreteType: string;
    if (prop.option.embeded !== null) {
        propDef = _.map(prop.option.embeded,
                        (embeded) => makeProperty(embeded, name)).concat(propDef).join(",\n");
        concreteType = "VIRTUAL";
        getter = "        return {\n" +_.map(prop.option.embeded,
                       (embeded) =>
                       `          '${embeded.name}': this.get('${name}_${embeded.name}')`).join(',\n') + "\n        };";
        setter = _.map(prop.option.embeded,
                       (embeded) =>
                       `        this.setDataValue('${name}_${embeded.name}', val.${embeded.name});`).join('\n');
    }
    else if (prop.option.arrayJoinedWith !== null) {
        concreteType = "STRING";
        getter = `        return (<string>this.getDataValue('${name}') || '').split('${prop.option.arrayJoinedWith}');`;
        setter = `        this.setDataValue('${name}', val.join('${prop.option.arrayJoinedWith}'));`;
    }
    else {
        concreteType = SequelizeMap[prop.option.concreteType];
    }
    propDef += concreteType;
    if (prop.option.primaryKey) {
        propDef += ",\n      primaryKey: true";
    }
    if (getter !== null) {
        propDef += `,
      get: function(): ${tsTypeToString(prop.tsType)} {
${getter}
      }`;
    }
    if (setter !== null) {
        propDef += `,
      set: function(val: ${tsTypeToString(prop.tsType)}) {
${setter}
      }`;
    }
    return propDef + "\n    }";
}

function writeInterface(stream: WriteStream, interf: Interface, name: string) {
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
        stream.write(`    ${prop.name}?: ${tsTypeToString(prop.tsType)};\n`);
    });
    stream.write("}\n\n");
}

function writeModelDef(stream: WriteStream, interf: Interface, name: string) {
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
    stream.write(
        _.map(interf.properties, (prop) => makeProperty(prop)).join(',\n'));
    stream.write("\n");
    stream.write("  }, {");
    let embeded = _.filter(interf.properties, (prop) => {
        return !prop.option.embeded;
    });
    stream.write("  });\n");
    _.forEach(interf.relationships, (rel) => {
        var module_name = rel.targetModule + '_models';
        stream.write(`
  // for setup relation. can't use import in funcion scope
  var ${rel.targetName} = require('${rel.targetModule}').${rel.targetName};`);
        switch (rel.type) {
        case RelationshipType.OneToMany:
            stream.write(`
  ${name}.hasMany(${rel.targetName}, {as: '${rel.name}'});`);
            break;
        case RelationshipType.ManyToOne:
            stream.write(`
  ${name}.belongsTo(${rel.targetName}, {as: '${rel.name}'});`);
        }
    });
    stream.write(`

  ${name}Initialized = true;
}

`);
}

export function writeModel(info: ParsedInfo, writeInfo: WriteInfo) {
    let stream = writeInfo.outStream;

    // write typings reference
    let typings_path = relative(writeInfo.outDir,
                                join(writeInfo.rootDir,
                                     "typings/index.d.ts"))
        .replace(new RegExp("\\\\", "g"), "/");
    stream.write(`/// <reference path="${typings_path}" />\n\n`);

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
            let joined_items = _.uniq(items).join(", ");
            stream.write(`import { ${joined_items} } from '${moduleName}';\n`);
        });
        stream.write("\n");
    }
    writeDependency(stream);
    writeDependency(writeInfo.outTypesStream);
    _.forEach(_.sortBy(_.keys(info.declarations)), (k) => {
        writeInfo.outTypesStream.write(info.declarations[k].replace(/\r\n|\r/g, "\n"));
        writeInfo.outTypesStream.write("\n\n");
    });

    _.forEach(info.interfaces, writeInterface.bind(null, writeInfo.outTypesStream));
    stream.write('import {');
    stream.write(
        _.map(info.interfaces, (i) => `${i.name}Interface`)
            .concat(_.keys(info.declarations))
            .join(', '));
    stream.write(`} from './${writeInfo.outTypesName}';\n\n`);
    _.forEach(info.interfaces, writeModelDef.bind(null, stream));

    // write init function
    stream.write("\n\nexport function init(seq: sequelize.Sequelize): void {\n");
    _.forEach(info.interfaces, (interf, name) => {
        stream.write(`  init${name}(seq);\n`);
    });
    stream.write("};");
}
