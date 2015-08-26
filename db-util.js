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
    
    for (var prop in object) {
        if (fields.indexOf(prop) > 0) {
            vals.push(object[prop]);
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
    
    for (var prop in object) {
        if (fields.indexOf(prop) > 0) {
            flds.push(prop);
        }
    }

    return flds;
    
}

module.exports.createTableString = createTableString;
module.exports.dropTable         = dropTable;
module.exports.insert            = insert;
module.exports.update            = update;
module.exports.updateString      = updateString;
module.exports.insertString      = insertString;
module.exports.get               = get;
module.exports.all               = all;
module.exports.values            = values;
module.exports.fields            = fields;
