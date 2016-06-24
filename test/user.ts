import {internal, concretType, DBTypes} from "../src/decorator";

class User {
    username: string

    @internal()
    @concretType(DBTypes.Mediumtext)
    password: string

    signupDate: Date
}
