const express = require("express");
const Result = require("../models/Result");
const router = express.Router();
const { login } = require('../service/user')
const { md5 } = require('../utils')
const { PWD_SALT } = require('../utils/constant')
const { body, validationResult } = require('express-validator')
const boom = require('boom')

router.post("/login",
  [
    body('username').isString().withMessage('username类型不正确'),
    body('password').isString().withMessage('password类型不正确')
  ],
  function (req, res, next) {
    const err = validationResult(req)
    console.log(err);
    if (!err.isEmpty()) {
      const [{ msg }] = err.errors
      next(boom.badRequest(msg))
    } else {
      let { username, password } = req.body
      password = md5(`${password}${PWD_SALT}`)
      console.log(password);
      login(username, password).then(userInfo => {
        console.log(userInfo);
        if (!userInfo || userInfo.length === 0) {
          new Result("登录失败").fail(res);
        } else {
          new Result("登录成功").success(res);
        }
      })
    }
  });

module.exports = router;
