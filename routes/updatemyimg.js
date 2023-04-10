const express = require("express");
const router = express.Router();
const db = require("./../modules/db_connect");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

router.use(express.json());

// 創建目錄
// const UPLOADS_FOLDER = 'uploads';
// if (!fs.existsSync(UPLOADS_FOLDER)) {
//   fs.mkdirSync(UPLOADS_FOLDER);
// }

// 配置Multer中間件
const storage = multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,__dirname+'/../public/images/avatar')
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

// POST請求處理程序
router.post("/upload", upload.single("file"), async (req, res) => {
  if (res.locals.bearer.sid && res.locals.bearer.account) {
    const sid = res.locals.bearer.sid;
    // console.log(req.body.sid);
    // const sid = req.body.sid;
    const img = req.file.filename;
    console.log(req.file.filename); // access uploaded file using req.file

    const sql_memberimg = `UPDATE members SET member_img = ? WHERE sid = ${sid}`;
    const [result] = await db.query(sql_memberimg, [img]);
    // res.send('File uploaded!');
    const sql_member = `SELECT * FROM members WHERE sid=${sid}`;
    const [r_sql_member] = await db.query(sql_member);
    let finalresult = {};
    if (r_sql_member.length) {
      finalresult = r_sql_member[0];
    }
    res.json(finalresult);
  }
});


router.post("/myImg", async (req, res) => {
   if (!res.locals.bearer) return;
    const myAuth = req.body.myAuth;
    if (myAuth === null) return;

    let result = {};
    const sql_myimg = `SELECT member_img FROM members WHERE sid=${myAuth.accountId}`;
    const [r_sql_myimg] = await db.query(sql_myimg);
    result = r_sql_myimg[0]
    console.log("img", result);
    res.json(result);
    
    
  }
);


module.exports = router;




