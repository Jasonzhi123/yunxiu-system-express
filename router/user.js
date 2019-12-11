const express = require("express");
const Result = require("../models/Result");
const router = express.Router();

router.post("/login", function(req, res, next) {
  console.log(req.body);
  const username = req.body.username;
  const password = req.body.password;

  if (username === "admin" && password === "1234567") {
    new Result("登录成功").success(res);
  } else {
    new Result("登录失败").fail(res);
  }
});

module.exports = router;
