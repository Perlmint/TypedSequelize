/// <reference path="../typings/index.d.ts" />
import {model, embededField} from 'TypedSequelize';
import {Name} from './name';

@model()
export class Person {
    @embededField()
    name: Name;
    age: number;
}
