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

// IMPORTANT: MUST DELETE ALL PRODUCTS BEFORE 
// mysql will first create the col then add the fk
exports.up = function(db) {
  // first arg = table to be changed
  // second arg = name of new column
  // IMPORTANT: The name of the FK should be the other table in singular form with _ID at the back
  // third arg = object that define the column
  // the type must match the data type in the other table
  return db.addColumn('products', 'category_id', {
    type: 'int',
    unsigned: true,
    notNull: true,
    foreignKey: {
      name: 'product_category_fk',
      table: 'categories',
      mapping: 'id', // maps to id column of categories
      rules: {
        onDelete: 'cascade', // enable cascading delete (note this is dangerous)
        onUpdate: 'restrict'
      }
    }
  });
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
