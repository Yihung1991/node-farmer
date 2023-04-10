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
    destination: (req, file, cb) => {
        cb(null, __dirname + '/../public/images/avatar')
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
    res.json(req.file.filename)

});

module.exports = router;





