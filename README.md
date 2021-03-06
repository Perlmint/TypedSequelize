# TypedSequelize
typescript source generator for sequelize &amp; rpc  
*Code First* model

## How to use
### Model Definition
Just declare &amp; implement class.  
**_Not support inherit now_**  
**_Not support n:m relation now_**  
```
@model
export class Person {
    first_name: string;
    last_name: string;
    age: number;
}
```
### Source generation
run bin/cli.js  
`node bin/cli.js --outdir src/gen --inputs src/def/person.ts`

**src/gen/person_models.ts** will be generated.

Now you can use **Person** in **src/gen/person_models**.

or you can use *typedseq.json* as config file.  
below is an example that works same with above command.
```
{
  "outdir": "src/gen",
  "inputs": [
    "src/def/person.ts"
  ]
}
```
jsut run `node bin/cli.js`

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
See [Issues page](https://github.com/Perlmint/TypedSequelize/issues)
