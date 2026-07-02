import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const API = axios.create({
  baseURL: `${API_URL}/api`,
});

// Clean, modular functions for your components to call
export const generateQuizQuestions = (topic) => API.post("/generate-questions", { topic });
export const saveQuizScore = (quizData) => API.post("/save-score", quizData);
export const fetchDashboardStats = (userName) => API.get(`/dashboard-stats?userName=${userName}`);