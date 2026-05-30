import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export const generateQuiz = async (pdfText, topic) => {
  console.log(`🤖 Live AI generating questions for topic: ${topic} using Meta-Llama...`);

  const prompt = `
    <|begin_of_text|><|start_header_id|>system<|end_header_id|>
    You are a precise JSON-returning backend AI. Analyze the text provided by the user and generate a 10-question multiple-choice quiz based ONLY on the specified topic. 
    Return ONLY a valid raw JSON array matching this exact schema shape. Do not include markdown code fences, notes, or explanations:
    [
      {
        "question": "Dynamic question based on the text?",
        "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
        "correct_answer": "The exact string match of the correct option"
      }
    ]
    <|eot_id|><|start_header_id|>user<|end_header_id|>
    Topic: "${topic}"
    
    Source Material text:
    """
    ${pdfText.substring(0, 4000)} 
    """
    <|eot_id|><|start_header_id|>assistant<|end_header_id|>`;

  // Calling the free serverless Meta Llama 3 model
  const response = await hf.chatCompletion({
    model: "meta-llama/Meta-Llama-3-8B-Instruct",
    messages: [
      { role: "user", content: prompt }
    ],
    max_tokens: 2000, // ⚠️ CRITICAL: Ise 800 se badhakar 2000 ya 3000 kar dein taaki 10 questions poore sama sakein bina cut-off hue!
    temperature: 0.3,
  });

  const aiText = response.choices[0].message.content.trim();
  return aiText;
};