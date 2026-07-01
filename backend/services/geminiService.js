import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";

// Keep the prompt inside a safe token budget. The old code sliced this into
// `truncatedText` but then never actually used it -> the FULL pdf text was
// being sent every time, which is the main reason topic-specific quizzes
// looked identical (the model was silently truncating/ignoring context).
const MAX_CONTEXT_CHARS = 8000;

/**
 * Reads the PDF text and asks the AI which topics are ACTUALLY covered in it.
 * The frontend should call this right after upload and show the returned
 * topics as clickable choices, instead of letting the user type a free-text
 * topic that may or may not exist in the document.
 *
 * @param {string} pdfText - full extracted PDF text
 * @returns {Promise<string[]>} list of topic strings found in the document
 */
export const extractTopics = async (pdfText) => {
  const truncatedText = pdfText.slice(0, MAX_CONTEXT_CHARS);

  console.log("🤖 Asking AI to extract topics from the uploaded PDF...");

  try {
    const response = await hf.chatCompletion({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a document analysis assistant. You read study material and return ONLY a raw JSON array of short topic strings (5 to 10 topics) that are ACTUALLY discussed in the given text. Do not invent topics that are not in the text. No markdown, no notes, no conversational text - JSON array only.`,
        },
        {
          role: "user",
          content: `Read the following text and list the distinct topics/sections it actually covers.

          TEXT:
          ${truncatedText}

          Respond with ONLY a JSON array of strings, e.g.:
          ["Topic One", "Topic Two", "Topic Three"]`,
        },
      ],
      max_tokens: 300,
      temperature: 0.1,
    });

    const aiText = response.choices[0].message.content.trim();

    const jsonStart = aiText.indexOf("[");
    const jsonEnd = aiText.lastIndexOf("]") + 1;

    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("Model did not return a JSON array of topics");
    }

    const topics = JSON.parse(aiText.substring(jsonStart, jsonEnd));

    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error("No topics could be extracted from this document");
    }

    return topics;
  } catch (error) {
    console.error("Error extracting topics:", error);
    throw new Error(`Topic extraction failure: ${error.message}`);
  }
};

/**
 * Generates a 10-question quiz for ONE topic. This topic should be one of
 * the strings returned by extractTopics(), so it is already guaranteed to
 * exist in the document - no more mismatch guessing.
 *
 * @param {string} pdfText - full extracted PDF text
 * @param {string} topic - topic chosen by the user
 * @returns {Promise<string>} raw AI response (expected to be a JSON array)
 */
export const generateQuiz = async (pdfText, topic) => {
  const truncatedText = pdfText.slice(0, MAX_CONTEXT_CHARS);

  console.log(`🤖 Live AI generating questions for topic: ${topic}`);

  try {
    const response = await hf.chatCompletion({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a strict JSON quiz-generation API. You generate multiple choice quizzes based ONLY on the supplied context text and ONLY about the requested topic. Never include markdown fences, notes, or conversational text - output raw JSON only.`,
        },
        {
          role: "user",
          content: `
        CONTEXT TEXT FROM PDF:
        ${truncatedText}

        TARGET TOPIC:
        ${topic}

        INSTRUCTIONS:
        1. Generate exactly 10 challenging multiple-choice questions about "${topic}", using only information present in the context text above.
        2. Output MUST be a raw, valid JSON array of objects, matching this schema exactly:
        [
          {
            "question": "Dynamic question based on the text?",
            "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
            "correct_answer": "The exact string match of the correct option",
            "explanation": "A short one or two sentence explanation of why this answer is correct."
          }
        ]
        3. Do not include markdown wrappers like \`\`\`json, notes, or any conversational text - JSON array only.
        `,
        },
      ],
      max_tokens: 2000,
      temperature: 0.2,
    });

    const aiText = response.choices[0].message.content.trim();
    return aiText;
  } catch (error) {
    console.error("Error inside service layer:", error);
    throw new Error(`Hugging Face execution failure: ${error.message}`);
  }
};