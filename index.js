const express = require('express');
const { handlebars } = require('hbs');
const hbs = require('hbs');
const wax = require('wax-on');

const app = express();

app.set('view engine', 'hbs');

// Static folder
app.use(express.static('public'));

// Setup wax-on
wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts');

app.get('/', async function(req, res) {
  res.send('hello world');
})

app.listen(3000, function() {
  console.log('Server has started');
})