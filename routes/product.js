const express = require("express");

const db = require("./../modules/db_connect");

const router = express.Router();

// 商品清單資料函式
const getListData = async (req) => {
  let redirect = "";
  // 一頁有幾筆
  const perPage = 12;
  // 當前頁數
  let page = +req.query.page || 1;

  //-----篩選&排序&檢索------
  let sqlWhere = "WHERE 1 ";
  let sqlOrder = " ORDER BY product_name DESC";
  let queryObj = {};
  let cate = req.query.cate;
  let brand = req.query.brand;
  let pro = req.query.pro;
  let veg = req.query.veg;
  let orderprice = req.query.orderprice;
  // let orderscore = req.query.orderscore;
  let search = req.query.search;

  if (search && search.trim()) {
    search = search.trim();
    queryObj = { ...queryObj, search };
    const searchEsc = db.escape("%" + search + "%"); //做sql表示法的跳脫，會自動加上單引號
    sqlWhere += `AND \`product_name\` LIKE ${searchEsc} `;
  }

  if (orderprice) {
    switch (orderprice) {
      case "desc":
        queryObj = { ...queryObj, orderprice };
        sqlOrder = ` ORDER BY product_price DESC`;
        break;
      case "asc":
        queryObj = { ...queryObj, orderprice };
        sqlOrder = ` ORDER BY product_price ASC`;
        break;
    }
  }
  if (brand) {
    let b = brand.split("").join(",");
    queryObj = { ...queryObj, brand };
    sqlWhere += `AND \`product_brand_sid\` IN (${b}) `;
  }
  if (cate) {
    if (brand) {
      let b = brand.split("").join(",");
      queryObj = { ...queryObj, brand };
      sqlWhere += `AND \`product_brand_sid\` IN (${b}) `;
    }
    if (pro) {
      let p = pro.split("").join(",");
      queryObj = { ...queryObj, pro };
      sqlWhere += `AND \`product_processed_sid\` IN (${p})`;
    }
    if (veg) {
      let v = veg.split("").join(",");
      queryObj = { ...queryObj, veg };
      sqlWhere += `AND \`product_vegetable_sid\` IN (${v})`;
    }
    queryObj = { ...queryObj, cate };
    sqlWhere += `AND \`product_category_sid\` = ${cate} `;
  }

  page = parseInt(page);
  if (page < 1) {
    redirect = req.baseUrl;
  }
  // 總筆數
  const [[{ totalRows }]] = await db.query(
    `SELECT COUNT(1) AS totalRows FROM products ${sqlWhere}`
  );

  // 總頁數
  const totalPages = Math.ceil(totalRows / perPage);

  let rows = [];
  if (totalRows > 0) {
    if (page > totalPages) {
      redirect = req.baseUrl + "?page=" + totalPages;
    }
    const sql = `SELECT * FROM \`products\` ${sqlWhere} ${sqlOrder} LIMIT 
      ${(page - 1) * perPage} , ${perPage} `;

    [rows] = await db.query(sql);
  }

  // 新增收藏資料到rows變成newRows
  let bookmarks = [];
  const sql = `SELECT * FROM \`bookmark_product\` WHERE 1`;
  [bookmarks] = await db.query(sql);

  const newRows = rows.map((v, i) => {
    let bookmark_member_sid = [];
    bookmarks.forEach((b, i) => {
      if (b.product_sid === v.sid) {
        bookmark_member_sid.push(b.member_sid);
      }
    });
    return { ...v, bookmark_member_sid };
  });

  // 新增評論資料到newRows變成newRowsC
  let comments = [];
  const sql2 = `SELECT * FROM \`comment_product\` WHERE 1`;
  [comments] = await db.query(sql2);
  const newRowsC = newRows.map((v, i) => {
    let allcomments = [];
    comments.forEach((b, i) => {
      if (b.product_sid === v.sid) {
        allcomments.push(b.comment_value);
      }
    });
    const totalvalue = allcomments.reduce( (a, v)=> {
      return a + v;})
    const comment_value = parseInt( totalvalue / allcomments.length)

    return { ...v, comment_value };
  });



  return {
    page, 
    newRowsC,
    perPage,
    totalRows,
    totalPages,   
    queryObj,
  };
};

