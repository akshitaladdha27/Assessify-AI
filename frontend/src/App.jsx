import { useState } from 'react';
import axios from 'axios';
import QuizPage from './QuizPage';
import DashboardStats from './components/DashboardStats';
import { ClipLoader } from 'react-spinners';

const App = () => {
  const [activeTab, setActiveTab] = useState("quiz");
  const [file, setFile] = useState(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [topic, setTopic] = useState('');
  const [quizReady, setQuizReady] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [serverFilename, setServerFilename] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setErrorMessage('');
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setErrorMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setServerFilename(response.data.filename);
      console.log(response.data);
      setFileUploaded(true);
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrorMessage('Failed to upload file to the server.');
    }
  };

  const handleStartQuiz = async () => {
    if (!topic) return;
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/generate-questions', {
        topic: topic,
        filename: serverFilename
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log("Questions requested successfully");
      setQuestions(response.data); 
      setLoading(false); 
      setQuizReady(true);
    } catch (error) {
      console.error('Error generating quiz:', error);
      setLoading(false);
      const details = error.response?.data?.details || 'AI extraction failed. Please check your backend logs or try a different topic.';
      setErrorMessage(details);
    }
  };

  const handleResetQuiz = () => {
    setQuestions(null);
    setQuizReady(false);
    setFileUploaded(false);
    setFile(null);
    setTopic('');
  };

  

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      
      {/* 🚀 Header & Premium Navigation Switcher */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleResetQuiz}>
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Assessify AI</h1>
            <p className="text-xs text-slate-400 font-medium">Smart Quiz Customizer</p>
          </div>
        </div>

        {/* 🎛️ Tabs wrapper menu */}
        {!questions && (
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("quiz")}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                activeTab === "quiz"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🎯 Generate Quiz
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                activeTab === "dashboard"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              📊 Performance History
            </button>
          </div>
        )}
      </header>

      {/* 🔮 Dynamic Tab Content Loading */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {questions ? (
          /* ⚡ Active Quiz Screen: Removed the outer wrapper card to fix double-border bug */
          <div className="max-w-4xl mx-auto">
            {/* 🔥 Pass current topic state down to the quiz layout for saving history later */}
            <QuizPage questions={questions} quizTopic={topic} onBack={handleResetQuiz} onQuizComplete={() => {
              setActiveTab("dashboard");
              setTimeout(() => {
          setQuestions(null); 
          setQuizReady(false);
          setFileUploaded(false);
          setFile(null);
          setTopic('');
        }, 100);
            }} />
          </div>
        ) : activeTab === "quiz" ? (
          /* Quiz Generation View Workspace */
          <div className="flex flex-col items-center justify-center py-10">
            {errorMessage && (
              <div className="mb-6 p-4 w-full max-w-md bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-sm">
                <p className="font-bold text-sm">⚠️ Generation Failed</p>
                <p className="text-xs mt-1">{errorMessage}</p>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ClipLoader color="#4F46E5" size={50} />
                <p className="mt-4 text-slate-500 font-medium text-sm animate-pulse">
                  AI is analyzing the PDF content and mapping your structured quiz layout...
                </p>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-150 shadow-md w-full max-w-md">
                <h2 className="text-xl font-bold mb-1 text-slate-800">Upload PDF</h2>
                <p className="text-slate-400 text-xs mb-6">Load any study material document to generate an instant challenge.</p>
                
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100/80 file:cursor-pointer cursor-pointer"
                />
                <button
                  onClick={handleUpload}
                  disabled={!file}
                  className={`mt-5 px-4 py-2.5 rounded-xl font-bold w-full transition-all duration-150 ${
                    file 
                      ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-100" 
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Upload File
                </button>

                {fileUploaded && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div>
                      <label htmlFor="topic" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Target Topic Focus
                      </label>
                      <input
                        type="text"
                        id="topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="mt-2 block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Docker Setup, React States, SQL Joins"
                      />
                    </div>

                    <button
                      onClick={handleStartQuiz}
                      disabled={!topic}
                      className={`mt-4 px-4 py-2.5 rounded-xl font-bold w-full transition-all duration-150 ${
                        topic 
                          ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-100" 
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      Start AI Quiz
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Dynamic History Analytics Dashboard View Workspace */
          <div className="animate-fade-in-up">
            <DashboardStats />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;