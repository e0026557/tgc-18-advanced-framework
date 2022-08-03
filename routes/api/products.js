const express = require('express');
const router = express.Router();
const { createProductForm } = require('../../forms');

const productDataLayer = require('../../dal/products');
const { route } = require('../landing');
const { Product } = require('../../models');

router.get('/', async function (req, res) {
  const products = await productDataLayer.getAllProducts();
  res.json(products);
})

router.post('/', async function (req, res) {
  // Not going to display form
  const allCategories = await productDataLayer.getAllCategories();
  const allTags = await productDataLayer.getAllTags();
  const productForm = createProductForm(allCategories, allTags);

  productForm.handle(req, {
    success: async function (form) {
      let { tags, ...productData } = form.data;
      const product = new Product(productData);
      await product.save();

      // Attach m:m relationship
      if (tags) {
        await product.tags().attach(tags.split(','));
      }
      res.json(product);
    },
    error: async function (form) {
      const errors = {}; // We can customise our own error messages instead of caolan's default
      // The error messages are inside form.fields
      for (let key in form.fields) {
        if (form.fields[key].error) {
          errors[key] = form.fields[key].error;
        }
      }
      res.status(400);
      res.json(errors);
    },
    empty: async function (form) {
      res.status(400);
      res.json({
        error: 'No data provided'
      });
    }
  })
})

module.exports = router;