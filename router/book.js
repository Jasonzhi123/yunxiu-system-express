const exprees = require("express")
const multer = require("multer")
const router = exprees.Router()
const { UPLOAD_PATH } = require("../utils/constant")
const Result = require("../models/Result");
const Book = require('../models/Book')
const boom = require('boom')

router.post('/upload', multer({ dest: `${UPLOAD_PATH}/book` }).single('file'), (req, res, next) => {
  console.log(req.file);
  console.log(UPLOAD_PATH)
  if (!req.file || req.file.length === 0) {
    new Result('上传电子书失败').fail(res)
  } else {
    let book = new Book(req.file)
    book.parse().then(book => {
      new Result(book, '上传电子书成功').success(res)
    }).catch(err => {
      next(boom.badImplementation(err))
    })
  }
})

module.exports = router