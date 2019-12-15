const express = require("express");
const Result = require("../models/Result");
const router = express.Router();
const { login, findUser } = require('../service/user')
const { md5, decode } = require('../utils')
const { PWD_SALT, PRIVATE_KEY, JWT_EXPIRED } = require('../utils/constant')
const { body, validationResult } = require('express-validator')
const boom = require('boom')
const jwt = require('jsonwebtoken')

router.post("/login",
  [
    body('username').isString().withMessage('username类型不正确'),
    body('password').isString().withMessage('password类型不正确')
  ],
  function (req, res, next) {
    const err = validationResult(req)
    if (!err.isEmpty()) {
      const [{ msg }] = err.errors
      next(boom.badRequest(msg))
    } else {
      let { username, password } = req.body
      password = md5(`${password}${PWD_SALT}`)
      login(username, password).then(userInfo => {
        if (!userInfo || userInfo.length === 0) {
          new Result("登录失败").fail(res);
        } else {
          let [userInfoData] = userInfo
          const token = jwt.sign(
            { username, id: userInfoData.id },
            PRIVATE_KEY,
            { expiresIn: JWT_EXPIRED }
          )
          new Result({ token }, '登录成功').success(res)
        }
      })
    }
  });

router.get('/info', function (req, res, next) {
  const decoded = decode(req)
  if (decoded && decoded.username) {
    findUser(decoded.username, decoded.id).then(user => {
      if (user && user.length !== 0) {
        new Result(user[0], '获取用户信息成功').success(res)
      } else {
        new Result('获取用户信息失败').fail(res)
      }
    })
  } else {
    new Result('用户信息解析失败').fail(res)
  }
})
module.exports = router;
