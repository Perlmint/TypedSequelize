# TypedSequelize
typescript source generator for sequelize &amp; rpc

## How to use
### Model Definition
Just declare &amp; implement class.  
**_Not support inherit now_**  
**_Not support relation now_**  
```
export class Person {
    first_name: string;
    last_name: string;
    age: number;
}
```
### Source generation
run bin/cli.js  
`node bin/cli.js src/gen src/def/person.ts`

**src/gen/person_models.ts** will be generated.

Now you can use **Person** in **src/gen/person_models**.

### Decorators
- concreteType()
    - Specify Sequelize Type
- embededField()
    - Each fields are saved into seperated fields.
- primaryKey()
    - Set decorated property as primary key
- arrayJoinedWith(seperator: string)
    - Array is saved with specified seperator

## TODO
- relation
- inheritance
