const express = require('express');
const router = express.Router();

const productDataLayer = require('../../dal/products');

router.get('/', async function(req, res) {
  const products = await productDataLayer.getAllProducts();
  res.json(products);
})

module.exports = router;