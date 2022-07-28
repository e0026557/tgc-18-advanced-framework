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
  return db.createTable('products_tags', {
    id: {
      type: 'int',
      unsigned: true,
      primaryKey: true,
      autoIncrement: true
    },
    product_id: {
      type: 'int',
      notNull: true, 
      unsigned: true,
      foreignKey: {
        name: 'products_tags_product_fk',
        table: 'products',
        mapping: 'id',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT'
        }
      }
    },
    tag_id: {
      type: 'int',
      unsigned: true,
      notNull: true,
      foreignKey: {
        name: 'products_tags_tags_fk',
        table: 'tags',
        mapping: 'id',
        rules: {
          onUpdate: 'RESTRICT',
          onDelete: 'CASCADE'
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
