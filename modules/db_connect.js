const mysql = require('mysql2');

// 預設組長電腦
const pool = mysql.createPool({
host: '192.168.21.191',
user:'farmerwww',
password:'farmerwww',
database: 'farmerwww',
waitForConnections :true,
connectionLimit: 5,
queueLimit:0,
});

//各自的資料庫
// const pool = mysql.createPool({
//   host: 'localhost',
//   user:'root',
//   password:'', 
//   database: 'farmerwww',
//   waitForConnections :true,
//   connectionLimit: 5, 
//   queueLimit:0,
//   });

module.exports = pool.promise();
