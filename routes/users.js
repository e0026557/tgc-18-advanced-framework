const express = require('express');
const { createUserForm, bootstrapField, createLoginForm } = require('../forms');
const { User } = require('../models');
const router = express.Router();

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

module.exports = router;