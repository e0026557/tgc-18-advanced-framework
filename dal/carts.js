const { CartItem } = require('../models');

const getCart = async function (userId) {
  return await CartItem.collection().where({
    user_id: userId
  }).fetch({
    require: false,
    withRelated: ['product', 'product.category'] // Name of the relationship
  })
}

// userId -- which user is adding the item
// productId -- which product is being added
// quantity -- the quantity of the product
const createCartItem = async function (userId, productId, quantity) {
  // The name of the Model is the table
  // an instance of the Model is one row in the table
  const cartItem = new CartItem({
    user_id: userId,
    product_id: productId,
    quantity: quantity
  });

  await cartItem.save();
  return cartItem;
}

const getCartItemByUserAndProduct = async function (userId, productId) {
  return await CartItem.where({
    user_id: userId,
    product_id: productId
  }).fetch({
    require: false // don't want this to cause exception if null
  });
}

const updateQuantity = async function (userId, productId, newQuantity) {
  const cartItem = await getCartItemByUserAndProduct(userId, productId);
  if (cartItem) {
    // update the cart item
    cartItem.set('quantity', newQuantity);
    await cartItem.save();
  }
  else {
    return false; // operation not successful
  }
}

const removeCartItem = async function (userId, productId) {
  const cartItem = await getCartItemByUserAndProduct(userId, productId);
  await cartItem.destroy();
  return true;
}

module.exports = { getCart, createCartItem, getCartItemByUserAndProduct, updateQuantity, removeCartItem };