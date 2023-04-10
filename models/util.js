// 專用處理sql字串的工具，主要format與escape
const SqlString = require('sqlstring')

// use params to create where sql
// params {object} ex. { userid: 1} => `userid = 1`
module.exports._createWhereSql = (
  equalParams = {},
  likeParams = {},
  inSetParams = {},
  type = 'AND'
) => {
  const where = []
  let whereSql = ''

  for (const [key, value] of Object.entries(equalParams)) {
    // if value is not undefined
    if (value) {
      where.push(`\`${key}\` = ${SqlString.escape(value)}`)
    }
  }

  for (const [key, value] of Object.entries(likeParams)) {
    // if value is not undefined
    if (value) {
      where.push(`\`${key}\` like "%${SqlString.escape(value)}%"`)
    }
  }

  // WHERE CONCAT(",", `setcolumn`, ",") REGEXP ",(val1|val2|val3),"
  for (const [key, value] of Object.entries(inSetParams)) {
    // if value is not undefined
    if (value) {
      where.push(
        `CONCAT(",", ${key}, ",") REGEXP ",(${SqlString.escape(
          value.replaceAll(',', '|')
        )}),"`
      )
    }
  }

  if (where.length) whereSql = ` WHERE ` + where.join(` ${type} `)

  return whereSql
}

// for insert and update use
// use params to create where sql
// params {object} ex. {id:1, name:'herry'}
// ignoreFields {array} ex. ['id', 'createDate']
module.exports._createSetSql = (params, ignoreFields = []) => {
  const set = []
  let setSql = ''

  for (const [key, value] of Object.entries(params)) {
    // ignore the idField
    if (ignoreFields.includes(key)) continue

    if (value) {
      // if value is not undefined
      set.push(`\`${key}\` = ${SqlString.escape(value)}`)
    }
  }

  if (set.length) setSql = ` SET ` + set.join(` , `)

  return setSql
}
