const express = require('express');
const router = express.Router();
const cartServices = require('../services/carts');
const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.get('/', async function (req, res) {
  // NOTE: CANNOT RECEIVE/STORE USER'S CREDIT CARD INFORMATION -> go through stripe instead via payment session

  // Step 1: Create the line items
  // one line in the invoice is one line item
  // each item in the shopping cart will become line item
  const items = await cartServices.getCart(req.session.user.id);
  let lineItems = [];
  let meta = []; // metadata -- and we are going to store for each product id how many the user is buying
  for (let item of items) {
    // Each key in the line item is prefixed by stripe
    const eachLineItem = {
      // .related because we didn't toJSON items
      name: item.related('product').get('name'),
      amount: item.related('product').get('cost'),
      quantity: item.get('quantity'),
      currency: 'SGD'
    }

    // Check if there is an image
    if (item.related('product').get('image_url')) {
      // Stripe expects images to be an array
      eachLineItem.images = [item.related('product').get('image_url')];
    }

    lineItems.push(eachLineItem);
    meta.push({
      product_id: item.get('product_id'),
      quantity: item.get('quantity')
    })
  }

  // Step 2: create stripe payment
  // Note: the metadata must be a string
  let metaData = JSON.stringify(meta);
  // The key/value pairs in thhe payment are defined by stripe
  const payment = {
    payment_method_types: ['card'],
    line_items: lineItems,
    success_url: 'http://www.google.com', // url to direct to after successful payment
    cancel_url: 'http://www.yahoo.com',
    // in the metadata, the keys are up to us but the values MUST be a string
    metadata: {
      orders: metaData
    }
  }

  // Step 3: register the payment session
  let stripeSession = await Stripe.checkout.sessions.create(payment);

  // Step 4: use stripe to pay
  res.render('checkout/checkout', {
    sessionId: stripeSession.id,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  })
});

module.exports = router;