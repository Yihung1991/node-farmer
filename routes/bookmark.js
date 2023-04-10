const express = require("express");

const db = require("./../modules/db_connect");

//需要利用multer來解析表單資料multipart/form-data
const upload = require("./../modules/upload_img");

const router = express.Router();

// -----------------以下設定抓資料函式-----------------------

const getBookmarkData = async (req, res) => {
  // console.log(res.locals.bearer);
  const perPage = 6;
  let page = +req.query.page || 1;
  let totalPagesP
  let totalPagesL
  let totalP
  let totalL
  if (res.locals.bearer.sid && res.locals.bearer.account) {
    // 有登入
    const member_sid = res.locals.bearer.sid;  
    
    // 商品收藏總筆數
    [[{ totalP }]] = await db.query(
      `SELECT COUNT(1) AS totalP FROM bookmark_product WHERE \`member_sid\` = ${member_sid}`
    );
    // 商品收藏總頁數
    totalPagesP = Math.ceil(totalP / perPage);

    // 商品收藏
    const sql = `SELECT bookmark_product.*, products.product_name,products.product_img,products.product_price FROM \`bookmark_product\` LEFT JOIN \`products\` ON bookmark_product.\`product_sid\`=products.\`sid\`  WHERE \`member_sid\` = ${member_sid} ORDER BY bookmark_product.sid DESC LIMIT 
    ${(page - 1) * perPage} , ${perPage}  `;
    [bookmark_product] = await db.query(sql);   

     // 課程收藏總筆數
    [[{ totalL }]] = await db.query(
      `SELECT COUNT(1) AS totalL FROM bookmark_lesson WHERE \`member_sid\` = ${member_sid}`
    );
    // 課程收藏總頁數
    totalPagesL = Math.ceil(totalL / perPage);

    // 課程收藏
    const sql2 = `SELECT bookmark_lesson.*, lesson.lesson_name,lesson.lesson_img,lesson.lesson_price FROM \`bookmark_lesson\` LEFT JOIN \`lesson\` ON bookmark_lesson.\`lesson_sid\`=lesson.\`sid\`  WHERE \`member_sid\` = ${member_sid} ORDER BY bookmark_lesson.sid DESC LIMIT 
    ${(page - 1) * perPage} , ${perPage}  `;
    [bookmark_lesson] = await db.query(sql2);  

  } else {
    // 沒登入
    console.log("沒登入");
    return;
  }
  return { page,totalP,totalL, totalPagesP,totalPagesL, bookmark_product,bookmark_lesson };
};

// -----------------以下設定API路由-----------------------

// 新增收藏(:type)
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
      // 商品收藏
      let { product_sid } = req.body;
      const sql =
        "INSERT INTO `bookmark_product`(`member_sid`, `product_sid`) VALUES (?,?)";
      const [result] = await db.query(sql, [member_sid, product_sid]);
      output.success = !!result.affectedRows;
      output.error = output.success ? "" : "新增商品收藏發生錯誤";
    } else {
      // 課程收藏
      let { lesson_sid } = req.body;
      const sql =
        "INSERT INTO `bookmark_lesson`(`member_sid`, `lesson_sid`) VALUES (?,?)";
      const [result] = await db.query(sql, [member_sid, lesson_sid]);
      output.success = !!result.affectedRows;
      output.error = output.success ? "" : "新增課程收藏發生錯誤";
    }
  } else {
    // 沒登入
    output.error = "沒有登入";
  }
  res.json(output);
});

// 刪除收藏(/:type/:sid)
router.delete("/delete/:type/:sid", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };
  if (res.locals.bearer.sid && res.locals.bearer.account) {
    // 有登入
    if (req.params.type === "product") {
      // 刪除商品收藏
      const sql = `DELETE FROM bookmark_product WHERE member_sid=? AND product_sid=?`;
      const [result] = await db.query(sql, [
        res.locals.bearer.sid,
        req.params.sid,
      ]);
      output.success = !!result.affectedRows;
      output.error = output.success ? "" : "刪除發生錯誤";
    } else {
      // 刪除課程收藏
      const sql = `DELETE FROM bookmark_lesson WHERE member_sid=? AND lesson_sid=?`;
      const [result] = await db.query(sql, [
        res.locals.bearer.sid,
        req.params.sid,
      ]);
      output.success = !!result.affectedRows;
      output.error = output.success ? "" : "刪除發生錯誤";
    }
  } else {
    // 沒登入
    output.error = `沒有權限做刪除`;
  }
  res.json(output);
});

// 取得收藏資料
router.get("/mybookmark", async (req, res) => {
  res.json(await getBookmarkData(req, res));
});

module.exports = router;
