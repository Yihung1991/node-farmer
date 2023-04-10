const express = require("express");
const router = express.Router();
const db = require("./../modules/db_connect");
router.use(express.json());

router.post("/", async (req, res) => {
  let mymember = {};
  let myawards = {};
  let mylevel = { level: 0, levelState: "小農新手", levelimg: "New" };
  if (res.locals.bearer.sid && res.locals.bearer.account) {
  const member_sid = res.locals.bearer.sid;
  const sql_my_address = `SELECT * FROM members WHERE sid in (?);`;

  
  const [result_my_address] = await db.query(sql_my_address, [member_sid]);
  if (result_my_address.length) {
    mymember = result_my_address[0];
  }

   const sql_awards_d = `SELECT awards_sid FROM awards_details WHERE member_sid in (?)`;
   const [r_awards_d] = await db.query(sql_awards_d, [member_sid]);
   // console.log(r_awards_d);
   const awards_sid = [].concat(
     ...Object.values(r_awards_d).map((obj) => obj.awards_sid)
   );
   if (awards_sid.length) {
     const sql_awards = `SELECT * FROM awards WHERE sid in (?)`;
     [myawards] = await db.query(sql_awards, [awards_sid]);
     console.log("myawards", myawards);
   }



   //會員等級
    if (awards_sid.length) {
      const sql_value = `SELECT awards_value FROM awards WHERE sid in (?)`;
      const [r_value] = await db.query(sql_value, [awards_sid]);
      // console.log(r_value)
      mylevel.level = r_value.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.awards_value;
      }, 0);
    }
    console.log("mylevel.level",mylevel.level);


  
    switch (true) {
      case mylevel.level < 10:
        mylevel.levelState = ["小農新手"];
        break;
      case mylevel.level >= 30 && mylevel.level <= 50:
        mylevel.levelState = ["熱忱小農"];
        break;
      case mylevel.level > 50 && mylevel.level <= 80:
        mylevel.levelState = ["農園高手"];
        break;
      case mylevel.level > 80:
        mylevel.levelState = ["超級小農"];
        break;
      default:
        break;
    }

    switch (true) {
      case mylevel.level < 10:
        mylevel.levelimg = ["New"];
        break;
      case mylevel.level >= 30 && mylevel.level <= 50:
        mylevel.levelimg = ["Primary"];
        break;
      case mylevel.level > 50 && mylevel.level <= 80:
        mylevel.levelimg = ["Medium"];
        break;
      case mylevel.level > 80:
        mylevel.levelimg = ["Highest"];
        break;
      default:
        break;
    }
  }

 
console.log("mylevel",mylevel)
  
  res.json({ mymember: mymember, myawards: myawards, mylevel: mylevel });
});

module.exports = router;
