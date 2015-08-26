/*
 * (C) 2015 Seth Lakowske
 */

var test    = require('tape');
var pg      = require('pg');
var image   = require('./image');
var dbutil  = require('./db-util');

test('can create image table', function(t) {

    var user = process.env['USER']
    var connection = 'postgres://'+user+'@localhost/image';

    var client = new pg.Client(connection);

    client.connect(function(err) {

        if (err) {
            return console.error('error fetching client from pool', err);
        }

        image.imageTable(client, function(err, result) {
            
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
    var result = dbutil.updateString(image.fields, values, 'image');
    t.equal(result, 'update image set (image_id, name, description, width, height, radius, x, y)  =  ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) where image_id = $1')
    var result = dbutil.insertString(image.fields, values, 'image');
    t.equal(result, 'insert into image (image_id, name, description, width, height, radius, x, y) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ');

    t.end();
});

test('table creation string', function(t) {

    var result = dbutil.createTableString('image', image.imageFields);
    //console.log(result);
    t.equal(result, 'create table if not exists image (image_id text primary key, name text not null, description text, width numeric, height numeric, radius numeric, x numeric, y numeric) ');
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

        image.imageTable(client, function(err, result) {
            
            t.notOk(err);
            var values = ['wisconsin', 'nothing', 600, 400, 0.5, 0.4, 0.4];
            dbutil.insert(null, image.fields, values, 'image', client, function(err, result) {

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
