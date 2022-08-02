const express = require('express');
const router = express.Router();
const cartServices = require('../services/carts');
const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { checkIfAuthenticated } = require('../middlewares');

router.get('/', checkIfAuthenticated, async function (req, res) {
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
    success_url: process.env.STRIPE_SUCCESS_URL + '?sessionId={CHECKOUT_SESSION_ID}', // url to direct to after successful payment
    cancel_url: process.env.STRIPE_CANCEL_URL,
    // in the metadata, the keys are up to us but the values MUST be a string
    metadata: {
      orders: metaData,
      user_id: req.session.user.id
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

router.get('/success', checkIfAuthenticated, function (req, res) {
  res.send('payment success');
})

router.get('/cancel', checkIfAuthenticated, function (req, res) {
  res.send('payment cancelled');
})

// WEBHOOK FOR STRIPE
// Note: must exclude csrf for this part
// IMPORTANT: POST -> we are changing our database on based on payment info and this is also what Stripe decided
// IMPORTANT: REQUIRE MIDDLEWARE OTHERWISE WON'T WORK
router.post('/process_payment', express.raw({
  type: 'application/json'
}), async function (req, res) {
  let payload = req.body; // payment information is inside req.body
  let endpointSecret = process.env.STRIPE_ENDPOINT_SECRET; // each webhook will have one endpoint secret (ensure that Stripe is the one that is sending the information to us and not someone else)

  let sigHeader = req.headers['stripe-signature']; // when stripe sends us the information, there will be a signature and the key will be 'stripe-signature'
  let event = null;

  // try to extract out the information and ensures that it is legit (actually comes from Stripe)
  try {
    event = Stripe.webhooks.constructEvent(payload, sigHeader, endpointSecret);

    if (event.type == 'checkout.session.completed') {
      console.log(event.data.object);
      const metadata = JSON.parse(event.data.object.metadata.orders);
      console.log(metadata);
      res.send({
        success: true
      });
    } // checkout.session.completed -> payment is done
  }
  catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
})

module.exports = router;