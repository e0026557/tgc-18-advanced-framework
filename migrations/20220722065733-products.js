'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  // Note: not null is true by default
  // First arg of createTable is the name of the table
  // Second arg is an object of options, to define 
  return db.createTable('products', {
    'id': {
      type: 'int',
      primaryKey: true,
      autoIncrement: true,
      unsigned: true
    }, // => id int unsigned primary key auto_increment
    'name': {
      type: 'string',
      length: 100,
      notNull: false
    }, // => name varchar(100) not null
    'cost': 'int', // just a normal integer
    'description': 'text' // => description text
  });
};

exports.down = function(db) {
  return db.dropTable('products');
};

exports._meta = {
  "version": 1
};
