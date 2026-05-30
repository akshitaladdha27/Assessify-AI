import { extractPDFText } from "../services/pdfService.js";
import { generateQuiz } from "../services/geminiService.js"; 

export const uploadPDF = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const generateQuestions = async (req, res) => {
  try {
    console.log("Incoming request body:", req.body);
    const topic = req.body?.topic;

    // Extract text from the saved PDF
    const pdfText = await extractPDFText("./uploads/book.pdf");

    // Call Gemini API
    let response = await generateQuiz(pdfText, topic);

    console.log("Raw response from Gemini:", response);

    // Advanced cleaning: Strip markdown code blocks if Gemini includes them
    if (response.includes("```")) {
      response = response.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    let questions;
    try {
      questions = JSON.parse(response);
    } catch (err) {
      console.error("JSON Parsing failed. Cleaned response was:", response);
      return res.status(500).json({
        error: "Gemini returned invalid JSON structure",
        rawResponse: response,
      });
    }

    // Map to format required by QuizPage.jsx
    const formattedQuestions = questions.map((q) => {
      // Safety checks to ensure keys exist
      const optionsList = q.options || q.choices || [];
      const correctAns = q.correct_answer || q.answer || "";

      return {
        question: q.question || "Missing question text",
        answers: optionsList.map((option) => ({
          text: option,
          correct: String(option).trim() === String(correctAns).trim(),
        })),
      };
    });

    // Send the success response back to React
    return res.status(200).json(formattedQuestions);

  } catch (error) {
    console.error("🔴 Backend Error in generateQuestions:", error);
    return res.status(500).json({
      error: "Internal Server Error occurred during question generation",
      details: error.message,
    });
  }
};