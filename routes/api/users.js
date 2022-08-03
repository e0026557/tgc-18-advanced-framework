const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { checkIfAuthenticatedJWT } = require('../../middlewares');


const generateAccessToken = function (
  username,
  id,
  email,
  tokenSecret,
  expiry
) {
  // 1st arg = payload (public accessible so no sensitive data)
  return jwt.sign(
    {
      username: username,
      id: id,
      email: email
    },
    tokenSecret,
    {
      expiresIn: expiry
    }
  );
};

const getHashedPassword = function (password) {
  const sha256 = crypto.createHash('sha256');
  // The output will be converted to hexdecimal
  const hash = sha256.update(password).digest('base64');
  return hash;
};

const { User } = require('../../models');

router.post('/login', async function (req, res) {
  const user = await User.where({
    email: req.body.email,
    password: getHashedPassword(req.body.password)
  }).fetch({
    require: false
  });

  // If the user is found
  if (user) {
    // Create the JWT
    const accessToken = generateAccessToken(
      user.get('username'),
      user.get('id'),
      user.get('email'),
      process.env.TOKEN_SECRET,
      '1h'
    );

    res.json({
      accessToken: accessToken
    });
  } else {
    // error
    res.status(401);
    res.json({
      error: 'Invalid email or password'
    });
  }
});

router.get('/profile', checkIfAuthenticatedJWT, function(req, res) {
  const user = req.user;
  res.json(user);
})

module.exports = router;
