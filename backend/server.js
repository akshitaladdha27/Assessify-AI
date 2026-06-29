import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import quizRoutes from "./routes/quizRoutes.js";
import { supabase } from "./services/supabaseService.js";

dotenv.config();

const app = express();

app.use(cors());

// Parse JSON
app.use(express.json());

// Parse form-data fields like topic
app.use(express.urlencoded({ extended: true }));

app.use("/api", quizRoutes);

app.get("/", (req, res) => {
  res.send("Quiz Generator Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("⚡ Supabase Service Client attached successfully.");
});