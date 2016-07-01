import {internal, concretType, DBTypes, primaryKey} from "../src/decorator";

class User {
    @primaryKey()
    username: string

    @internal()
    @concretType(DBTypes.Mediumtext)
    password: string

    signupDate: Date
}
