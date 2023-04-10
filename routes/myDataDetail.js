const express = require("express");
const router = express.Router();
const db = require("./../modules/db_connect");
router.use(express.json());

router.post("/", async (req, res) => {
    if (!res.locals.bearer) return;
    const myAuth = req.body.myAuth;
    if (myAuth === null) return;
    const sql_myDataDetail = `SELECT * FROM members WHERE sid in (?);`;
    const [result_myDataDetail] = await db.query(sql_myDataDetail, [
        myAuth.accountId,
    ]);
    res.json(result_myDataDetail);
});

module.exports = router;