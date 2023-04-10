const express = require("express");
const router = express.Router();
const db = require("./../modules/db_connect");

router.use(express.json());

router.put("/edit/:sid", async (req, res) => {
  const sid = req.params.sid;
  console.log(req.body.updateData);
  if(!req.body.updateData)return
  let { member_email, member_name, member_nickname, member_mobile,member_birthday } = req.body.updateData;
  //轉換日期格式
  const dateString = member_birthday;
  const date = new Date(dateString);
  const formattedDate = date.toISOString().slice(0, 10);
  const sql =
    "UPDATE members SET member_email= ?,member_name=?,member_nickname= ?,member_mobile= ?,member_birthday=? WHERE sid = ?";

  const [result] = await db.query(sql, [
    member_email,
    member_name,
    member_nickname,
    member_mobile,
    formattedDate,
    sid,
  ]);

  res.json({
    success: !!result.changedRows,
    formData: req.body,
    result,
  });
});



router.put("/editaddress/:sid", async (req, res) => {
  const sid = req.params.sid;
  console.log(req.body.updateData);
  if (!req.body.updateData) return;
  let {
    member_name,
    member_mobile,
    member_address_1,
    member_address_2,
    member_address_3,
  } = req.body.updateData;
  const sql =
    "UPDATE members SET member_name= ?,member_mobile=?,member_address_1=?,member_address_2= ?,member_address_3=? WHERE sid = ?";

  const [result] = await db.query(sql, [
    member_name,
    member_mobile,
    member_address_1,
    member_address_2,
    member_address_3,
    sid,
  ]);

  res.json({
    success: !!result.changedRows,
    formData: req.body,
    result,
  });
});
module.exports = router;

