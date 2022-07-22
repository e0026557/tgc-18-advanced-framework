const express = require("express");
const router = express.Router();

// Import in the Product model
const { Product } = require('../models'); // Can omit index.js since that is the default file that NodeJS will look for
const { createProductForm, bootstrapField } = require('../forms');

router.get("/", async function (req, res) {
  // Fetch all the products
  // use the bookshelf syntax
  // -> select * from products
  let products = await Product.collection().fetch();
  res.render("products/index", {
    products: products.toJSON()
  });
});

router.get("/create", function (req, res) {
  // Create an instance of form
  const productForm = createProductForm();
  res.render('products/create', {
    // Get a HTML version of the form formatted using bootstrap field function
    form: productForm.toHTML(bootstrapField)
  })
});

router.post('/create', async function (req, res) {
  const productForm = createProductForm();
  productForm.handle(req, {
    'success': async function (form) {
      // success function is called when there is no validation error
      // the form argument contains what the user has typed in (form.data instead of req.body)

      // we need to do the eqv. of INSERT INTO products (name, description, cost) VALUES (form.data.name, form.data.description, form.data.cost)

      // the MODEL represents the table
      // ONE instance of the MODEL represents a row
      const product = new Product(); // create a new instance of the Product model
      product.set('name', form.data.name)
      product.set('description', form.data.description)
      product.set('cost', form.data.cost)

      // MUST REMEMBER TO SAVE (async)
      await product.save();
      res.redirect('/products')
    },
    'error': function (form) {
      // the error function is called if the form has validation error
      res.render('products/create', {
        form: form.toHTML(bootstrapField)
      })
    },
    'empty': function (form) {
      // the empty function is called if the form is not filled in at all
      res.render('products/create', {
        form: form.toHTML(bootstrapField)
      })
    }
  })
})

// Export router function
module.exports = router;