// 商品頁面資料函式
const getProductData = async (req) => {
  //-----排序------
  let sqlWhere = "WHERE 1 ";
  let sqlOrder = " ORDER BY comment_publish_date DESC";
  let orderdate = req.query.orderdate;
  let orderscore = req.query.orderscore;

  if (orderdate) {
    switch (orderdate) {
      case "desc":
        sqlOrder = ` ORDER BY comment_publish_date DESC`;
        break;
      case "asc":
        sqlOrder = ` ORDER BY comment_publish_date ASC`;
        break;
    }
  }

  if (orderscore) {
    switch (orderscore) {
      case "desc":
        sqlOrder = ` ORDER BY comment_value DESC`;
        break;
      case "asc":
        sqlOrder = ` ORDER BY comment_value ASC`;
        break;
    }
  }

  // 商品資料
  let rows = [];
  const sql = `SELECT products.*, product_brand.brand_name FROM \`products\` JOIN \`product_brand\` ON products.\`product_brand_sid\`=product_brand.\`sid\`  WHERE products.\`sid\` = ${req.params.sid}`;
  [rows] = await db.query(sql);
  let product_sid = rows[0].sid

  // 農家資料
  let farmers = [];
  let famersid = rows[0].product_brand_sid;
  const sql2 = `SELECT * FROM \`product_brand\` WHERE \`sid\`= ${famersid}`;
  [farmers] = await db.query(sql2);

  // 評論
  let comments = [];
  const sql3 = `SELECT comment_product.*, members.member_nickname, members.member_img FROM \`comment_product\` LEFT JOIN \`members\` ON comment_product.\`member_sid\`=members.\`sid\`  WHERE \`product_sid\` = ${req.params.sid} ${sqlOrder}`;
  [comments] = await db.query(sql3);

  // 將評論平均分數放入商品資料
  const all_value = comments.map((v,i)=>{
    return v.comment_value
  })
  const totalvalue = all_value.reduce( (a, v)=> {
    return a + v;})
  const comment_value = parseInt( totalvalue / all_value.length)
  rows[0].comment_value = comment_value



  // 推薦商品
  let others = [];
  let catagory = rows[0].product_category_sid;
  let num = parseInt(Math.random() * 100);
  // 隨機排會影響收藏功能所以拿掉
  // const sql4 = `SELECT * FROM \`products\` WHERE \`product_category_sid\`= ${catagory} ORDER BY RAND(${num}) LIMIT 4`;
  const sql4 = `SELECT * FROM \`products\` WHERE \`product_category_sid\`= ${catagory}  AND sid NOT IN (${req.params.sid}) LIMIT 4`;
  [others] = await db.query(sql4);

  // 收藏資料
  let bookmarks = [];
  const sql5 = `SELECT * FROM \`bookmark_product\` WHERE product_sid = ${req.params.sid}`;
  [bookmarks] = await db.query(sql5); 
  let bookmark_member_sid = bookmarks.map((v, i) => {
    return v.member_sid;
  });


  // 將收藏資料放入商品資料
  rows[0].bookmark_member_sid = bookmark_member_sid

  // 將收藏資料放入推薦商品資料
  let bookmarksO = [];
  const sql6 = `SELECT * FROM \`bookmark_product\` WHERE 1`;
  [bookmarksO] = await db.query(sql6);

  const newOthers = others.map((v, i) => {
    let bookmark_member_sid = [];
    bookmarksO.forEach((b, i) => {
      if (b.product_sid === v.sid) {
        bookmark_member_sid.push(b.member_sid);
      }
    });
    return { ...v, bookmark_member_sid };
  });

  return {
    rows,
    bookmark_member_sid,
    product_sid,
    farmers,
    comments,
    // others, 
    newOthers   
  };
};

// 以下設定路由
router.get("/", (req, res) => {
  res.send("helloooo");
});

// 商品清單資料
router.get("/api", async (req, res) => {
  res.json(await getListData(req));
});

// 商品頁面資料
router.get("/:sid", async (req, res) => {
  res.json(await getProductData(req));
});


module.exports = router;
