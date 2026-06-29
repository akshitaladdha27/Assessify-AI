import axios from "axios";

const API = axios.create({
  baseURL: "https://assessify-ai.onrender.com/api",
});

// Clean, modular functions for your components to call
export const generateQuizQuestions = (topic) => API.post("/generate-questions", { topic });
export const saveQuizScore = (quizData) => API.post("/save-score", quizData);
export const fetchDashboardStats = (userName) => API.get(`/dashboard-stats?userName=${userName}`);