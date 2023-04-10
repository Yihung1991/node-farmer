const express = require("express");
const router = express.Router();
const db = require("./../modules/db_connect");
const { v4: uuidv4 } = require("uuid");
const base58 = require("bs58");

router.use(express.json());

router.post("/", async (req, res) => {
  //接收localStorage購物車數值的路由
  const cart = req.body.cart;
  console.log(cart);

  //接收localStorage優惠卷數值
  let coupon = 0;
  try {
    coupon = req.body.coupon;
  } catch (ex) {
    coupon = 0;
  }
  console.log("couponsid", coupon);

  //接收會員id
  const member = req.body.member;
  console.log(member);

  //接收備註
  let remark = req.body.orderRemark || "無備註";
  if (Object.keys(remark).length === 0) {
    remark = "無備註";
  }
  console.log(remark);

  //如果購物車為空，不執行資料庫連線
  if (cart === null) return;

  // 在這裡使用id值進行資料庫連線相關操作
  //取出id值
  const ids = cart.map((obj) => obj.id);

  //取出productid值
  const Pids = ids.filter((value) => value.indexOf("product") !== -1);
  console.log("Pids", Pids);
  //取出Lessonid值
  const Lids = ids.filter((value) => value.indexOf("lesson") !== -1);
  console.log("Lids", Lids);

  //分流產品與課程價格
  let productTotal = 0;
  let lessonTotal = 0;
  let sumPrice = 0;

  let PPrice = [];
  let PQuantity = [];

  let LPrice = [];
  let LQuantity = [];

  if (Pids.length > 0) {
    const P_sql = `SELECT * FROM products WHERE product_id in (?)`;
    const [Products] = await db.query(P_sql, [Pids]);
    console.log("Products", Products);

    //取出產品價格
    PPrice = Products.map((p) => p.product_price);
    console.log("PPrice", PPrice);

    //取出數量
    const products = cart.filter((value) => value.id.indexOf("product") !== -1);
    PQuantity = products.map((product) => product.quantity);
    console.log("Pquantity", PQuantity);

    //算出商品總價
    productTotal = PPrice.reduce((accumulator, currentValue, index) => {
      return accumulator + currentValue * PQuantity[index];
    }, 0);
    console.log("Product Total:", productTotal);
  }

  console.log("Final PPrice", PPrice);

  if (Lids.length > 0) {
    const L_sql = `SELECT * FROM lesson WHERE lesson_id in (?)`;
    const [Lessons] = await db.query(L_sql, [Lids]);
    //取出產品價格
    LPrice = Lessons.map((l) => l.lesson_price);

    //取出數量
    const lessons = cart.filter((value) => value.id.indexOf("lesson") !== -1);
    LQuantity = lessons.map((lesson) => lesson.quantity);
    console.log("LQuantity", LQuantity);

    //算出課程總價
    lessonTotal = LPrice.reduce((accumulator, currentValue, index) => {
      return accumulator + currentValue * LQuantity[index];
    }, 0);
  }
  console.log("Lesson Total:", lessonTotal);

  sumPrice = lessonTotal + productTotal;
  //判定有沒有使用優惠卷
  if (coupon){
    const sql_coupon = `SELECT * FROM coupon WHERE sid IN (?)`;
    const [result_coupon] = await db.query(sql_coupon, [coupon]);
    console.log(result_coupon);

    //計算總價 1=NTD 2=%
    if (result_coupon[0].coupon_category == 1) {
      sumPrice = lessonTotal - result_coupon[0].coupon_quota + productTotal;
    } else if (result_coupon[0].coupon_category == 2) {
      sumPrice =
        Math.floor(productTotal * (result_coupon[0].coupon_quota / 100)) +
        lessonTotal;
    }


    //寫入coupon_details，更新coupon_used to 1
    const sql_coupon_details =
      "UPDATE `coupon_details` SET coupon_used = ? WHERE member_sid = ? AND coupon_sid = ?;";
    const [result_sql_coupon_details] = await db.query(sql_coupon_details, [
      1,
      member,
      coupon,
    ]);

  }
  //取得優惠卷價格
  console.log("sumPrice", sumPrice);

  //生成訂單uuid
  const Myorder_uuid = uuidv4();
  console.log(Myorder_uuid);
  //生成好閱讀的訂單編號
  const orderId =
    "FM" +
    base58
      .encode(Buffer.from(Myorder_uuid.replace(/-/g, ""), "hex"))
      .slice(0, 8);
  console.log("orderId", orderId);

  //宣告result
  let result_order_product = [];
  let resulit_order_product_details = [];
  let result_order_lesson = [];
  let result_order_lesson_details = [];

  if (Pids.length > 0) {
    const products = cart.filter((value) => value.id.indexOf("product") !== -1);
    //取出名字
    const PName = products.map((product) => product.name);

    //取出第一個產品圖片
    const Pimgs = products.map((product) => product.img);
    const Pimg = Pimgs[0];
    console.log("Pimg", Pimg);

    //寫入order_product
    const sql_order_product =
      "INSERT INTO `order_product`(`order_uuid`, `order_id`, `product_img`, `member_sid`, `coupon_sid`, `sumprice`,`order_remark`, `order_paid`, `order_sended`, `order_refund`, `order_sdate`, `order_edate`) VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),NOW())";
    [result_order_product] = await db.query(sql_order_product, [
      Myorder_uuid,
      orderId,
      Pimg,
      member,
      coupon,
      sumPrice,
      remark,
      0,
      3,
      3,
    ]);
    //寫入order_product_details
    const sql_order_product_details =
      "INSERT INTO `order_product_details`(`order_uuid`, `product_id`, `product_name`, `product_img`,`product_price`,`product_quantity`) VALUES (?,?,?,?,?,?)";
    if (Pids && Pids.length) {
      for (let i = 0; i < Pids.length; i++) {
        [resulit_order_product_details] = await db.query(
          sql_order_product_details,
          [Myorder_uuid, Pids[i], PName[i], Pimgs[i], PPrice[i], PQuantity[i]]
        );
      }
    } else {
      [resulit_order_product_details] = await db.query(
        sql_order_product_details,
        [Myorder_uuid, Pids, PName, Pimgs, PPrice, PQuantity]
      );
    }
  }

  if (Lids.length > 0) {
    const lessons = cart.filter((value) => value.id.indexOf("lesson") !== -1);
    //取出Lesson日期陣列
    const LDates = lessons.map((lesson) => lesson.date);
    console.log("LDates", LDates);

    //取出Lesson日期價格陣列
    const LQuantity = lessons.map((lesson) => lesson.quantity);
    console.log("LQuantity", LQuantity);
    //取出lessonName
    const LName = lessons.map((lesson) => lesson.name);

    //取出LessonImg
    const LImgs = lessons.map((lesson) => lesson.img);
    const Limg = LImgs[0];
    //取出price
    const LPrice = lessons.map((lesson) => lesson.price);

    //寫入order_lesson
    const sql_order_lesson =
      "INSERT INTO `order_lesson`(`order_uuid`, `order_id`, `lesson_img`, `member_sid`, `coupon_sid`, `sumprice`,`order_remark`, `order_paid`, `order_refund`, `order_sdate`, `order_edate`) VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())";

    [result_order_lesson] = await db.query(sql_order_lesson, [
      Myorder_uuid,
      orderId,
      Limg,
      member,
      coupon,
      sumPrice,
      remark,
      0,
      3,
    ]);

    //寫入order_lesson_details
    const sql_order_lesson_details =
      "INSERT INTO `order_lesson_details`(`order_uuid`, `lesson_id`, `lesson_name`, `lesson_img`, `lesson_price`, `lesson_quantity`, `lesson_date`) VALUES (?,?,?,?,?,?,?)";

    if (Lids && Lids.length) {
      for (let i = 0; i < Lids.length; i++) {
        [result_order_lesson_details] = await db.query(
          sql_order_lesson_details,
          [
            Myorder_uuid,
            Lids[i],
            LName[i],
            LImgs[i],
            LPrice[i],
            LQuantity[i],
            LDates[i],
          ]
        );
      }
    } else {
      [result_order_lesson_details] = await db.query(sql_order_lesson_details, [
        Myorder_uuid,
        Lids,
        LName,
        LImgs,
        LPrice,
        LQuantity,
        LDates,
      ]);
    }
  }

  console.log({ coupon });


  res.json({
    success: true,
    // success: !!resulit_order_product_details.affectedRows,
    // success: !!result_order_lesson.affectedRows,
    // success: !!result_order_lesson_details.affectedRows,
    postData: req.body,
  });
});

module.exports = router;
