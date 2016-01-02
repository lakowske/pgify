/*
 * (C) 2015 Seth Lakowske
 */

var uuid         = require('node-uuid');


function map(client, list, fn) {
    var index = 0;

    var seq = function(err, result) {
        if (err) {console.log(err)};
        index++;
        if (index < list.length) {
            fn(client, list[index], seq);
        }
    }

    fn(client, list[index], seq);
}

/*
 * Takes a list of functions with the call signature fn(client, cb(err, result))
 */
function compose(client, fns, callback) {
    var index = 0;
    var fn = fns[index];
    
    var seq = function(err, result) {
        if (err) {console.log(err)};
        index++;
        if (index < fns.length) {
            fn = fns[index];            
            fn(client, seq);
        } else {
            callback(err, result);
        }
    }

    fn(client, seq);
}

function dropTable(table, client, callback) {

    var dropRequests = 'drop table ' + table + ' cascade'

    client.query(dropRequests, callback);

}

/*
 * Create a sql string defining a table using the given fields and table args
 */
function createTableString(table, fields) {
    return 'create table if not exists '
        + table
        + joinFieldNames(fullFields(fields));
}

/*
 * Create a table
 */
function createTable(client, table, fields, callback) {

    var create = createTableString(table, fields);

    console.log(create);

    client.query(create, callback);

}

function dropAndCreateTable(client, table, fields, callback) {
    dropTable(table, client, function(err, result) {
        if (err) { console.log(err) }
        createTable(client, table, fields, callback);
    })
}

/*
 * Turn on ltree extension
 */
function ltree(client, callback) {

    client.query('CREATE EXTENSION ltree', callback);

}

/*
 * Converts a list of fields containing names and predicates to
 * a list of field strings of the form 'field.name field.predicate'
 */
function fullFields(fields) {
    return fields.map(function(field) {
        if (field.predicate)
            return field.name + ' ' + field.type + ' ' + field.predicate;
        
        return field.name + ' ' + field.type;
    })
}

function fieldNames(fields) {
    return fields.map(function(field) {return field.name});
}

/*
 * joins fields into a sql insert representation.
 */
function joinFieldNames(fields) {
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
    return 'insert into ' + table + joinFieldNames(fields) + 'VALUES' + fieldValues(values);
}

function upsertString(fields, values, table) {
    var f = fields.slice(0, values.length);
    
    var insertStr = insertString(f, values, table);
    insertStr += ' on conflict (' + f[0] + ') do update set' + joinFieldNames(f) + ' = ' + fieldValues(values)
        + 'where ' + table + '.' + f[0] + ' = $1';
    return insertStr;
}

function updateString(fieldNames, values, table) {
    return 'update ' + table + ' set' + joinFieldNames(fieldNames) + ' = ' + fieldValues(values)
        + 'where ' + fieldNames[0] + ' = $1';
}

function update(fields, values, table, client, callback) {
    var cmd = updateString(fields, values, table);
    client.query(cmd, values, callback);
}

/*
 * Insert a record or update if it already exists.
 *
 * @param {Object} object containing values to insert
 * @param {list} validFields to pick from object
 * @param {String} table name
 * @param {Object} client pg client object
 * @param {Function} callback called when db response available.
 */
function upsert(object, validFields, table, client, callback) {

    var v = values(validFields, object);
    var f = fields(validFields, object);

    var cmd = upsertString(f, v, table);

    client.query(cmd, v, function(err, result) {
        callback(err, result, object.id);
    })
    
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
 * insert a record.
 *
 * @param {Object} object containing values to insert
 * @param {list} validFields to pick from object
 * @param {String} table name
 * @param {Object} client pg client object
 * @param {Function} callback called when db response available.
 */
function insert(object, validFieldNames, table, client, callback) {

    var v = values(validFieldNames, object);
    var f = fields(validFieldNames, object);

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

/**
 * @param {List} fields list containing names and types to create an object from.
 * @return object
 */
function getObject(fields) {

    var object = {};

    fields.map(function(field) {
        object[field.name] = getValue(field.type, field.predicate);
    });

    return object;
}

function getValue(type, predicate) {
    var typeValues = {
        'text' : '',
        'integer' : 0,
        'float(53)' : 0.0,
        'float(53)[4][4]' : [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ],
        'float(53)[3][3]' : [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ]
    }

    if (type === 'text' && predicate === 'primary key') {
        return uuid.v4();
    }
    
    return typeValues[type];
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
 * the order they appear in fields list.
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
module.exports.createTable       = createTable;
module.exports.dropTable         = dropTable;
module.exports.insertOrUpdate    = insertOrUpdate;
module.exports.insert            = insert;
module.exports.upsert            = upsert;
module.exports.update            = update;
module.exports.updateString      = updateString;
module.exports.insertString      = insertString;
module.exports.upsertString      = upsertString;
module.exports.get               = get;
module.exports.all               = all;
module.exports.values            = values;
module.exports.fields            = fields;
module.exports.fieldNames        = fieldNames;
module.exports.getObject         = getObject;
module.exports.ltree             = ltree;
module.exports.compose           = compose;
module.exports.dropAndCreateTable = dropAndCreateTable;
