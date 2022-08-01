// PROJECT FILE (same directory as package.json)

// Dependencies
const express = require("express");
const hbs = require("hbs");
const wax = require("wax-on");
const session = require('express-session');
const flash = require('connect-flash');
const csrf = require('csurf');

// Enable env files
require('dotenv').config();

// Create a new session filestore
const FileStore = require('session-file-store')(session);

const app = express();

app.set("view engine", "hbs");

// Static folder
app.use(express.static("public"));

// Setup wax-on
wax.on(hbs.handlebars);
wax.setLayoutPath("./views/layouts");

// Required for csrf token to work (otherwise keep getting invalid csrf token errors)
app.use(express.urlencoded({
  extended: false
}))

// Setup session
app.use(session({
  store: new FileStore(), // use file to store sessions
  secret: 'keyboard cat', // used to generate the session id
  resave: false, // do we automatically recreate the session even if there is no change to it
  saveUninitialized: true // if a new browser connects do we create a new session
}))

// Register Flash messages
app.use(flash()); // IMPORTANT: Register Flash after sessions because it uses sessions to work

// Setup middleware to inject session data into the hbs file
app.use(function (req, res, next) {
  // res.locals will contain all the variables available to hbs files
  res.locals.success_messages = req.flash('success_messages'); // req.flash will retrieve and remove the success_messages
  res.locals.error_messages = req.flash('error_messages');
  next();
})

//  Enable CSRF protection
app.use(csrf());

// Share CSRF with hbs files (must be included for all forms otherwise invalid CSRF error)
app.use(function(req,res,next){
  // The csrfToken function is available because of app.use(csrf())
  res.locals.csrfToken = req.csrfToken();
  next();
})

// Share cloudinary information with hbs file (TODO)
// app.use(function(req, res, next) {
//   res.locals.cloudinaryName = 
// })

const landingRoutes = require("./routes/landing");
const productRoutes = require("./routes/products");
const userRoutes = require('./routes/users');
const cloudinaryRoutes = require('./routes/cloudinary');

// First arg is the prefix used to access the routes in the router function
// IMPORTANT: Make sure that the routes in the router function cannot clash, otherwise the first router function that has this route will be rendered
app.use("/", landingRoutes);
app.use("/products", productRoutes);
app.use('/users', userRoutes);
app.use('/cloudinary', cloudinaryRoutes);

app.listen(3000, function () {
  console.log("Server has started");
});
