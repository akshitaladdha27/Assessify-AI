import express from "express";
import multer from "multer";

import {
  uploadPDF,
  generateQuestions,
} from "../controllers/quizController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, "book.pdf");
  },
});

const upload = multer({ storage });

router.post("/upload", upload.single("file"), uploadPDF);

router.post("/generate-questions", generateQuestions);

export default router;