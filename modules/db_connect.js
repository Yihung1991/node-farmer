const mysql = require('mysql2');

//各自的資料庫
const pool = mysql.createPool({
  host: 'localhost',
  user:'root',
  password:'', 
  database: 'farmerwww',
  waitForConnections :true,
  connectionLimit: 5, 
  queueLimit:0,
  });

module.exports = pool.promise();
