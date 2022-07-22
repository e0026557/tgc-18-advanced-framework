const express = require("express");
const hbs = require("hbs");
const wax = require("wax-on");

const app = express();

app.set("view engine", "hbs");

// Static folder
app.use(express.static("public"));

// Setup wax-on
wax.on(hbs.handlebars);
wax.setLayoutPath("./views/layouts");

const landingRoutes = require("./routes/landing");
const productRoutes = require("./routes/products");

// First arg is the prefix used to access the routes in the router function
// IMPORTANT: Make sure that the routes in the router function cannot clash, otherwise the first router function that has this route will be rendered
app.use("/", landingRoutes);
app.use("/products", productRoutes);

app.listen(3000, function () {
  console.log("Server has started");
});
