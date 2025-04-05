'use strict';
const express = require('express');
const path = require('path');
const router = express.Router();

router.route('/*')
    .get((req, res) => {
      if (/(.ico|.js|.css|.jpg|.png|.map)$/i.test(req.path)) {
        console.log("hi1");
      } else {
        console.log("hi");
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
      }
      console.log(__dirname);
      res.sendFile(path.join(__dirname, '..', '..', 'snek', 'build', 'index.html'));
    })

module.exports = router;