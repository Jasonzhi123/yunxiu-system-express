const express = require('express')
const fs = require('fs')
const https = require('https')
const bodyParser = require('body-parser')
const cors = require('cors')

// 创建 express 应用
const app = express()

const router = require('./router')

const privateKey = fs.readFileSync('./https/jasonzhi.cn.key', 'utf8')
const certificate = fs.readFileSync('./https/jasonzhi.cn_bundle.crt', 'utf8')
const credentials = { key: privateKey, cert: certificate }
const httpsServer = https.createServer(credentials, app)
const SSLPORT = 8082

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use('/', router)

httpsServer.listen(SSLPORT, function () {
  console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT)
})
// 使 express 监听 3000 端口号发起的 http 请求
const server = app.listen(3000, function () {
  const { address, port } = server.address()
  console.log('Http Server is running on http://%s:%s', address, port)
})