/*
 * (C) 2015 Seth Lakowske
 */

var test    = require('tape');
var pg      = require('pg');
var dbutil  = require('./db-util');

imageFields = [
    {name : 'id', type: 'text', predicate : 'primary key'},
    {name : 'name', type: 'text', predicate : 'not null'},
    {name : 'description', type : 'text'},
    {name : 'width', type : 'integer'},
    {name : 'height', type : 'integer'},
    {name : 'radius', type : 'float(53)'},
    {name : 'x', type : 'integer'},
    {name : 'y', type : 'integer'},
    {name : 'orientation', type : 'float(53)[3][3]'},
    {name : 'rotation', type : 'float(53)[4][4]'}
]


test('can create image table', function(t) {

    var user = process.env['USER']
    var connection = 'postgres://'+user+'@localhost/image';

    var client = new pg.Client(connection);

    client.connect(function(err) {

        if (err) {
            return console.error('error fetching client from pool', err);
        }

        client.query(dbutil.createTableString('image', imageFields), function(err, result) {
            
            t.notOk(err);

            dbutil.dropTable('image', client, function(err, result) {
                t.notOk(err);
                client.end();
                t.end();
            });

        })

    })

})

test('string creation', function(t) {

    var values = ['myid', 'wisconsin', 'nothing', 600, 400, 0.5, 0.4, 0.4, 400, 0, 0, 0];    
    var result = dbutil.updateString(dbutil.fieldNames(imageFields), values, 'image');
    t.equal(result, 'update image set (id, name, description, width, height, radius, x, y)  =  ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) where id = $1')
    var result = dbutil.insertString(dbutil.fieldNames(imageFields), values, 'image');
    t.equal(result, 'insert into image (id, name, description, width, height, radius, x, y) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ');

    t.end();
});

test('table creation string', function(t) {

    var result = dbutil.createTableString('image', imageFields);
    //console.log(result);
    t.equal(result, 'create table if not exists image (id text primary key, name text not null, description text, width integer, height integer, radius float(53), x integer, y integer) ');
    t.end();
})

test('can insert an image', function(t) {

    var user = process.env['USER'];
    var connection = 'postgres://'+user+'@localhost/request';

    var client = new pg.Client(connection);

    client.connect(function(err) {

        if (err) {
            return console.error('error fetching client from pool', err);
        }

        client.query(dbutil.createTableString('image', imageFields), function(err, result) {
            
            t.notOk(err);

            var object = {
                'id' : 'test-id',
                'name' : 'wisconsin',
                'description' : 'nothing',
                'width' : 640,
                'height': 480,
                'radius': 0.5,
                'x' : 1,
                'y' : 2,
            }
            
            dbutil.insert(object, dbutil.fieldNames(imageFields), 'image', client, function(err, result) {

                t.notOk(err);
                dbutil.dropTable('image', client, function(err, result) {
                    t.notOk(err);
                    client.end();
                    t.end();
                });

            })

        })

    })

})

test('can create an object', function(t) {

    var object = dbutil.getObject(imageFields);

    console.log(object);
    t.end();
})
