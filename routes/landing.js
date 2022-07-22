const express = require("express");

// Create a router object
// a router object can contain routes
const router = express.Router();

router.get("/", function (req, res) {
  res.send("welcome");
});

module.exports = router;
