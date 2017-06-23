'use strict'

const mysql = require('mysql')
const fs = require('fs-promise')
const Validator = require('jsonschema').Validator
const v = new Validator()
var conn



const configSchema = {
	'host': {'type': 'string'},
	'user': {'type': 'string'},
	'password': {'type': 'string'},
	'database': {'type': 'string'},
	'port': {'type': 'number'}
}

exports.config = data => {
	return new Promise( (resolve, reject) => {
		console.log('starting config')
		console.log(data)
		const valid = v.validate(data, configSchema)
		console.log(`valid schema: ${valid}`)
		if (valid) {
			console.log('storing config data')
			conn = data
			console.log(JSON.stringify(conn, null, 2))
			resolve(true)
		} else {
			reject('invalid config data')
		}
	})
}

exports.importSQL = filename => {
	console.log(`importSQL start: ${filename}`)
	return new Promise( (resolve, reject) => {
		console.log(`importSQL promise: ${filename}`)
		return fs.readFile(filename, 'utf8')
			.then(arraySplit)
			.then(runQueries)
			.then( () => {
				console.log(`importSQL done: ${filename}`)
				resolve('all tables created')
			})
	})
}

function arraySplit(str) {
	console.log('arraySplit')
	return new Promise( (resolve, reject) => {
		if (str.indexOf(';') === -1) {
			reject('each SQL statement must terminate with a semicolon (;)')
		}
		// Remove comments
		const rows = str.split('\n')
		str = rows.filter(row => !row.match(/^--/)).join('\n')

		str = str.trim()
		str = str.replace(/(?:\r\n|\r|\n)/g, ' ')
		str = str.replace(/\s\s+/g, ' ').trim()
		str = str.substring(0, str.length-1)
		let arr = str.split(';')
		resolve(arr)
	})
}

function doQuery(db, item) {
	return new Promise((resolve, reject) => {
		db.query(item, (err, rows) => {
			if (err) {
				console.log('ERROR ON:', item)
				return reject('ERROR: '+err)
			}
			resolve('ROWS: '+rows)
		})
	})
}

async function runQueries(arr) {
	console.log('connecting to database')
	console.log(JSON.stringify(conn, null, 2))
	let db = mysql.createConnection(conn)

	for(const item of arr) {
    await doQuery(db, item)
  }

	db.end()
	return 'Done'
}
