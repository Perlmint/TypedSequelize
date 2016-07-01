import * as decorator from './src/decorator';
import * as parser from './src/parser';

export const DBTypes = decorator.DBTypes;
export const embededField = decorator.embededField;
export const primaryKey = decorator.primaryKey;
export const arrayJoinedWith = decorator.arrayJoinedWith;
export const concreteType = decorator.concreteType;
export const internal = decorator.internal;
export const parseDefinition = parser.parse;
