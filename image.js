/*
 * (C) 2015 Seth Lakowske
 */

var fields = ['image_id', 'name', 'description', 'width', 'height', 'radius',
              'x', 'y', 'z', 'angleX', 'angleY', 'angleZ']

/*
 * Defines an image and its parameters
 */
function imageTable(client, callback) {

    var create = 'create table if not exists image ('
            + 'image_id text primary key,'
            + 'name text not null,'
            + 'description text,'
            + 'width numeric,'
            + 'height numeric,'
            + 'radius numeric,'
            + 'x numeric,'
            + 'y numeric,'
            + 'z numeric,'
            + 'angleX numeric,'
            + 'angleY numeric,'
            + 'angleZ numeric)'

    console.log(create);

    client.query(create, callback);

}


module.exports.imageTable = imageTable;
module.exports.fields     = fields;
