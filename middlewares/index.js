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

module.exports = {checkIfAuthenticated}