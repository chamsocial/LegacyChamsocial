/**
 * Generate the dbtables
 * and generate a user with a post
 *
 * username = batman
 * password = robin
 */
const path = require('path')
require('dotenv').load({ path: path.resolve(__dirname, '../', '.env') })
const fs = require('fs')
const mysql = require('mysql')
const redisClient = require('../lib/redis')
const generateUsers = require('./seeds/users')
const generatePosts = require('./seeds/posts')

/**
 * DB
 */
const db = mysql.createPool({
  socketPath: process.env.MYSQL_SOCK || null,
  host: process.env.MYSQL_HOST || 'localhost',
  user: 'root',
  password: process.env.MYSQL_ROOT_PASSWORD || 'patrik',
  database: process.env.MYSQL_DB || 'chamsocial',
  port: process.env.MYSQL_PORT || 3306,
  multipleStatements: true,
  charset: 'utf8mb4'
})

function query (sql, prepared = []) {
  return new Promise(function (resolve, reject) {
    db.query(sql, prepared, (err, data) => (err ? reject(err) : resolve(data)))
  })
}

function insert (sql, prepared) {
  return query(sql, prepared).then(data => data.insertId)
}

function getSQL () {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(__dirname, 'chamsocial-schema.sql'), 'utf8', (err, data) => {
      return err ? reject(err) : resolve(data)
    })
  })
}

/**
 * Data
 */

async function createGroup () {
  const groupId = await insert('INSERT INTO groups SET ?', [{ slug: 'chamshare' }])
  const group = {
    group_id: groupId,
    title: 'ChamShare',
    description: 'General mix of content',
    lang: 'en'
  }
  await insert('INSERT INTO groups_content SET ?', [group])
  return groupId
}

/**
 * The main script
 */

async function init () {
  const sql = await getSQL()
  await query(sql)

  const users = await generateUsers(insert)
  const groupId = await createGroup()
  await generatePosts(insert, users, groupId)
  return ':)'
}

init()
  .then(() => {
    console.log('yes')
    redisClient.delWildcard('posts:*', () => {})
    redisClient.quit()
    db.end()
  })
  .catch(e => {
    console.log(e)
    console.log('DIE!!!!')
    db.end()
    redisClient.quit()
  })
