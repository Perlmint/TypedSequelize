"use strict";
(function (RelationshipType) {
    RelationshipType[RelationshipType["OneToMany"] = 0] = "OneToMany";
    RelationshipType[RelationshipType["ManyToMany"] = 1] = "ManyToMany";
    RelationshipType[RelationshipType["ManyToOne"] = 2] = "ManyToOne";
})(exports.RelationshipType || (exports.RelationshipType = {}));
var RelationshipType = exports.RelationshipType;
;
;
