const express = require("express");

const db = require("./../modules/db_connect");

const upload = require("./../modules/upload_img");

const router = express.Router();

const getCommentData = async (req) => {
  let commentsP = [];
  let num = parseInt(Math.random() * 100);
  const sql = `SELECT comment_product.*, members.member_nickname, members.member_img, products.product_img FROM comment_product JOIN members ON comment_product.member_sid=members.sid JOIN products ON comment_product.product_sid=products.sid WHERE 1 ORDER BY RAND(${num}) LIMIT 20`;
  [commentsP] = await db.query(sql);

  let commentsL = [];
  const sql2 = `SELECT comment_lesson.*, members.member_nickname, members.member_img, lesson.lesson_img FROM comment_lesson JOIN members ON comment_lesson.member_sid=members.sid JOIN lesson ON comment_lesson.lesson_sid=lesson.sid WHERE 1 ORDER BY RAND(${num}) LIMIT 20`;
  [commentsL] = await db.query(sql2);

  let comments = [...commentsL, ...commentsP].sort(
    (a, b) => Math.random() - 0.5
  );

  return {
    comments,
  };
};

const getMyComment = async (req, res) => {
  const perPage = 4;
  let page = +req.query.page || 1;
  let totalPagesP;
  let totalPagesL;
  let totalP;
  let totalL;

  if (res.locals.bearer.sid && res.locals.bearer.account) {
    // 有登入
    const member_sid = res.locals.bearer.sid;

    // 商品評價總筆數
    [[{ totalP }]] = await db.query(
      `SELECT COUNT(1) AS totalP FROM comment_product WHERE \`member_sid\` = ${member_sid}`
    );
    // 商品評價總頁數
    totalPagesP = Math.ceil(totalP / perPage);

    // 商品評價(有分頁)
    const sql = `SELECT comment_product.*, products.product_name,products.product_img FROM \`comment_product\` LEFT JOIN \`products\` ON comment_product.\`product_sid\`=products.\`sid\`  WHERE \`member_sid\` = ${member_sid} ORDER BY comment_product.sid DESC LIMIT 
    ${(page - 1) * perPage} , ${perPage}  `;
    [comment_product1] = await db.query(sql);

    // 商品評價加上編輯狀態
    comment_product = comment_product1.map((v, i) => {
      return { ...v, edit: false };
    });

    // 課程評價總筆數
    [[{ totalL }]] = await db.query(
      `SELECT COUNT(1) AS totalL FROM comment_lesson WHERE \`member_sid\` = ${member_sid}`
    );
    // 課程評價總頁數
    totalPagesL = Math.ceil(totalL / perPage);

    // 課程評價(有分頁)
    const sql2 = `SELECT comment_lesson.*, lesson.lesson_name,lesson.lesson_img FROM \`comment_lesson\` LEFT JOIN \`lesson\` ON comment_lesson.\`lesson_sid\`=lesson.\`sid\`  WHERE \`member_sid\` = ${member_sid} ORDER BY comment_lesson.sid DESC LIMIT 
    ${(page - 1) * perPage} , ${perPage}  `;
    [comment_lesson1] = await db.query(sql2);

    // 課程評價加上編輯狀態
    comment_lesson = comment_lesson1.map((v, i) => {
      return { ...v, edit: false };
    });

    // 會員所有商品評價(沒分頁)
    const sql11 = `SELECT * FROM \`comment_product\` WHERE \`member_sid\` = ${member_sid} `;
    [comment_product_ALL] = await db.query(sql11);

    // 會員所有課程評價(沒分頁)
    const sql22 = `SELECT * FROM \`comment_lesson\` WHERE \`member_sid\` = ${member_sid} `;
    [comment_lesson_ALL] = await db.query(sql22);

    // 已評價過的商品明細清單(sid)
    didcomment_product_sid = comment_product_ALL.map((v, i) => {
      return v.order_product_details_sid;
    });

    // 已評價過的課程明細清單(sid)
    didcomment_lesson_sid = comment_lesson_ALL.map((v, i) => {
      return v.order_lesson_details_sid;
    });

    notinP =
      didcomment_product_sid.length === 0
        ? ""
        : `NOT IN (${didcomment_product_sid.toString()})`;
    notinL =
      didcomment_lesson_sid.length === 0
        ? ""
        : `NOT IN (${didcomment_lesson_sid.toString()})`;

    // console.log(notinP,notinL)

    // 會員未評價商品訂單明細
    const sql3 = `SELECT order_product.order_sdate,order_product_details.* FROM order_product JOIN order_product_details ON \`order_product\`.\`order_uuid\`=\`order_product_details\`.\`order_uuid\` WHERE \`member_sid\`=${member_sid} AND \`order_product_details\`.\`sid\` ${notinP} ORDER BY order_product.order_sdate DESC LIMIT ${
      (page - 1) * perPage
    } , ${perPage}`;
    [order_product1] = await db.query(sql3);

    order_product = order_product1.map((v, i) => {
      return { ...v, edit: false };
    });

    // // 會員未評價商品訂單總筆數
    [[{ totalPO }]] = await db.query(
      `SELECT COUNT(1) AS totalPO FROM order_product 
        JOIN order_product_details ON \`order_product\`.\`order_uuid\`=\`order_product_details\`.\`order_uuid\`     
        WHERE \`member_sid\`=${member_sid} AND \`order_product_details\`.\`sid\` ${notinP}`
    );
    // 會員未評價商品訂單總頁數
    totalPagesPO = Math.ceil(totalPO / perPage);

    // 會員未評價課程訂單明細
    const sql4 = `SELECT order_lesson.order_sdate,order_lesson_details.* FROM order_lesson JOIN order_lesson_details ON \`order_lesson\`.\`order_uuid\`=\`order_lesson_details\`.\`order_uuid\` WHERE \`member_sid\`=${member_sid} AND \`order_lesson_details\`.\`sid\` ${notinL} ORDER BY order_lesson.order_sdate DESC LIMIT ${
      (page - 1) * perPage
    } , ${perPage}`;
    [order_lesson1] = await db.query(sql4);

    order_lesson = order_lesson1.map((v, i) => {
      return { ...v, edit: false };
    });

    // // 會員未評價課程訂單總筆數
    [[{ totalLO }]] = await db.query(
      `SELECT COUNT(1) AS totalLO FROM order_lesson 
        JOIN order_lesson_details ON \`order_lesson\`.\`order_uuid\`=\`order_lesson_details\`.\`order_uuid\`     
        WHERE \`member_sid\`=${member_sid} AND \`order_lesson_details\`.\`sid\` ${notinL}`
    );
    // // 會員未評價課程訂單總頁數
    totalPagesLO = Math.ceil(totalLO / perPage);
  } else {
    // 沒登入
    console.log("沒登入");
    return;
  }
  return {
    page,
    totalP,
    totalL,
    totalPO,
    totalLO,
    totalPagesP,
    totalPagesL,
    totalPagesPO,
    totalPagesLO,
    comment_product,
    comment_lesson,
    order_product,
    order_lesson,
  };
};

