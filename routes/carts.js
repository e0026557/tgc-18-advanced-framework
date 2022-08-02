const cartServices = require('../services/carts');
const express = require('express');
const router = express.Router();

router.get('/', async function (req, res) {
  const userId = req.session.user.id;
  const cartItems = await cartServices.getCart(userId);
  res.render('cart/index', {
    cartItems: cartItems.toJSON()
  })
})

router.get('/:product_id/add', async function (req, res) {
  const userId = req.session.user.id;
  const productId = req.params.product_id;
  await cartServices.addToCart(userId, productId, 1); // assume add 1

  req.flash('success_messages', 'Added to cart successfully');
  res.redirect('/cart/');
})

router.post('/:product_id/update', async function (req, res) {
  const userId = req.session.user.id;
  const productId = req.params.product_id;
  if (req.body.newQuantity > 0) {
    await cartServices.updateQuantity(userId, productId, req.body.newQuantity);
    req.flash('success_messages', 'Quantity has been updated');
    res.redirect('/cart');
  }
  else {
    req.flash('error_messages', 'Quantity must be greater than 0');
    res.redirect('/cart');
  }
})

router.get('/:product_id/delete', async function (req, res) {
  await cartServices.remove(req.session.user.id, req.params.product_id);
  req.flash('success_messages', 'Product has been removed from the cart');
  res.redirect('/cart');
})

module.exports = router;
