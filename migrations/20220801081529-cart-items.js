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
  return db.createTable('cart_items', {
    id: {
      type: 'int',
      unsigned: true,
      primaryKey: true,
      autoIncrement: true
    },
    quantity: {
      type: 'int', // should use smaller int data type since no need so much quantity
      unsigned: true
    },
    user_id: {
      type: 'int',
      unsigned: true,
      notNull: true, // compulsory
      foreignKey: {
        name: 'cart_items_user_fk',
        table: 'users',
        mapping: 'id',
        rules: {
          onDelete: 'cascade', // if delete users, all cart items related to user will be deleted
          onUpdate: 'restrict'
        }
      }
    },
    product_id: {
      type: 'int',
      unsigned: true,
      notNull: true, // compulsory
      foreignKey: {
        name: 'cart_items_product_fk',
        table: 'products',
        mapping: 'id',
        rules: {
          onDelete: 'cascade', // if delete product, all cart items related to product will be deleted
          onUpdate: 'restrict'
        }
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
