/// <reference path="../typings/index.d.ts" />
import {embededField} from 'TypedSequelize';
import {Name} from './name';

export class Person {
    @embededField()
    name: Name;
    age: number;
}
