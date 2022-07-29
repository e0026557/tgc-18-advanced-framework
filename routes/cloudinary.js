const express = require('express');
const router = express.Router();

const cloudinary = require('cloudinary');

// Configure cloudinary
cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// This will be called by the cloudinary widget
router.get('/sign', async function(req, res) {
  const params_to_sign = JSON.parse(req.query.params_to_sign);

  // Retrieve the API secret
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Get the signature (CSRF from Cloudinary)
  const signature = cloudinary.utils.api_sign_request(params_to_sign, apiSecret);

  // Send back signature to cloudinary widget
  res.send(signature);
})

module.exports = router;