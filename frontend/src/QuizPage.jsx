import React, { useState } from 'react';
import axios from 'axios'; 

const QuizPage = ({ questions, quizTopic, onBack, onQuizComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const userSelectedAnswer = selectedAnswers[currentQuestionIndex];

  const handleAnswerClick = (answerText, isCorrect) => {
    if (userSelectedAnswer !== undefined) return; // prevent re-selection

    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answerText,
    });

    if (isCorrect) setScore((prevScore) => prevScore + 1); // Functional state update
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true); 
    await handleFinishQuiz(); 
  };

  const wasAnswerIncorrect = () => {
    if (userSelectedAnswer === undefined) return false;
    const currentOptions = currentQuestion.answers;
    const chosenOptionObj = currentOptions.find(a => a.text === userSelectedAnswer);
    return chosenOptionObj ? !chosenOptionObj.correct : false;
  };

  const handleFinishQuiz = async () => {
    try {
      console.log("Saving quiz metrics to Supabase database...");
      
      // 1. Send the score data payload securely to your Express backend
      await axios.post('https://assessify-ai.onrender.com/api/save-score', {
        topic: quizTopic || "General PDF Quiz",
        total_questions: questions.length,
        score: score, 
        userName: "Akshita Laddha"
      });
      
      console.log("✅ Quiz history recorded successfully!");

      // 2. Trigger the callback animation pipeline to shift tabs to your dashboard stats
      if (onQuizComplete) {
        onQuizComplete();
      }
    } catch (error) {
      console.error("❌ Failed logging performance metrics back to schema instance:", error);
      // Fallback redirect even if database network experiences an error so the UI flow doesn't freeze
      if (onQuizComplete) onQuizComplete();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 bg-slate-50 w-full">
      {!submitted ? (
        <>
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-md w-full max-w-xl">
            {/* Progress Bar Header */}
            <div className="flex justify-between text-xs text-gray-400 mb-3 font-bold uppercase tracking-wider">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>Score: {score}</span>
            </div>

            <h2 className="text-xl font-bold mb-5 text-gray-800">{currentQuestion.question}</h2>

            {/* Answer Options Grid */}
            <div className="grid gap-4">
              {currentQuestion.answers.map((answer, idx) => {
                const isChosen = userSelectedAnswer === answer.text;
                let btnStyle = 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200';

                if (userSelectedAnswer !== undefined) {
                  if (isChosen) {
                    btnStyle = answer.correct 
                      ? 'bg-green-500 text-white border-green-600 shadow-sm shadow-green-100' 
                      : 'bg-red-500 text-white border-red-600 shadow-sm shadow-red-100';
                  } else if (answer.correct) {
                    btnStyle = 'bg-green-100 text-green-800 border-green-300 font-semibold';
                  } else {
                    btnStyle = 'bg-slate-50 text-slate-300 border-slate-100 opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerClick(answer.text, answer.correct)}
                    className={`px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all ${btnStyle}`}
                    disabled={userSelectedAnswer !== undefined}
                  >
                    {answer.text}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Real-time Explanation Banner */}
            {wasAnswerIncorrect() && (
              <div className="mt-5 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 rounded-r-xl shadow-sm">
                <p className="font-bold flex items-center text-xs uppercase tracking-wider text-amber-700 mb-1">
                  💡 Explanation
                </p>
                <p className="text-sm leading-relaxed font-medium">{currentQuestion.explanation}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-6 flex justify-between border-t pt-4 border-slate-100">
              <button
                onClick={goToPreviousQuestion}
                className="bg-slate-600 text-white font-semibold text-sm px-5 py-2 rounded-xl hover:bg-slate-500 disabled:opacity-40 transition-all"
                disabled={currentQuestionIndex === 0}
              >
                Back
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={goToNextQuestion}
                  className="bg-indigo-600 text-white font-semibold text-sm px-5 py-2 rounded-xl hover:bg-indigo-500 disabled:opacity-40 transition-all"
                  disabled={userSelectedAnswer === undefined}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="bg-emerald-600 text-white font-semibold text-sm px-5 py-2 rounded-xl hover:bg-emerald-500 disabled:opacity-40 transition-all"
                  disabled={userSelectedAnswer === undefined}
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Dynamic Loading Screen View state during DB write operation */
        <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-150 w-full max-w-xl text-center">
          <div className="text-4xl animate-bounce mb-3">🚀</div>
          <h2 className="text-xl font-bold mb-2 text-gray-800">Saving Your Progress...</h2>
          <p className="text-sm text-slate-400">Recording results to your database metrics sheet before redirecting.</p>
        </div>
      )}
    </div>
  );
};

export default QuizPage;