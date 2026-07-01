import { supabase } from "../services/supabaseService.js";
/**
 * Save a completed quiz session into the database
 * POST /api/save-score
 */
export const saveQuizScore = async (req, res) => {
  try {
    const { topic, total_questions, score, userName } = req.body;

    // Validate incoming input parameters
    if (!topic || total_questions === undefined || score === undefined) {
      return res.status(400).json({ 
        error: "Missing required fields: topic, total_questions, and score must be provided." 
      });
    }

    if (!userName) {
      return res.status(400).json({
        error: "User name is required."
      });
    }

    // Insert the session row into our Supabase table
    const { data, error } = await supabase
      .from('quiz_history')
      .insert([
        { 
          topic, 
          total_questions: parseInt(total_questions), 
          score: parseInt(score),
          user_name: userName // Default fallback for local testing
        }
      ])
      .select();

    if (error) throw error;

    return res.status(201).json({ 
      success: true, 
      message: "Quiz history score recorded successfully.",
      data 
    });
  } catch (error) {
    console.error("Database Error saving score:", error.message);
    return res.status(500).json({ 
      error: "Internal Server Error while saving quiz record to database.",
      details: error.message 
    });
  }
};

export const getUserDashboard = async (req, res) => {
  try {
    const userName = req.query.userName;

    if (!userName) {
      return res.status(400).json({
        error: "User name is required."
      });
    }
    // Query rows belonging to this user name, sorting by newest attempts first
    const { data, error } = await supabase
      .from('quiz_history')
      .select('*')
      .eq('user_name', userName)
      .order('attempted_at', { ascending: false });

    if (error) throw error;

    // Dynamically calculate dashboard metrics from the records array
    const totalAttempts = data.length;
    const totalScorePoints = data.reduce((sum, current) => sum + current.score, 0);
    const averageScore = totalAttempts > 0 ? (totalScorePoints / totalAttempts).toFixed(1) : 0;

    return res.status(200).json({
      metrics: {
        totalAttempts,
        averageScore,
      },
      history: data
    });
  } catch (error) {
    console.error("Database Error fetching user statistics:", error.message);
    return res.status(500).json({ 
      error: "Internal Server Error while retrieving user performance dashboard metrics.",
      details: error.message 
    });
  }
};