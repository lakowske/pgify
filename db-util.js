/*
 * (C) 2015 Seth Lakowske
 */

var uuid         = require('node-uuid');

function dropTable(table, client, callback) {

    var dropRequests = 'drop table ' + table + ' cascade'

    client.query(dropRequests, callback);

}

/*
 * Create a table using the fields
 */
function createTableString(table, fields) {
    return 'create table if not exists '
        + table
        + fieldNames(fullFields(fields));
}

/*
 * Converts a list of fields containing names and predicates to
 * a list of field strings of the form 'field.name field.predicate'
 */
function fullFields(fields) {
    return fields.map(function(field) {
        return field.name + ' ' + field.predicate;
    })
}

/*
 * joins fields into a sql insert representation.
 */
function fieldNames(fields) {
    return ' (' + fields.join(', ') + ') ';
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
    client.query(cmd, values, callback);
}

function insertOrUpdate(object, validFields, table, client, callback) {

    //ensure an id
    if (object.id) {
        var id = object.id;
    } else {
        object.id = uuid.v4();
    }

    return insert(object, validFields, table, client, callback);

}

/*
 * insert a record with a given id, or null to generate a new record.
 *
 * fields   - list of field names with the id at index 0
 * values   - list of field values with the id value at index 0
 * table    - table name
 * client   - pg client object
 * callback - called when db response available.
 */
function insert(object, validFields, table, client, callback) {

    var v = values(validFields, object);
    var f = fields(validFields, object);

    var onInsert = function() {

        var cmd = insertString(f, v, table);

        client.query(cmd, v, function(err, result) {
            callback(err, result, object.id);
        })

    }

    exists(table, 'id', object.id, client, function(err, result) {
        if (err) console.error(err);
        if (result.rowCount > 0) {
            update(f, v, table, client, callback);
        } else {
            onInsert();
        }
    });

    return object.id;

}

function exists(table, field, value, client, callback) {
    var exists = 'select * from '+ table + ' where ' + field + ' = $1';

    client.query(exists, [value], function(err, result) {
        callback(err, result, true);
    });
}

function get(table, field, value, client, callback) {
    var select = 'select * from '+ table + ' where ' + field + ' = $1';

    client.query(select, [value], function(err, result) {
        callback(err, result, true);
    });
}

function all(table, client, callback) {

    var all = 'select * from '+ table;

    client.query(all, [], function(err, result) {
        callback(err, result);
    });

}

/*
 * Return the values in object specified in fields.  Returns the values in
 * the order the fields appear in fields list.
 */
function values(fields, object) {

    var vals = [];
    var keys = Object.keys(object);

    for (var i = 0 ; i < fields.length ; i++) {
        if (keys.indexOf(fields[i]) >= 0) {
            vals.push(object[fields[i]]);
        }
    }

    return vals;
    
}

/*
 * Return the fields in object.  Returns fields in
 * order they appear in fields list.
 */
function fields(fields, object) {

    var flds = [];
    var keys = Object.keys(object);
    
    for (var i = 0 ; i < fields.length ; i++) {
        if (keys.indexOf(fields[i]) >= 0) {
            flds.push(fields[i]);
        }
    }

    return flds;
    
}

module.exports.createTableString = createTableString;
module.exports.dropTable         = dropTable;
module.exports.insertOrUpdate    = insertOrUpdate;
module.exports.insert            = insert;
module.exports.update            = update;
module.exports.updateString      = updateString;
module.exports.insertString      = insertString;
module.exports.get               = get;
module.exports.all               = all;
module.exports.values            = values;
module.exports.fields            = fields;
