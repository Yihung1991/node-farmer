// 這支是用來上傳圖檔(會員大頭貼)及解析表單資料用的(ZOE)

// 引入multer
const multer = require("multer");

// 上傳圖檔檔名用
const { v4:uuidv4} = require("uuid");

// 篩選上傳圖檔類型
const extMap = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif'
}

// 過濾檔案的規則
const fileFilter =(req,file,cb)=>{
  // 如果有拿到值就會得到true，沒有就是false
  // 第一個參數放錯誤訊息(為了不打斷api所以給null)
  cb(null, !!extMap[file.mimetype]);
};

// 上傳檔案的位置(會員大頭貼)
const storage = multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,__dirname+'/../public/images/avatar')
  },
  filename: (req,file,cb)=>{
    const ext = extMap[file.mimetype];
    const fid = uuidv4();
    cb(null,fid+ext);
  }
});


const upload = multer({fileFilter,storage});
module.exports = upload;