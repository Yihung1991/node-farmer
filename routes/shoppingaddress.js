const express = require("express");
const router = express.Router();
const db = require("./../modules/db_connect");
router.use(express.json());

router.post("/", async (req, res) => {
  let result = {};
  if (res.locals.bearer) {
    const sql_my_address = `SELECT * FROM members WHERE sid in (?);`;
    const [result_my_address] = await db.query(sql_my_address, [
      res.locals.bearer.sid,
    ]);
    if (result_my_address.length) {
      result = result_my_address[0];
    }
  }
  res.json(result);
});

module.exports = router;
