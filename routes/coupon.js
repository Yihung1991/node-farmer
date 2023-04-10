const express = require("express");
const router = express.Router();
const db = require("./../modules/db_connect");
router.use(express.json());
const upload = require("./../modules/upload_img");

//傳送所有優惠卷
router.post("/", async (req, res) => {
  let result_myCoupon = [];
  if (res.locals.bearer){
    const sql_coupon_d = `SELECT * FROM coupon_details WHERE member_sid in (?) AND coupon_used in (?);`;
    const [result_Coupon_d] = await db.query(sql_coupon_d, [
      res.locals.bearer.sid,
      2,
    ]);
    const CouponSid = result_Coupon_d.map((item) => item.coupon_sid);
    // console.log(CouponSid);
    if (!CouponSid.length) return
    const sql_coupon = `SELECT * FROM coupon WHERE sid in (?)`;
    [result_myCoupon] = await db.query(sql_coupon, [CouponSid]);
    console.log("p", result_myCoupon);
  } 
  res.json(result_myCoupon);
});
//傳送商品優惠卷
router.post("/p", async (req, res) => {
  let result_myCoupon = [];
 if (res.locals.bearer) {
   const sql_coupon_d = `SELECT * FROM coupon_details WHERE member_sid in (?) AND coupon_used in (?);`;
   const [result_Coupon_d] = await db.query(sql_coupon_d, [
     res.locals.bearer.sid,
     2,
   ]);
   const CouponSid = result_Coupon_d.map((item) => item.coupon_sid);
   // console.log(CouponSid);
   if (!CouponSid.length) return ;
   const sql_coupon = `SELECT * FROM coupon WHERE sid in (?) AND coupon_category = 2`;
   [result_myCoupon] = await db.query(sql_coupon, [CouponSid]);
   
 }
 console.log("p", result_myCoupon);
res.json(result_myCoupon);
});

//傳送課程優惠卷
router.post("/l", async (req, res) => {
  let result_myCoupon = [];
   if (res.locals.bearer){
     const sql_coupon_d = `SELECT * FROM coupon_details WHERE member_sid in (?) AND coupon_used in (?);`;
     const [result_Coupon_d] = await db.query(sql_coupon_d, [
       res.locals.bearer.sid,
       2,
     ]);
     const CouponSid = result_Coupon_d.map((item) => item.coupon_sid);
     // console.log(CouponSid);
     if (!CouponSid.length) return
     const sql_coupon = `SELECT * FROM coupon WHERE sid in (?) AND coupon_category = 1`;
     [result_myCoupon] = await db.query(sql_coupon, [CouponSid]);
   }
   console.log("l", result_myCoupon);
   res.json(result_myCoupon);
});


// 發送兔飽飽券&徽章
router.post("/addRabbit", upload.none(), async (req, res) => {
  const output = {
    MyNew: false,
  };

  if (res.locals.bearer.sid && res.locals.bearer.account) {
    // 有登入
    const member_sid = res.locals.bearer.sid;

    // 兔飽飽券數量
    const [[{ rabbit_coupon }]] = await db.query(
      `SELECT COUNT(1) AS rabbit_coupon FROM coupon_details WHERE member_sid=${member_sid} AND coupon_sid=12`
    );
    output.rabbit_coupon = rabbit_coupon;
    // 兔徽章數量
    const [[{ rabbit_award }]] = await db.query(
      `SELECT COUNT(1) AS rabbit_award FROM awards_details WHERE member_sid=${member_sid} AND awards_sid=9`
    );
    output.rabbit_award = rabbit_award;
    // 是否已擁有券或徽章
    output.done = !!(rabbit_coupon + rabbit_award);

    if (output.done) {
      output.error = "已經拿過";     
    } else {
      // 發券
      const sql =
        "INSERT INTO `coupon_details`(`member_sid`, `coupon_sid`, `coupon_sdate`, `coupon_edate`, `coupon_used`) VALUES (?,?,?,?,?)";
      const [result] = await db.query(sql, [
        member_sid,
        12,
        "2023-01-11",
        "2023-12-30",
        2,
      ]);
      console.log(result.affectedRows);
      // 發徽章
      const sql2 =
        "INSERT INTO awards_details(`member_sid`, `awards_sid`) VALUES (?,?)";
      const [result2] = await db.query(sql2, [member_sid, 9]);
      output.MyNew = !!result.affectedRows;
      output.error = output.MyNew ? "OK" : "發生錯誤";
      // 取得徽章資料(提示動畫用)
      const [rabbit_data] = await db.query(`SELECT * FROM awards WHERE sid =9`);
      output.rabbit_data = rabbit_data[0];
    }
  } else {
    // 沒登入
    output.error = "沒有登入";
  }
  res.json(output);
});

// 判斷有無玩過兔兔遊戲
router.post("/doneRabbit", upload.none(), async (req, res) => {
  const output = {};

  if (res.locals.bearer.sid && res.locals.bearer.account) {
    // 有登入
    const member_sid = res.locals.bearer.sid;

    // 兔飽飽券數量
    const [[{ rabbit_coupon }]] = await db.query(
      `SELECT COUNT(1) AS rabbit_coupon FROM coupon_details WHERE member_sid=${member_sid} AND coupon_sid=12`
    );
    output.rabbit_coupon = rabbit_coupon;
    // 兔徽章數量
    const [[{ rabbit_award }]] = await db.query(
      `SELECT COUNT(1) AS rabbit_award FROM awards_details WHERE member_sid=${member_sid} AND awards_sid=9`
    );
    output.rabbit_award = rabbit_award;
    // 是否已擁有券或徽章
    output.done = !!(rabbit_coupon + rabbit_award);
   
  } else {
    // 沒登入
    output.error = "沒有登入";
  }
  res.json(output);
});

module.exports = router;
