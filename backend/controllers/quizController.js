import { extractPDFText } from "../services/pdfService.js";
import { generateQuiz, extractTopics } from "../services/geminiService.js";
import { supabase } from "../config/supabase.js";

export const uploadPDF = async (req, res) => {
  try {
    const fileName = `${Date.now()}-${req.file.originalname}`;

    const { error } = await supabase.storage
      .from("pdfs")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      filename: fileName,
    });

  } catch (error) {
    console.error("Upload Error:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};

/**
 * NEW: call this right after upload.
 * Reads the PDF and asks the AI which topics it actually contains, so the
 * frontend can show the user a list to pick from instead of a free-text
 * box. This is what removes the "topic mismatch" problem at the root -
 * the user can only ever choose a topic the AI already confirmed exists.
 *
 * Expects: { filename } in the body
 * Returns: { success, topics: string[] }
 */
export const getTopics = async (req, res) => {
  try {
    const filename = req.body?.filename;

    if (!filename) {
      return res.status(400).json({ error: "filename is required" });
    }

    const { data, error } = await supabase.storage
      .from("pdfs")
      .download(filename);

    if (error) {
      throw error;
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    const pdfText = await extractPDFText(buffer);

    if (!pdfText || !pdfText.trim()) {
      return res.status(400).json({ error: "Could not extract any text from this PDF" });
    }

    const topics = await extractTopics(pdfText);

    return res.status(200).json({
      success: true,
      topics,
    });
  } catch (error) {
    console.error("Backend Error in getTopics:", error);
    return res.status(500).json({
      error: "Internal Server Error occurred during topic extraction",
      details: error.message,
    });
  }
};

/**
 * Expects: { filename, topic } in the body, where `topic` is one of the
 * strings returned by getTopics() above.
 */
export const generateQuestions = async (req, res) => {
  try {
    const topic = req.body?.topic;
    const filename = req.body?.filename;

    if (!topic || !filename) {
      return res.status(400).json({ error: "topic and filename are required" });
    }

    const { data, error } = await supabase.storage
      .from("pdfs")
      .download(filename);

    if (error) {
      throw error;
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    const pdfText = await extractPDFText(buffer);

    // No more naive `cleanText.includes(cleanTopic)` string matching here.
    // That check was unreliable (plurals, phrasing, punctuation) and is no
    // longer needed: the topic the user picked came directly from
    // extractTopics(), so it is already guaranteed to exist in the PDF.

    let response = await generateQuiz(pdfText, topic);

    if (!response) {
      return res.status(500).json({ error: "AI service returned an empty response string." });
    }

    response = response.trim();

    const jsonStart = response.indexOf("[");
    const jsonEnd = response.lastIndexOf("]") + 1;

    if (jsonStart === -1 || jsonEnd === 0) {
      console.error("❌ Array formatting tokens not found. Raw output was:", response);
      return res.status(500).json({
        error: "AI returned an unexpected format",
        details: "Could not locate a JSON array in the model response.",
        rawResponse: response,
      });
    }

    response = response.substring(jsonStart, jsonEnd);

    let questions;
    try {
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

    await supabase.storage
  .from("pdfs")
  .remove([filename]);

    return res.status(200).json(formattedQuestions);
  } catch (error) {
    console.error("Backend Error in generateQuestions:", error);
    return res.status(500).json({
      error: "Internal Server Error occurred during question generation",
      details: error.message,
    });
  }
};