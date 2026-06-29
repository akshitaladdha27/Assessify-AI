import express from "express";
import multer from "multer";

import {
  uploadPDF,
  generateQuestions,
} from "../controllers/quizController.js";

import { 
  saveQuizScore, 
  getUserDashboard 
} from "../controllers/historyController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/upload", upload.single("file"), uploadPDF);

router.post("/generate-questions", generateQuestions);

router.post("/save-score", saveQuizScore);
router.get("/dashboard-stats", getUserDashboard);

export default router;