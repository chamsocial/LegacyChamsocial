const bcrypt = require('bcryptjs')

const mainUser = {
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

const users = [
  Object.assign({}, mainUser, { username: 'Alfred', email: 'a@b.c', slug: 'alf' }),
  Object.assign({}, mainUser, { username: 'Cham123CoolLongNameNot', email: 'b@b.c', slug: 'hello' }),
  Object.assign({}, mainUser, { username: 'alfons', email: 'c@b.c', slug: 'asafsdf' }),
  Object.assign({}, mainUser, { username: 'Molgan@example.com', email: 'd@b.c', slug: 'long-thing-or-is-it-compared-to-some' })
]

async function generateUsers (insert) {
  const promises = [
    insert('INSERT INTO users SET ?', [mainUser]),
    insert('INSERT INTO users SET ?', [users[0]]),
    insert('INSERT INTO users SET ?', [users[1]]),
    insert('INSERT INTO users SET ?', [users[2]]),
    insert('INSERT INTO users SET ?', [users[3]])
  ]

  return Promise.all(promises)
}

module.exports = generateUsers
