/*
 * (C) 2015 Seth Lakowske
 */

var dbutil = require('./db-util');

module.exports.imageFields = [
    {name : 'id', predicate : 'text primary key'},
    {name : 'name', predicate : 'text not null'},
    {name : 'description', predicate : 'text'},
    {name : 'width', predicate : 'numeric'},
    {name : 'height', predicate : 'numeric'},
    {name : 'radius', predicate : 'numeric'},
    {name : 'x', predicate : 'numeric'},
    {name : 'y', predicate : 'numeric'}
]

module.exports.sceneNode = [
    {name : 'id', predicate : 'text primary key'},
    {name : 'name', predicate : 'text'},
    {name : 'parent', predicate : 'text'},
    {name : 'about_up', predicate : 'numeric not null'},
    {name : 'about_right', predicate : 'numeric not null'},
    {name : 'about_forward', predicate : 'numeric not null'},
    {name : 'x', predicate : 'numeric not null'},
    {name : 'y', predicate : 'numeric not null'},
    {name : 'z', predicate : 'numeric not null'}
]
    
var fields = module.exports.imageFields.map(function(field) {return field.name});
var sceneNodeFields = module.exports.sceneNode.map(function(field) {return field.name});
    
/*
 * Defines an image and its parameters
 */
function imageTable(client, callback) {

    var create = dbutil.createTableString('image', module.exports.imageFields);

    console.log(create);

    client.query(create, callback);

}

function sceneGraphTable(client, callback) {

    var create = dbutil.createTableString('sceneNode', module.exports.sceneNode);

    console.log(create);

    client.query(create, callback);

}


module.exports.imageTable      = imageTable;
module.exports.sceneGraphTable = sceneGraphTable;
module.exports.fields          = fields;
module.exports.sceneNodeFields = sceneNodeFields;
