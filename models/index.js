const bookshelf = require('../bookshelf'); // By default, if we importing/requiring a folder, NodeJS will look for the index.js

// A Bookshelf Model represents one table
// the name of the model (the first arg) must be the SINGULAR form of the table name and the first letter MUST be uppercase
const Product = bookshelf.model('Product', {
  tableName: 'products',
  // the name of the function is the name of the relationshi
  // the name must match the model name, but singular and always lowercase
  category: function () {
    return this.belongsTo('Category');
  }
})

const Category = bookshelf.model('Category', {
  tableName: 'categories',
  // the name of the function for a hasMany relationship should be the plural form of the corresponding model in plural form and all lowercase
  products: function () {
    return this.hasMany('Product')
  }
})

module.exports = { Product, Category };