// 所有評價資料(首頁用)
router.get("/api", async (req, res) => {
  res.json(await getCommentData(req));
});

// 會員評價資料(會員用)
router.get("/mycomment", async (req, res) => {
  res.json(await getMyComment(req, res));
});

// 新增評論(:type)
router.post("/add/:type", upload.none(), async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: "",
  };
  // console.log(res.locals.bearer);
  if (res.locals.bearer.sid && res.locals.bearer.account) {
    const member_sid = res.locals.bearer.sid;
    // 有登入
    if (req.params.type === "product") {
      // 商品評論
      let {
        order_product_details_sid,
        product_sid,
        comment_value,
        comment_content,
      } = req.body;
      const sql =
        "INSERT INTO `comment_product`(`order_product_details_sid`,`member_sid`, `product_sid`,`comment_value`,`comment_content`) VALUES (?,?,?,?,?)";
      const [result] = await db.query(sql, [
        order_product_details_sid,
        member_sid,
        product_sid,
        comment_value,
        comment_content,
      ]);
      output.success = !!result.affectedRows;
      output.error = output.success ? "" : "新增商品評論出錯";
    } else {
      // 課程評論
      let {
        order_lesson_details_sid,
        lesson_sid,
        comment_value,
        comment_content,
      } = req.body;
      const sql =
        "INSERT INTO `comment_lesson`(`order_lesson_details_sid`,`member_sid`, `lesson_sid`,`comment_value`,`comment_content`) VALUES (?,?,?,?,?)";
      const [result] = await db.query(sql, [
        order_lesson_details_sid,
        member_sid,
        lesson_sid,
        comment_value,
        comment_content,
      ]);
      output.success = !!result.affectedRows;
      output.error = output.success ? "" : "新增課程評論出錯";
    }
  } else {
    // 沒登入
    output.error = "沒有登入";
  }
  res.json(output);
});



// 修改評論(:type)
router.post("/edit/:type", upload.none(), async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    error: "",
  };
  // console.log(res.locals.bearer);
  const now = new Date()
  if (res.locals.bearer.sid && res.locals.bearer.account) {
    const member_sid = res.locals.bearer.sid;
    // 有登入
    if (req.params.type === "product") {
      // 商品評論
      let {        
        comment_value,
        comment_content,
        sid,
      } = req.body;
      
      const sql =
      `UPDATE \`comment_product\` SET \`comment_value\`=?, \`comment_content\`=? ,\`comment_publish_date\`=? WHERE \`sid\`=?`        
      const [result] = await db.query(sql, [
        comment_value,
        comment_content,
        now,
        sid,
      ]);
      output.success = !!result.affectedRows;
      output.error = output.success ? "" : "修改商品評論出錯";
    } else {
      // 課程評論      
      let {        
        comment_value,
        comment_content,
        sid,
      } = req.body;
    
      const sql =
      `UPDATE \`comment_lesson\` SET \`comment_value\`=?, \`comment_content\`=? ,\`comment_publish_date\`=? WHERE \`sid\`=?`        
      const [result] = await db.query(sql, [
        comment_value,
        comment_content,
        now,
        sid,
      ]);
      output.success = !!result.affectedRows;
      output.error = output.success ? "" : "修改課程評論出錯";
    }
  } else {
    // 沒登入
    output.error = "沒有登入";
  }
  res.json(output);
});


module.exports = router;
