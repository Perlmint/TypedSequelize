/// <reference path="typings/index.d.ts" />
"use strict";
const sequelize = require("sequelize");
const user_types_1 = require("./user_types");
var UserInitialized = false;
function initUser(seq) {
    if (UserInitialized) {
        return exports.User;
    }
    exports.User = seq.define('User', {
        'username': {
            type: sequelize.STRING,
            primaryKey: true
        },
        'password': {
            type: sequelize.TEXT('medium')
        },
        'address_state': {
            type: sequelize.STRING
        },
        'address_addressLine1': {
            type: sequelize.STRING
        },
        'address_addressLine2': {
            type: sequelize.STRING
        },
        'address_postalCode': {
            type: sequelize.INTEGER
        },
        'address': {
            type: sequelize.VIRTUAL,
            get: function () {
                return {
                    const: ret = new user_types_1.Address(),
                    ret: .state = this.get('address_state'),
                    ret: .addressLine1 = this.get('address_addressLine1'),
                    ret: .addressLine2 = this.get('address_addressLine2'),
                    ret: .postalCode = this.get('address_postalCode')
                };
            },
            set: function (val) {
                this.setDataValue('address_state', val.state);
                this.setDataValue('address_addressLine1', val.addressLine1);
                this.setDataValue('address_addressLine2', val.addressLine2);
                this.setDataValue('address_postalCode', val.postalCode);
            }
        },
        'signupDate': {
            type: sequelize.DATE
        }
    }, {
        indexes: []
    });
    UserInitialized = true;
    return exports.User;
}
exports.initUser = initUser;
function init(seq) {
    initUser(seq);
}
exports.init = init;
;
