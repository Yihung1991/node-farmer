const express = require('express');
const router = express.Router();
const db = require('./../modules/db_connect');
router.use(express.json());


router.post('/', async(req, res) => {
  let myawards=[]
  let allaward = [];
  let mylevel = { level: 0, levelState: "小農新手", levelimg: "New" };

   if (res.locals.bearer.sid && res.locals.bearer.account) {
    //取得所有勳章
    const member_sid = res.locals.bearer.sid;
    console.log('M:',member_sid);
     const sql_allawards = `SELECT * FROM awards`;
     [allaward] = await db.query(sql_allawards);
     console.log("1", allaward);

  //取得當前勳章 
  const sql_awards_d = `SELECT awards_sid FROM awards_details WHERE member_sid in (?)`;
  const [r_awards_d] = await db.query(sql_awards_d, [member_sid]);  
  const awards_sid = [].concat(...Object.values(r_awards_d).map(obj => obj.awards_sid));
  if (awards_sid.length) { 
      const sql_awards = `SELECT * FROM awards WHERE sid in (?)`;
      [myawards] = await db.query(sql_awards, [awards_sid]);
      console.log("2", myawards);
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
   console.log("mylevel.level", mylevel.level);

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

  res.json({ myawards: myawards, allaward: allaward, mylevel: mylevel });

})



module.exports = router;

