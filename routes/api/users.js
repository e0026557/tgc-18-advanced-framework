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

const { User, BlacklistedToken } = require('../../models');

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

    const refreshToken = generateAccessToken(
      user.get('username'),
      user.get('id'),
      user.get('email'),
      process.env.REFRESH_TOKEN_SECRET,
      '7d'
    );

    res.json({
      accessToken: accessToken,
      refreshToken: refreshToken
    });
  } else {
    // error
    res.status(401);
    res.json({
      error: 'Invalid email or password'
    });
  }
});

router.get('/profile', checkIfAuthenticatedJWT, function (req, res) {
  const user = req.user;
  res.json(user);
});

// This route to get new access token
router.post('/refresh', async function (req, res) {
  // Get the refreshToken from the body (need not be in authorisation header for refresh tokens)
  const refreshToken = req.body.refreshToken;

  if (refreshToken) {
    // Check if the token is already blacklisted
    const blacklistedToken = await BlacklistedToken.where({
      token: refreshToken
    }).fetch({
      require: false
    });

    // if the blacklistedToken is NOT null, then it means it exists and was blacklisted
    if (blacklistedToken) {
      res.status(400);
      res.json({
        error: 'Refresh token has been blacklisted'
      })
      return; // end function
    }

    // verify if legit
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      function (err, tokenData) {
        if (!err) {
          // Generate new access token
          const accessToken = generateAccessToken(
            tokenData.username,
            tokenData.id,
            tokenData.email,
            process.env.TOKEN_SECRET, // Note we are creating new access token not refresh token
            '1h'
          );

          res.json({
            accessToken: accessToken
          });
        } else {
          res.status(400);
          res.json({
            error: 'Invalid refresh token'
          });
        }
      }
    );
  } else {
    res.status(400);
    res.json({
      error: 'No refresh token found'
    });
  }
});

router.post('/logout', async function (req, res) {
  const refreshToken = req.body.refreshToken;
  if (refreshToken) {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async function (err, tokenData) {
      // add refresh token to black list
      if (!err) {
        const token = new BlacklistedToken();
        token.set('token', refreshToken);
        token.set('date_created', new Date());
        await token.save();
        res.json({
          'message': 'Logged out'
        })
      }
    })
  }
  else {
    res.status(400);
    res.json({
      error: 'No refresh token found'
    })
  }
})

module.exports = router;
