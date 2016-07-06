import {internal, concreteType, DBTypes, primaryKey} from "../src/decorator";

export class User {
    @primaryKey()
    username: string

    @internal()
    @concreteType(DBTypes.Mediumtext)
    password: string

    signupDate: Date
}
