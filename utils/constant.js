
const { env } = require('./env')
const UPLOAD_PATH = env === 'dev' ? 'C:/nginx/fileResources' : '/root/upload/admin-upload/ebook'

module.exports = {
  CODE_ERROR: -1,
  CODE_SUCCESS: 0,
  CODE_TOKEN_EXPIRED: -2,
  debug: true,
  PWD_SALT: 'admin_imooc_node',
  PRIVATE_KEY: 'yiqikan_system_node_system_jasonzhi_cn',
  JWT_EXPIRED: 60 * 60 * 24 * 7,
  UPLOAD_PATH,
  MIME_TYPE_EPUB: 'application/epub+zip'
}