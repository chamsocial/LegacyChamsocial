/**
 * Generate the dbtables
 * and generate a user with a post
 *
 * username = batman
 * password = robin
 */
const path = require('path')
require('dotenv').load({ path: path.resolve(__dirname, '../../', '.env') });
const bcrypt = require('bcryptjs')
const fs = require('fs')
const mysql = require('mysql')
const redisClient = require('../lib/redis');

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
});

function query (sql, prepared = []) {
  return new Promise(function(resolve, reject) {
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

function user () {
  return {
    username: 'Batman',
    email: 'batman@example.com',
    email_domain: 'example.com',
    password: bcrypt.hashSync('robin', 8),
    first_name: 'Bruce',
    last_name: 'Nanananananana...',
    company_name: 'Chamsocial',
    slug: 'batman',
    interests: '',
    aboutme: '',
    lang: 'en',
    activated: 1
  }
}

function post ({ userId, groupId }) {
  return {
    user_id: userId,
    status: 'published',
    slug: 'ou-est-alfred',
    group_id: userId,
    title: 'Where is Alfred?',
    content: 'Is he hiding in the batcave?',
  }
}

async function createGroup() {
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

  const userId = await insert('INSERT INTO users SET ?', [user()])
  const groupId = await createGroup()
  const postId = await insert('INSERT INTO posts SET ?', [post({userId, groupId})])
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
    db.end()
  })
