const express = require('express');
const router = express.Router();
const db = require('./../modules/db_connect');
router.use(express.json());

router.post('/',async(req,res)=>{
    if (!res.locals.bearer) return res.json({});
   
    //檢查訂單有無達成 勳章條件
    //勳章條件12 買10個百香果(product_0001、product_0002)
    const sql_od_p = `SELECT order_uuid FROM order_product WHERE member_sid = ${res.locals.bearer.sid}`;
    const [r_od_p] = await db.query(sql_od_p);
    const uuid_p = r_od_p.map(p=>p.order_uuid)
    if(!uuid_p.length)return
  
    const sql_ord_p = `SELECT product_id,product_quantity FROM order_product_details WHERE order_uuid in (?)`
    const [r_ord_p] = await db.query(sql_ord_p, [uuid_p]);
    // console.log(r_ord_p);
  
    const product1 = 'product_0001';
    const product2 = 'product_0002';
    const totalPassionFruit = r_ord_p.reduce((total, p) => {
      if (p.product_id === product1 || p.product_id === product2) {
        total += p.product_quantity;
      }
      return total;
    }, 0);
    console.log(totalPassionFruit);
    let MyNew = false;
    let result = {}
    if(totalPassionFruit>=10){
    //檢查會員當前有無百香果勳章，如果有，不執行新增
    const sql_awards_12 =`SELECT awards_sid FROM awards_details WHERE member_sid in (?)`
    const [r_awards_12] = await db.query(sql_awards_12, [
      res.locals.bearer.sid,
    ]);
    const awards12 = r_awards_12.map(a=>a.awards_sid)
    console.log(awards12);
    if(!awards12.includes(12)){
  
    //如果沒有，執行新增
    const sql_insert_12 = "INSERT INTO awards_details(`member_sid`, `awards_sid`) VALUES (?,?)"
    const [i_insert_12] = await db.query(sql_insert_12, [
      res.locals.bearer.sid,
      12,
    ]);
    console.log("new",!!i_insert_12.affectedRows)
    MyNew = !!i_insert_12.affectedRows

    //傳送新增的勳章
    const sql_new = `SELECT * FROM awards WHERE sid = ${12}`
    const [r_sql_new] = await db.query(sql_new);
    if (r_sql_new.length) {
        result = r_sql_new[0];
      }
    }

    //檢查當前
    console.log('MyNew',MyNew)
    console.log('result',result)
    res.json({MyNew:MyNew,result:result});
  }})


module.exports = router;
