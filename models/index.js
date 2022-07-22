const bookshelf = require('../bookshelf'); // By default, if we importing/requiring a folder, NodeJS will look for the index.js

// A Bookshelf Model represents one table
// the name of the model (the first arg) must be the SINGULAR form of the table name and the first letter MUST be uppercase
const Product = bookshelf.model('Product', {
  tableName: 'products'
})

module.exports = { Product };