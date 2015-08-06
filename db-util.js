/*
 * (C) 2015 Seth Lakowske
 */

var uuid         = require('node-uuid');

function dropTable(table, client, callback) {

    var dropRequests = 'drop table ' + table + ' cascade'

    client.query(dropRequests, callback);

}

/*
 * joins fields into a sql insert representation.
 */
function fieldNames(fields) {
    return ' (' + fields.join() + ') ';
}

function fieldValues(values) {
    var output = ' (';
    for (var i = 1 ; i < values.length ; i++) {
        output += '$'+i+',';
    }
    output += '$'+values.length+') ';
    return output;
}

function insertString(fields, values, table) {
    return 'insert into ' + table + fieldNames(fields) + 'VALUES' + fieldValues(values);
}

function updateString(fields, values, table) {
    return 'update ' + table + ' set' + fieldNames(fields) + ' = ' + fieldValues(values)
        + 'where ' + fields[0] + ' = $1';
}

function update(fields, values, table, client, callback) {
    var cmd = updateString(fields, values, table);

    client.query(cmd, values, function(err, result) {
        if (err) console.log(err);
        callback(err, result)
    });
}

/*
 * insert a record with a given id, or null to generate a new record.
 *
 * id       - optional id
 * fields   - list of field names including the id
 * values   - list of field values excluding the id value
 * table    - table name
 * client   - pg client object
 * callback - called when db response available.
 */
function insert(id, fields, values, table, client, callback) {

    var insertId = uuid.v4();
    
    if (id === null) id = insertId;
    
    var onInsert = function() {

        values.unshift(id);
        
        var cmd = insertString(fields, values, table);

        client.query(cmd, values, function(err, result) {
            callback(err, result, id);
        })

    }

    exists(table, fields[0], id, client, function(err, result) {
        if (err) console.log(err);
        if (result.rowCount > 0) {
            update(fields, values, table, client, callback);
        } else {
            onInsert();
        }
    });

    return insertId;

}

function exists(table, field, value, client, callback) {
    var exists = 'select * from '+ table + ' where ' + field + ' = $1';

    client.query(exists, [value], function(err, result) {
        callback(err, result, true);
    });
}

module.exports.dropTable    = dropTable;
module.exports.insert       = insert;
module.exports.updateString = updateString;
module.exports.insertString = insertString;
