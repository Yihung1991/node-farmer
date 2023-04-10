const express = require("express");
const db = require("./../modules/db_connect");
const router = express.Router();

const getListData = async (req) => {
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

  // 課程資料
  let rows = [];
  const sql = `SELECT lesson.*, lesson_teacher.name, lesson_teacher.teacher_info, lesson_teacher.teacher_img,lesson_category.lesson_category FROM lesson 
  JOIN lesson_teacher ON lesson_teacher.sid=lesson.lesson_teacher_sid 
  JOIN lesson_category ON lesson_category.sid=lesson.lesson_category_sid WHERE lesson.sid=${req.params.sid}`;
  [rows] = await db.query(sql);
  const lesson_date = rows[0].lesson_date;
  // console.log(lesson_date)

  //人數限制
  let limit = {};
  let lesson_id = `lesson_000${req.params.sid}`
  const sql5 = `SELECT SUM(lesson_quantity) AS lesson_uplimit FROM order_lesson_details WHERE lesson_id ='${lesson_id}'AND lesson_date='${lesson_date.split(',')[0]}'`;
  [limit] = await db.query(sql5);
  const uplimit1 = limit[0].lesson_uplimit
  console.log('limit1',limit[0].lesson_uplimit);
  
  let limit2 = {};
  const sql6 = `SELECT SUM(lesson_quantity) AS lesson_uplimit FROM order_lesson_details WHERE lesson_id ='${lesson_id}'AND lesson_date='${lesson_date.split(',')[1]}'`;
  [limit2] = await db.query(sql6);
  const uplimit2 = limit2[0].lesson_uplimit
  console.log('limit2',limit2[0].lesson_uplimit);
  

  // 老師資料
  let teachers = [];
  let teachersid = rows[0].lesson_teacher_sid;
  const sql2 = `SELECT lesson_teacher.* FROM lesson_teacher WHERE sid = ${teachersid}`;
  [teachers] = await db.query(sql2);

  // 課程評論
  let comments = [];
  const sql3 = `SELECT comment_lesson.*, members.member_nickname FROM comment_lesson LEFT JOIN members ON comment_lesson.member_sid=members.sid  WHERE lesson_sid = ${req.params.sid} ${sqlOrder}`;
  [comments] = await db.query(sql3);

  // 將評論平均分數放入商品資料
  const all_value = comments.map((v, i) => {
    return v.comment_value;
  });
  const totalvalue = all_value.reduce((a, v) => {
    return a + v;
  });
  const comment_value = parseInt(totalvalue / all_value.length);
  rows[0].comment_value = comment_value;

  // 課程詳細收藏資料
  let bookmarks = [];
  const sql4 = `SELECT * FROM bookmark_lesson WHERE lesson_sid = ${req.params.sid}`;
  [bookmarks] = await db.query(sql4);
  let bookmark_member_sid = bookmarks.map((v, i) => {
    return v.member_sid;
  });
  // 將收藏資料放入課程資料
  rows[0].bookmark_member_sid = bookmark_member_sid;

  return {
    rows,
    lesson_date,
    teachers,
    comments,
    bookmark_member_sid,
    uplimit1,
    uplimit2,
    
  };
};

router.get("/lessonList", async (req, res) => {
  const [rows] = await db.query(
    `SELECT lesson.*, lesson_teacher.name,lesson_teacher.slogan, lesson_teacher.teacher_info, lesson_teacher.teacher_img,lesson_category.lesson_category FROM lesson JOIN lesson_teacher ON lesson_teacher.sid=lesson.lesson_teacher_sid JOIN lesson_category ON lesson_category.sid=lesson.lesson_category_sid;`
  );
  res.json(rows);
});

router.get("/:sid", async (req, res) => {
  res.json(await getListData(req));
  // console.log(rows);
});

module.exports = router;
