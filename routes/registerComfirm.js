const express = require("express");
const db = require("./../modules/db_connect");
const router = express.Router();

router.use((req, res, next) => {
    /*if (!req.session.admin) {
      return res.redirect("/login");
    }*/
    next();
});


