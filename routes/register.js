const express = require("express");

const db = require("./../modules/db_connect");

const bcrypt = require('bcrypt');


// const upload = require("./../modules/upload_img");

const multer = require("multer");

const router = express.Router();


router.use((req, res, next) => {
  next();
});


const getListData = async (req, res) => {
  const [[{ totalRows }]] = await db.query(
    `SELECT COUNT(1) totalRows FROM members`
  );
  let emailrows = [];
  const sql = `SELECT sid, member_email, member_name FROM members 
      ORDER BY sid DESC `;

  // return res.send(sql); // SQL 除錯方式之一
  [emailrows] = await db.query(sql);

  return {
    totalRows,
    emailrows,
  }
}

// 以下設定路由
router.get("/", (req, res) => {
  res.send("這是註冊的API");
});


//註冊新會員
router.post("/add", async (req, res) => {
  // router.post("/api", async (req, res) => {
  let {
    member_name,
    member_nickname,
    member_email,
    password,
    matchPassword,
    member_mobile,
    city,
    district,
    // zipcode,
    fulladdress,
    selectDay,
    selectMonth,
    selectYear,
    ava,
  } = req.body;

  console.log(ava)


  if (password == matchPassword) {
    // const member_address_1 = city + district + zipcode + fulladdress;
    const member_birthday = selectYear + "-" + selectMonth + "-" + selectDay;

    password = await bcrypt.hash(password, 10);

    function getRandom(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const member_correct = getRandom(1000, 9999);

    // const sql =
    //   "INSERT INTO `members`(`member_email`, `member_password_hash`, `member_name`, `member_nickname`, `member_mobile`, `member_address_1`, `member_address_2`, `member_address_3`, `member_birthday`, `member_img`, `member_state_sid`, `member_publish_date`, `member_update_date`)VALUES (?,?,?,?,?,?,?,?,?,?,?)"

    // const [result] = await db.query(sql, [member_email, member_password_hash, member_name, member_nickname, member_mobile, member_address_1, 'member_address_2', 'member_address_3', 'member_birthday', 'member_img', 'member_state_sid']);

    const sql =
      "INSERT INTO `members`(`member_email`, `member_password_hash`, `member_name`, `member_nickname`, `member_mobile`, member_address_1, member_address_2, member_address_3, `member_birthday`, `member_correct`,`member_img`)VALUES (?,?,?,?,?,?,?,?,?,?,?)";

    const [result] = await db.query(sql, [
      member_email,
      password,
      member_name,
      member_nickname,
      member_mobile,
      city,
      district,
      fulladdress,
      member_birthday,
      member_correct,
      ava,
    ]);

    //取得新會員的sid
    const sql_sid = `SELECT sid FROM members ORDER BY sid DESC;`;
    const [r_sql_sid] = await db.query(sql_sid);
    const maxSid = r_sql_sid[0].sid;
    console.log(maxSid);

    //贈送註冊禮優惠卷給他
    const sql_coupon =
      "INSERT INTO `coupon_details`(`member_sid`, `coupon_sid`, `coupon_sdate`, `coupon_edate`, `coupon_used`) VALUES (?,?,?,?,?)";
    const [result_sql_coupon] = await db.query(sql_coupon, [
      maxSid,
      1,
      "2023-01-11",
      "2023-12-30",
      2,
    ]);

    //贈送草莓醬
    const sql_coupon_2 =
      "INSERT INTO `coupon_details`(`member_sid`, `coupon_sid`, `coupon_sdate`, `coupon_edate`, `coupon_used`) VALUES (?,?,?,?,?)";
    const [result_sql_coupon_2] = await db.query(sql_coupon, [
      maxSid,
      9,
      "2023-01-11",
      "2023-12-30",
      2,
    ]);
    //贈送生日禮
    const sql_coupon_3 =
      "INSERT INTO `coupon_details`(`member_sid`, `coupon_sid`, `coupon_sdate`, `coupon_edate`, `coupon_used`) VALUES (?,?,?,?,?)";
    const [result_sql_coupon_3] = await db.query(sql_coupon, [
      maxSid,
      3,
      "2023-03-01",
      "2023-04-30",
      2,
    ]);
    //贈送註冊勳章
    const sql_award =
      "INSERT INTO `awards_details`(`member_sid`, `awards_sid`) VALUES (?,?)";
    const [result_sql_award] = await db.query(sql_award, [
      maxSid,
      1
    ]);

    res.json({
      success: !!result.affectedRows,
      postData: req.body,
      result,
      result_sql_coupon,
      result_sql_coupon_2,
      result_sql_coupon_3,
      result_sql_award,
    });
  } else {
    return
  }

});

//Google註冊用
// router.post("/Googleadd", async (req, res) => {
//   // router.post("/api", async (req, res) => {
//   let {
//     member_name,
//     member_nickname,
//     member_email,
//     password,
//     matchPassword,
//     member_mobile,
//     city,
//     district,
//     // zipcode,
//     fulladdress,
//     selectDay,
//     selectMonth,
//     selectYear,
//     ava,
//   } = req.body;
  

//   if (password == matchPassword) {
//     // const member_address_1 = city + district + zipcode + fulladdress;

//     password = await bcrypt.hash(password, 10)


//     const member_correct = 2





//     // const sql =
//     //   "INSERT INTO `members`(`member_email`, `member_password_hash`, `member_name`, `member_nickname`, `member_mobile`, `member_address_1`, `member_address_2`, `member_address_3`, `member_birthday`, `member_img`, `member_state_sid`, `member_publish_date`, `member_update_date`)VALUES (?,?,?,?,?,?,?,?,?,?,?)"

//     // const [result] = await db.query(sql, [member_email, member_password_hash, member_name, member_nickname, member_mobile, member_address_1, 'member_address_2', 'member_address_3', 'member_birthday', 'member_img', 'member_state_sid']);

//     const sql =
//       "INSERT INTO `members`(`member_email`, `member_password_hash`, `member_name`, `member_nickname`, `member_mobile`, member_address_1, member_address_2, member_address_3, `member_correct`,)VALUES (?,?,?,?,?,?,?,?,?)"

//     const [result] = await db.query(sql, [member_email, password, member_name, member_nickname, member_mobile, city, district, fulladdress, member_correct,]);

//     //取得新會員的sid
//     const sql_sid = `SELECT sid FROM members ORDER BY sid DESC;`
//     const [r_sql_sid] = await db.query(sql_sid)
//     const maxSid = r_sql_sid[0].sid;
//     console.log(maxSid)

//     //贈送優惠卷給他
//     const sql_coupon = "INSERT INTO `coupon_details`(`member_sid`, `coupon_sid`, `coupon_sdate`, `coupon_edate`, `coupon_used`) VALUES (?,?,?,?,?)"
//     const [result_sql_coupon] = await db.query(sql_coupon, [maxSid, 1, "2023-01-11", "2023-12-30", 2])


//     res.json({
//       success: !!result.affectedRows,
//       postData: req.body,
//       result,
//       result_sql_coupon
//     });

//   } else {
//     return
//   }

// });

//取得會員註冊的Email
router.get("/getapi", async (req, res) => {
  res.json(await getListData(req, res));
});

module.exports = router;
