/// <reference path="../typings/index.d.ts" />
import {ParsedInfo} from './types';
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
};

export function writeModel(info: ParsedInfo, writeInfo: WriteInfo) {
    let stream = writeInfo.outStream;
    stream.write(sprintf("/// <reference path=\"%s\" />\n\n",
                         relative(writeInfo.outDir,
                                  join(writeInfo.rootDir,
                                       "typings/index.d.ts"))
                         .replace(new RegExp("\\\\", "g"), "/")));
    stream.write("import * as sequelize from 'sequelize';\n\n");
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
    _.forEach(info.interfaces, (interf, name) => {
        stream.write(sprintf("export interface %sInterface {\n", name));
        _.forEach(interf.properties, (prop) => {
            stream.write(sprintf("    %s?: %s;\n", prop.name, tsTypeToString(prop.tsType)));
        });
        stream.write("}\n\n");
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
            _.map(interf.properties, (prop) => {
                if (prop.option.embeded === null) {
                    return sprintf("    '%s': sequelize.%s", prop.name, SequelizeMap[prop.option.concretType])
                }
                else {
                    let def = sprintf(`    '%s': {
      type: sequelize.VIRTUAL,
      get: function(): %s {
        return {
%s
        };
      },
      set: function(val: %s) {
%s
      }
    }`,
                                      prop.name, tsTypeToString(prop.tsType),
                                      _.map(prop.option.embeded,
                                            (embeded) =>
                                            sprintf("          '%s': this.get('%s_%s')", embeded.name, prop.name, embeded.name)).join(',\n'),
                                      tsTypeToString(prop.tsType),
                                      _.map(prop.option.embeded,
                                            (embeded) =>
                                            sprintf("        this.setDataValue('%s_%s', val.%s);", prop.name, embeded.name, embeded.name)).join('\n'));
                    return (_.map(prop.option.embeded, (embeded) => {
                        return sprintf("    '%s_%s': sequelize.%s", prop.name, embeded.name, SequelizeMap[embeded.option.concretType]);
                    }).concat(def)).join(',\n');
                }
            }).join(',\n'));
        stream.write("\n");
        stream.write("  }, {");
        let embeded = _.filter(interf.properties, (prop) => {
            return !prop.option.embeded;
        });
        stream.write("  });\n\n");
        stream.write(sprintf(`  %sInitialized = true;
}`, name));
    });
    stream.write("\n\nexport function init(seq: sequelize.Sequelize): void {\n");
    _.forEach(info.interfaces, (interf, name) => {
        stream.write(sprintf("  init%s(seq);\n", name));
    });
    stream.write("};");
}
