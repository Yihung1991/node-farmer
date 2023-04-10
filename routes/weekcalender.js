const express = require("express");
const router = express.Router();
const db = require("./../modules/db_connect");
router.use(express.json());

router.post("/", async (req, res) => {
  if (!res.locals.bearer || !res.locals.bearer) return res.json({});
  console.log({bearer: res.locals.bearer});
  // const myAuth = req.body.myAuth;
  // if (myAuth === null) return;
  const sql_my_lesson = `SELECT * FROM order_lesson WHERE member_sid = ${res.locals.bearer.sid}`;
  const [result_my_lesson] = await db.query(sql_my_lesson);

  const order_uuids = result_my_lesson.map((l) => {
    return l.order_uuid;
  });
  if (!order_uuids.length) return res.json({});
  const sql_my_lessondetails = `SELECT * FROM order_lesson_details WHERE order_uuid in (?)`;
  const [result_my_lessondetails] = await db.query(sql_my_lessondetails, [
    order_uuids,
  ]);
  res.json(result_my_lessondetails);
});

module.exports = router;
