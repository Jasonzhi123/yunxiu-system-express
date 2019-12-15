const { querySql, queryOne } = require('../db')

function login(username, password) {
  const sql = `select * from admin_user where username='${username}' and password='${password}'`
  return querySql(sql)
}
function findUser(username, id) {
  const sql = `select * from admin_user where username='${username}' and id='${id}'`
  return queryOne(sql)
}
function findUserPassWord(username, id) {
  const sql = `select password from admin_user where username='${username}' and id='${id}'`
  return queryOne(sql)
}
module.exports = {
  login,
  findUser,
  findUserPassWord
}