const express = require('express');
const { createUserForm, bootstrapField, createLoginForm } = require('../forms');
const { checkIfAuthenticated } = require('../middlewares');
const { User } = require('../models');
const router = express.Router();
const crypto = require('crypto');

const getHashedPassword = function(password) {
  const sha256 = crypto.createHash('sha256');
  // The output will be converted to hexdecimal
  const hash = sha256.update(password).digest('base64');
  return hash;
}

router.get('/signup', async function (req, res) {
  const userForm = createUserForm();
  res.render('users/signup', {
    form: userForm.toHTML(bootstrapField)
  })
})

router.post('/signup', async function (req, res) {
  const userForm = createUserForm();
  userForm.handle(req, {
    success: async function (form) {
      // Create an INSTANCE of the user model (represents a row in the table)
      // Model -> the table
      // Instance of the model -> one row
      const user = new User();
      // Set columns manually
      // user.set('username', form.data.username);
      // user.set('password', form.data.password);
      // user.set('email', form.data.email);
      // Shortcut
      const { confirm_password, ...userData } = form.data;
      userData.password = getHashedPassword(userData.password);
      user.set(userData);

      await user.save();

      req.flash('success_messages', 'Signed up successfully')
      res.redirect('/users/login');

    },
    error: async function (form) {
      res.render('users/signup', {
        form: form.toHTML(bootstrapField)
      })
    },
    empty: function (form) {

    }
  })
})

router.get('/login', async function (req, res) {
  const loginForm = createLoginForm()
  res.render('users/login', {
    form: loginForm.toHTML(bootstrapField)
  })
})

router.post('/login', checkIfAuthenticated, async function (req, res) {
  const loginForm = createLoginForm();
  loginForm.handle({
    success: async function (form) {
      const user = await User.where({
        email: form.data.email,
        password: getHashedPassword(form.data.password)
      }).fetch({
        require: false // Because we want to handle the case where no user is found by ourselves
      })

      // Check if the user exists
      if (!user) {
        req.flash('error_messages', 'Invalid credentials');
        res.redirect('/users/login')
      }
      else {
        // Save the user data in the session file
        req.session.user = {
          id: user.get('id'),
          email: user.get('email'),
          username: user.get('username')
        };

        res.flash('success_messages', `Welcome back, ${user.get('username')}`);
        res.redirect('/users/profile')
      }
    }
  })
})

router.get('/profile', checkIfAuthenticated, async function (req, res) {
  const user = req.session.user;
  if (!user) {
    req.flash('error_messages', 'Only logged in users can access this page');
    res.redirect('/users/login');
  }
  else {
    res.render('users/profile', {
      user
    })
  }
})

router.get('/logout', function (req, res) {
  // Remove the user object in the session
  req.session.user = null;
  req.flash('success_messages', 'You have been logged out');
  res.redirect('/users/login');
})

module.exports = router;