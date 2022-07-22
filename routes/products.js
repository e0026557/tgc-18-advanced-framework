const express = require("express");
const router = express.Router();

router.get("/", function (req, res) {
  res.send("list all products");
});

router.get("/create", function (req, res) {
  res.send("create product");
});

// Export router function
module.exports = router;
