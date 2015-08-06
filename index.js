/*
 * (C) 2015 Seth Lakowske
 */

/*
 * Defines an image and its parameters
 */
function imageTable(client, callback) {

    var create = 'create table if not exists requests ('
            + 'image_id text primary key,'
            + 'name text not null,'
            + 'description text,'
            + 'radius double,'
            + 'x double,'
            + 'y double,'
            + 'z double,'
            + 'angleX double,'
            + 'angleY double,'
            + 'angleZ double)'

    console.log(create);

    client.query(create, callback);

}


module.exports.imageTable = imageTable;

