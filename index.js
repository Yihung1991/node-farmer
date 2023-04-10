require("dotenv").config({
  path: "./production.env",
});

//***********************************以下引入npm外掛及模組***********************************

// 引入express
const express = require("express");

//引入session-store
const session = require("express-session");


// 引入jwt
const jwt = require('jsonwebtoken')

//引入cors
const cors = require("cors");

//時間格式轉換套件
const moment = require("moment-timezone");

//使用者資訊加密套件（加鹽）
const bcrypt = require('bcrypt');

//引入資料庫
const db = require("./modules/db_connect");

//建立web server 物件
const app = express();

//引入上傳圖片的模組(ZOE)
const upload = require("./modules/upload_img");


//***************************以下設定頂層中介軟體(top-level middleware)***************************
app.set('view engine', 'ejs');


//登入
// top-level middlewares

//解析urlencoded
app.use(express.urlencoded({ extended: false }));

//解析json
app.use(express.json());

//使用cors，允許跨來源請求(存取資源)
const corsOptions = {
  credentials: true,
  origin: function (origin, cb) {
    cb(null, true);
  },
};
app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.locals.bearer = {}; // 預設值
  // 取得 headers 裡的 Authorization
  // 判定有沒有登入權限，並解密token
  let auth = req.get("Authorization");
  if (auth && auth.indexOf("Bearer ") === 0) {
    auth = auth.slice(7); // token
    try {
      res.locals.bearer = jwt.verify(auth, process.env.JWT_SECRET);
    } catch (ex) { }
  }
  // console.log('res.locals.bearer:', res.locals.bearer);

  next();
});

//***********************************以下設定路由***********************************

//路由設定

//get()是http的方法
app.get("/", (req, res) => {
  res.send("我是node首頁");
});

//測試連資料庫
app.get("/try-db", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM `products`");
  res.json(rows);
});

//設定登入驗證資料
app.post("/login", async (req, res) => {
  const output = {
    success: false,
    error: "帳號或密碼錯誤 !!!",
    code: 0,
    postData: req.body,
    token: "",
  };

  const sql = "SELECT * FROM members WHERE member_email=?";

  const [rows] = await db.query(sql, [req.body.account]);
  if (!rows.length) {
    // 帳號是錯的
    output.code = 401;
    return res.json(output);
  }

  let passwordCorrect = false; // 預設密碼是錯的
  try {
    passwordCorrect = await bcrypt.compare(
      req.body.password,
      rows[0].member_password_hash
    );
  } catch (ex) { }

  if (!passwordCorrect) {
    // 密碼是錯的
    output.code = 402;
  } else {
    
    output.success = true;
    output.code = 200;
    output.error = "";

    output.token = jwt.sign(
      {
        sid: rows[0].sid,
        account: rows[0].member_email,
        member_name: rows[0].member_name
      },
      process.env.JWT_SECRET
    );
    output.accountId = rows[0].sid;
    output.account = rows[0].member_email;
    output.member_name = rows[0].member_name;
    output.member_nickname = rows[0].member_nickname;
    output.member_img = rows[0].member_img;
    output.member_state_sid = rows[0].member_state_sid;
    output.member_correct = rows[0].member_correct;
  }
  res.json(output);
});

//連線到SQL裡面的lesson資料
app.use('/lesson', require('./routes/lesson'))

// 產品路由(zoe)
app.use("/product", require("./routes/product"));

// 收藏路由(zoe)
app.use("/bookmark", require("./routes/bookmark"));

// 首頁評論路由(zoe)
app.use("/comment", require("./routes/comment"));

// 測試上傳圖片(zoe)
app.post("/try_upload", upload.single('avatar'), (req, res) => {
  res.json(
    req.file.filename
  );
})


//購物車路由
app.use("/shoppingcart", require("./routes/shoppingcart"));

//購物車寄送地址
app.use("/myaddress", require("./routes/shoppingaddress"));

//LinePay
app.use('/api/pay', require("./routes/pay"))

//優惠卷
app.use("/coupon", require("./routes/coupon"));

//會員註冊
app.use("/register", require("./routes/register"));

app.use("/img", require("./routes/img"));


//驗證註冊資料
app.use("/myDataDetail", require("./routes/myDataDetail"));
//訂單
app.use("/order", require("./routes/order"));

//訂單詳細
app.use("/orderdetails", require("./routes/orderdetails"));

//我的會員右邊
app.use("/mymember", require("./routes/mymember"));

//我的課程日記
app.use("/weekcalender", require("./routes/weekcalender"));

//更新會員資料
app.use("/member", require("./routes/editmember"));

//更新會員圖片
app.use("/memberImg", require("./routes/updatemyimg"));

//我的勳章
app.use("/awards",require("./routes/awards"))

//新增勳章
app.use("/newawards", require("./routes/newAwards"))

//討論區路由
app.use("/community", require("./routes/community"))




//設定靜態內容資料夾
app.use(express.static("public")); //指定資料夾

// 設定404的路由(自訂404頁面)
app.use((req, res) => {
  res.status(404).send("找不到頁面");
});

// 設定偵聽port
// app.listen(3033, () => {
//   console.log(`server啟動:${3033}`);
// });

const port = process.env.PORT || 3033;
app.listen(port, () => {
  console.log(`伺服器啟動: ${port}`);
});
