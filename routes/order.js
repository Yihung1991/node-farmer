const express = require("express");
const router = express.Router();
const db = require("./../modules/db_connect");

router.use(express.json());

router.post("/", async (req, res) => {
    if (!res.locals.bearer) return res.json([]);
    //選取order
    const sql_order_p = `SELECT * FROM order_product WHERE member_sid in (?)`;
    const sql_order_l = `SELECT * FROM order_lesson WHERE member_sid in (?) ;`;
    const [result_sql_order_p] = await db.query(sql_order_p, [
      res.locals.bearer.sid,
    ]);
    const [result_sql_order_l] = await db.query(sql_order_l, [
      res.locals.bearer.sid,
    ]);
   
    //整合訂單
    const combinedOrder = [...result_sql_order_p, ...result_sql_order_l];
    
    const mergedOrders = [];

    for (let i = 0; i < combinedOrder.length; i++) {
    const order = combinedOrder[i];

    // 檢查是否已經存在相同 uuid 的訂單
    const existingOrder = mergedOrders.find((o) => o.order_uuid === order.order_uuid);

    if (existingOrder) {
    // 如果已經存在相同 uuid 的訂單，則合併重複的欄位
        existingOrder.sumprice += order.sumprice || 0;
        existingOrder.order_paid += order.order_paid || 0;
        existingOrder.order_sended += order.order_sended || 0;
        existingOrder.order_refund += order.order_nrefund || 0;
    } else {
        // 如果是新的 uuid，則新增一個新的訂單物件
        const newOrder = {
          order_uuid: order.order_uuid,
          order_id: order.order_id,
          order_imgP: order.product_img || '',
          order_imgL: order.lesson_img || '',
          order_remark: order.order_remark,
          coupon_sid: order.coupon_sid,
          sumprice: order.sumprice || 0,
          order_paid: order.order_paid || 0,
          order_sended: order.order_sended || 0,
          order_refund: order.order_refund || 0,
          order_sdate: order.order_sdate,
        };
            mergedOrders.push(newOrder);
    }
}
console.log(mergedOrders)
res.json(mergedOrders)


   
     //選取order_details
     const  orderuuid_p = result_sql_order_p.map((obj)=>{return obj.order_uuid})
     const  orderuuid_l = result_sql_order_l.map((obj)=>{return obj.order_uuid})
     console.log('p' , orderuuid_p);
     if (!orderuuid_p.length) return;
     if(!orderuuid_l.length)return;
     // console.log(orderuuid_p,orderuuid_l)
     const sql_order_details_p = `SELECT * FROM order_product_details WHERE order_uuid in (?)`;
     const sql_order_details_l = `SELECT * FROM order_lesson_details WHERE order_uuid in (?)`;
     const [result_sql_order_details_p] = await db.query(sql_order_details_p, [orderuuid_p]);
     const [result_sql_order_details_l] = await db.query(sql_order_details_l, [orderuuid_l]);





})

module.exports = router;