import express from "express";
import multer from "multer";

import {
  uploadPDF,
  generateQuestions,
  getTopics
} from "../controllers/quizController.js";

import { 
  saveQuizScore, 
  getUserDashboard 
} from "../controllers/historyController.js";

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({ storage });

router.post("/upload", upload.single("file"), uploadPDF);
router.post("/get-topics", getTopics);

router.post("/generate-questions", generateQuestions);

router.post("/save-score", saveQuizScore);
router.get("/dashboard-stats", getUserDashboard);

export default router;