const exprees = require("express")
const multer = require("multer")
const router = exprees.Router()
const { UPLOAD_PATH } = require("../utils/constant")
const Result = require("../models/Result");

router.post('/upload', multer({ dest: `${UPLOAD_PATH}/book` }).single('file'), (req, res, next) => {
  console.log(req.file);
  console.log(UPLOAD_PATH)
  new Result('上传电子书失败').fail(res)
})

module.exports = router