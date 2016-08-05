import {model, internal, concreteType, DBTypes, primaryKey, embededField} from "../src/decorator";

class Address {
    state: string
    addressLine1: string
    addressLine2: string
    postalCode: number
}

@model()
export class User {
    @primaryKey()
    username: string

    @internal()
    @concreteType(DBTypes.Mediumtext)
    password: string

    @embededField()
    address: Address

    signupDate: Date
}
