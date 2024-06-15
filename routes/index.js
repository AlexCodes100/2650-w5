import express from "express";
import { notes } from '../persistence.js';

const router = express.Router();



/* GET home page. */
router.get("/", function (req, res, next) {
  const myNotes = notes();
  res.render("index", { title: "YANT (Yet another Note Taking app)", notes: myNotes});
});

export default router;
