/// <reference path="../../typings/index.d.ts" />

import * as sequelize from 'sequelize';

import { Name } from '../name';

export interface PersonInterface {
    name?: Name;
    age?: number;
}

interface PersonInstance extends sequelize.Instance<PersonInterface>, PersonInterface {}

interface PersonModel extends sequelize.Model<PersonInstance, PersonInterface> {}

var PersonInitialized: boolean = false;
export var Person: PersonModel;
export function initPerson(seq: sequelize.Sequelize): void {
  if (PersonInitialized) {
    return;
  }

  Person = <PersonModel>seq.define<PersonInstance, PersonInterface>('Person', {
    'name_first': {
      type: sequelize.STRING
    },
    'name_last': {
      type: sequelize.STRING
    },
    'name': {
      type: sequelize.VIRTUAL,
      get: function(): Name {
        return {
          'first': this.get('name_first'),
          'last': this.get('name_last')
        };
      },
      set: function(val: Name) {
        this.setDataValue('name_first', val.first);
        this.setDataValue('name_last', val.last);
      }
    },
    'age': {
      type: sequelize.INTEGER
    }
  }, {  });

  PersonInitialized = true;
}

export function init(seq: sequelize.Sequelize): void {
  initPerson(seq);
};