// mysql2
const db = require("../modules/db_connect");
const util = require('./util.js')

// 專用處理sql字串的工具，主要format與escape
const SqlString = require('sqlstring')

// constant
const tableName = 'order'
const idField = 'order_id'

/* below is exports */
module.exports.findAll = async () => {
  let sql = `SELECT * FROM ${tableName}`

  try {
    const [rows] = await db.query(sql)
    return rows
  } catch (error) {
    console.log('db/model error occurred: ', error)
    return error
  }
}

//{order_id:query.orderId, transaction_id: query.transactionId}
module.exports.find = async (query) => {
  let sql = `SELECT * FROM ${tableName}`

  // equal params: name, catid
  const equalParams = {
    order_id: query.orderId,
    transaction_id: query.transactionId,
  }

  const whereSql = util._createWhereSql(equalParams)

  // count all rows
  const totalCountSql = `SELECT COUNT(1) AS totalCount FROM ${tableName} ${whereSql}`

  try {
    console.log(sql + whereSql)

    const [rows] = await db.query(sql + whereSql)
    const [resultTotalCount] = await db.query(totalCountSql)

    const totalCount = resultTotalCount[0].totalCount

    return {
      metadata: {
        totalCount,
      },
      records: rows,
    }
  } catch (error) {
    console.log('db/model error occurred: ', error)
    return error
  }
}

//
module.exports.findById = async (id) => {
  let sql = `SELECT * FROM \`${tableName}\` WHERE \`${idField}\` = ${SqlString.escape(
    id
  )}`

  try {
    const [rows] = await db.query(sql)
    return rows.length ? rows[0] : {}
  } catch (error) {
    console.log('db/model error occurred: ', error)
    return error
  }
}

// use field to find just one record
module.exports.findOne = async (query) => {
  let sql = `SELECT * FROM \`${tableName}\``

  // if has req.query
  const whereSql = util._createWhereSql(query)

  console.log(whereSql)

  try {
    const [rows] = await db.query(sql + whereSql + ` LIMIT 0,1`)
    //console.log(rows)

    return rows[0] ? rows[0] : {}
  } catch (error) {
    console.log('db/model error occurred: ', error)
    return error
  }
}

module.exports.delete = async (id) => {
  let sql = `DELETE FROM ${tableName} WHERE ${idField} = ${SqlString.escape(
    id
  )}`
  try {
    const [result] = await db.query(sql)

    // select the update row
    if (result.affectedRows) {
      return { message: 'success' }
    } else {
      return { message: 'fail' }
    }
  } catch (error) {
    console.log('db/model error occurred: ', error)
    return error
  }
}

module.exports.create = async (order) => {
  let sql = `INSERT INTO \`${tableName}\` ${util._createSetSql(order)}`

  try {
    // insert new row to db server
    const [result] = await db.query(sql)

    console.log(result)

    // cause we use order_id(generate from uuidv4, the insertId always 0)
    if (result.affectedRows) {
      // select the insert row
      const instance = module.exports.findById(order.order_id)
      return instance
    } else {
      return {}
    }
  } catch (error) {
    console.log('db/model error occurred: ', error)
    return error
  }
}

module.exports.update = async (order) => {
  let sql = `UPDATE \`${tableName}\` ${util._createSetSql(order, [
    'order_id',
  ])} WHERE \`${idField}\` = '${order.order_id}'`

  try {
    // update row
    const [result] = await db.query(sql)

    // select the update row
    if (result.affectedRows) {
      const instance = module.exports.findById(order.order_id)
      return instance
    } else {
      return {}
    }
  } catch (error) {
    console.log('db/model error occurred: ', error)
    return error
  }
}

module.exports.findOrCreate = async (order) => {
  const foundRecord = await this.findOne(order)
  if (foundRecord.id) {
    return foundRecord
  } else {
    return this.create(order)
  }
}
