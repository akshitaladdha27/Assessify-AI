import { extractPDFText } from "../services/pdfService.js";
import { generateQuiz } from "../services/geminiService.js"; 

export const uploadPDF = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      filename: req.file.filename
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

    const pdfText = await extractPDFText("./uploads/book.pdf");

    let response = await generateQuiz(pdfText, topic);

    console.log("Raw response from AI:", response);

    if (response.includes("```")) {
      response = response.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    let questions;
    try {
      const jsonStart = response.indexOf("[");
      const jsonEnd = response.lastIndexOf("]") + 1;
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        response = response.substring(jsonStart, jsonEnd);
      }

      questions = JSON.parse(response);
    } catch (err) {
      console.error("JSON Parsing failed. Cleaned response was:", response);
      return res.status(500).json({
        error: "AI returned an invalid or cut-off JSON structure",
        details: err.message,
        rawResponse: response,
      });
    }

    const formattedQuestions = questions.map((q) => {
      const optionsList = q.options || q.choices || [];
      const correctAns = q.correct_answer || q.answer || "";

      return {
        question: q.question || "Missing question text",
        explanation: q.explanation || "No explanation provided for this question.",
        correctAnswerText: correctAns, 
        answers: optionsList.map((option) => ({
          text: option,
          correct: String(option).trim() === String(correctAns).trim(),
        })),
      };
    });

    return res.status(200).json(formattedQuestions);

  } catch (error) {
    console.error("Backend Error in generateQuestions:", error);
    return res.status(500).json({
      error: "Internal Server Error occurred during question generation",
      details: error.message,
    });
  }
};