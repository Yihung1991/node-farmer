const express = require("express");
const router = express.Router();
const db = require("./../modules/db_connect");

router.use(express.json());

router.get("/:uuid", async (req, res) => {
 console.log(req.params.uuid);
  if(req.params.uuid === [])return
  //選擇商品
  const sql_order_product_details = `SELECT * FROM order_product_details WHERE order_uuid = '${req.params.uuid}'`

  const [order_product_details] = await db.query(
    sql_order_product_details
  )
  //選擇課程
  const sql_order_lesson_details = `SELECT * FROM order_lesson_details WHERE order_uuid = '${req.params.uuid}'`
  const [order_lesson_details] = await db.query(sql_order_lesson_details)

  //選擇使用的優惠卷
  const sql_order_couponL = `SELECT coupon_sid FROM order_lesson WHERE order_uuid = '${req.params.uuid}'`
  const sql_order_couponP = `SELECT coupon_sid FROM order_product WHERE order_uuid = '${req.params.uuid}'`
  const [r_sql_order_couponL] = await db.query(sql_order_couponL)
  const [r_sql_order_couponP] = await db.query(sql_order_couponP)
  console.log("r_sql_order_couponP", r_sql_order_couponP);
  const couponSid = r_sql_order_couponL[0]?.coupon_sid || r_sql_order_couponP[0]?.coupon_sid || 0
  const sql_coupon = `SELECT * FROM coupon WHERE sid = '${couponSid}'`
  const [r_sql_coupon] = await db.query(sql_coupon);

  //選擇訂單總價
  const sql_order_p = `SELECT * FROM order_product WHERE order_uuid = '${req.params.uuid}'`
  const sql_order_l = `SELECT * FROM order_lesson WHERE order_uuid = '${req.params.uuid}'`
  const [r_sql_order_p] = await db.query(sql_order_p)
  const [r_sql_order_l] = await db.query(sql_order_l)
  const PriceP = r_sql_order_p.map((order) => order.sumprice)
  const PriceL = r_sql_order_l.map((order) => order.sumprice)
  console.log("PriceL", PriceL);


  const sumprice = !PriceP.length ? PriceL : PriceP 
  console.log("sumprice", sumprice)

  //選擇訂單備註
  const sql_order_product = `SELECT order_remark FROM order_product WHERE order_uuid = '${req.params.uuid}'`
  const sql_order_lesson = `SELECT order_remark FROM order_lesson WHERE order_uuid = '${req.params.uuid}'`
  const [r_sql_order_product] = await db.query(sql_order_product)
  const [r_sql_order_lesson] = await db.query(sql_order_lesson)
  const RemarkP =r_sql_order_product.map((o)=>o.order_remark)
  const RemarkL =r_sql_order_lesson.map((o)=>o.order_remark)
  const remark = !RemarkP.length ? RemarkL : RemarkP 
    res.json({
      order_product_details,
      order_lesson_details,
      r_sql_coupon,
      sumprice,
      remark,
    });
});



module.exports = router;
