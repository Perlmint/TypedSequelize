/// <reference path="../../typings/index.d.ts" />

import * as sequelize from 'sequelize';


import {UserInterface} from './user_types';

interface UserInstance extends sequelize.Instance<UserInterface>, UserInterface {}

interface UserModel extends sequelize.Model<UserInstance, UserInterface> {}

var UserInitialized: boolean = false;
export var User: UserModel;
export function initUser(seq: sequelize.Sequelize): void {
  if (UserInitialized) {
    return;
  }

  User = <UserModel>seq.define<UserInstance, UserInterface>('User', {
    'username': {
      type: sequelize.STRING,
      primaryKey: true
    },
    'password': {
      type: sequelize.TEXT('medium')
    },
    'signupDate': {
      type: sequelize.DATE
    }
  }, {  });

  UserInitialized = true;
}

export function init(seq: sequelize.Sequelize): void {
  initUser(seq);
};