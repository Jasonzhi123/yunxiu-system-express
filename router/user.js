const express = require("express");
const Result = require("../models/Result");
const { body, validationResult } = require('express-validator')
const boom = require('boom')
const jwt = require('jsonwebtoken')
const router = express.Router();

const { login, findUser, findUserPassWord } = require('../service/user')
const { md5, decode } = require('../utils')
const { PWD_SALT, PRIVATE_KEY, JWT_EXPIRED } = require('../utils/constant')

// 用户登录
router.post("/login", [
  body('username').isString().withMessage('username类型不正确'),
  body('password').isString().withMessage('password类型不正确')
], function (req, res, next) {
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
})

// 获取用户信息
router.get('/info', function (req, res, next) {
  const decoded = decode(req)
  if (decoded && decoded.username && decoded.id) {
    findUser(decoded.username, decoded.id).then(user => {
      if (user && user.length !== 0) {
        user['roles'] = user.role
        new Result(user, '获取用户信息成功').success(res)
      } else {
        new Result('获取用户信息失败').fail(res)
      }
    })
  } else {
    new Result('用户信息解析失败').fail(res)
  }
})

// 修改密码
router.post('/changePassword', [
  body('username').isString().withMessage('username类型不正确'),
  body('originalPasswordOne').isString().withMessage('password类型不正确'),
  body('originalPasswordTwo').isString().withMessage('password类型不正确'),
  body('changePassword').isString().withMessage('password类型不正确')
], async (req, res, next) => {
  const err = validationResult(req)
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors
    return next(boom.badRequest(msg))
  }
  let { username, originalPasswordOne, originalPasswordTwo, changePassword } = req.body
  if (username && originalPasswordOne && originalPasswordTwo && changePassword) {
    const decoded = decode(req)
    if (decoded && decoded.username && decoded.id) {
      if (originalPasswordOne !== originalPasswordTwo) {
        return new Result('密码不一致').fail(res)
      }
      originalPasswordOne = md5(`${originalPasswordOne}${PWD_SALT}`)
      originalPasswordTwo = md5(`${originalPasswordTwo}${PWD_SALT}`)
      const { password } = await findUserPassWord(decoded.username, decoded.id)

      if (password === originalPasswordOne && password === originalPasswordTwo) {
        new Result('用户信息修改成功').success(res)
      } else {
        return new Result('原密码不一致').fail(res)
      }
    } else {
      new Result('用户信息解析失败').fail(res)
    }
  } else {
    next(boom.badRequest(new Error('参数不能为空')))
  }
})

//用户注册
router.post('/register', async (req, res, next) => {
  new Result('用户注册成功').success(res)
})
module.exports = router;
