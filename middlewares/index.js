const jwt = require('jsonwebtoken');

const checkIfAuthenticated = function (req, res, next) {
  const user = req.session.user;
  if (!user) {
    req.flash('error_messages', 'Only logged in users can access this page');
    res.redirect('/users/login');
  }
  else {
    next(); // pass to the next middleware if exists, else to route function
  }
}

const checkIfAuthenticatedJWT = function (req, res, next) {
  // Extract out the authorization headers
  const authHeader = req.headers.authorization;
  if (authHeader) {
    // Extract out the JWT and check whether it is valid
    // Example authHeader => BEARER ortsejlrtwlter
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.TOKEN_SECRET, function (err, tokenData) {
      // err arg -> null if no error
      // tokenData arg -> data that we embedded in JWT as payload
      if (err) {
        res.status(401);
        res.json({
          error: 'Invalid access token'
        })
      }
      else {
        // If token is valid
        req.user = tokenData; // so that the route can use this data
        next();
      }
    })
    next();
  }
  else {
    res.status(401);
    res.json({
      error: "No authorization headers found"
    });
  }

}

module.exports = { checkIfAuthenticated, checkIfAuthenticatedJWT }