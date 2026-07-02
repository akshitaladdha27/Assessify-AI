import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { gsap } from 'gsap';
import QuizPage from './QuizPage';
import DashboardStats from './components/DashboardStats';
import { ClipLoader } from 'react-spinners';

const API_URL = import.meta.env.VITE_API_URL;

const App = () => {
  const [activeTab, setActiveTab] = useState("quiz");
  const [file, setFile] = useState(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [quizReady, setQuizReady] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [serverFilename, setServerFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [userName, setUserName] = useState(localStorage.getItem("quiz_user_name") || "");
  const [tempName, setTempName] = useState("");

  const workspaceRef = useRef(null);
  const fishAssetRef = useRef(null);

  useEffect(() => {
    if (userName && activeTab === "quiz" && !loading && !questions) {
      gsap.fromTo(workspaceRef.current,
        { x: -400, y: -250, opacity: 0, scale: 0.5 },
        { x: 0, y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "back.out(1.2)" }
      );
    }
  }, [userName, activeTab, loading, questions]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (questions) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [questions]);

  useEffect(() => {
    if (!questions) return;

    const handlePopState = () => {
      const leave = window.confirm(
        "Exit the quiz? Your progress will be lost."
      );

      if (!leave) {
        window.history.pushState(null, "", window.location.href);
      } else {
        handleResetQuiz();
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [questions]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setErrorMessage('');
  };

  const handleSaveName = (e) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    localStorage.setItem("quiz_user_name", tempName);
    setUserName(tempName);
  };

  const handleLogoutUser = () => {
    localStorage.removeItem("quiz_user_name");
    setUserName("");
    handleResetQuiz();
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    setErrorMessage('');

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const filename = response.data.filename;

      setServerFilename(filename);
      setFileUploaded(true);

      setLoadingTopics(true);

      const topicResponse = await axios.post(
          `${API_URL}/api/get-topics`,
          {
              filename: filename
          }
      );

      setTopics(topicResponse.data.topics);
      setLoadingTopics(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrorMessage('Failed to upload file to the server database layer.');
      setLoadingTopics(false);
    }finally {
      setUploading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!selectedTopic) return;

    setTimeout(() => {
    setLoading(true); 
    setErrorMessage('');
  }, 400);

  try {
    // 3. Keep displaying the UI while fetching data over the network
    const response = await axios.post(`${API_URL}/api/generate-questions`, {
      topic: selectedTopic,
      filename: serverFilename 
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    // 4. 🔥 PREMIUM TRANSITION: Jab data aa jaye, tab smoothly card ko fade-out karo!
    gsap.to(workspaceRef.current, {
      scale: 0.9,
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        // Fade out complete hone ke baad hi states update hongi aur QuizPage load hoga
        setQuestions(response.data); 
        setLoading(false); 
        setQuizReady(true);
        
        // Naye page ko smoothly wapas visible karo
        gsap.to(workspaceRef.current, { scale: 1, opacity: 1, duration: 0.1 });
      }
    });

  } catch (error) {
    console.error('Error generating quiz:', error);
    setLoading(false);
    const details = error.response?.data?.details || 'AI configuration parsing fault occurred.';
    setErrorMessage(details);
  } finally {
    // Clean transition element asset cache safely
    gsap.set(fishAssetRef.current, { display: "none" }); 
  }
};

  const handleResetQuiz = () => {
    setQuestions(null);
    setQuizReady(false);
    setFileUploaded(false);
    setFile(null);
    setSelectedTopic("");
    setTopics([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden">
      
      {/* 🐠 Animated Fish Overlay Asset */}
      <div 
        ref={fishAssetRef} 
        className="hidden absolute text-6xl z-50 pointer-events-none transform right-[-100px] bottom-[15%]"
        style={{ transform: "scaleX(-1)" }} 
      >
        🐟
      </div>

      {/* 🔒 PHASE 1: Session Verification Guard */}
      {!userName ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <form onSubmit={handleSaveName} className="bg-white p-8 rounded-2xl border border-slate-150 shadow-md w-full max-w-md text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome to Assessify AI</h2>
            <p className="text-slate-400 text-xs mb-6">Enter your name to track your custom quiz metrics history.</p>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
              placeholder="Enter your name (e.g., Rama, Shama)"
              required
            />
            <button type="submit" className="bg-indigo-600 text-white font-bold py-2.5 rounded-xl w-full hover:bg-indigo-500 transition-all shadow-md">
              Get Started
            </button>
          </form>
        </div>
      ) : (
        /* PHASE 2: Main Authorized Dynamic Worksheets Workspace Layout */
        <>
          <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleResetQuiz}>
              <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Assessify AI</h1>
                <p className="text-xs text-indigo-600 font-bold">Authenticated Workspace: {userName} ✨</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!questions && (
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setActiveTab("quiz")}
                    className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === "quiz" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    🎯 Generate Quiz
                  </button>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${activeTab === "dashboard" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    📊 History
                  </button>
                </div>
              )}
              {questions && (
                <button
                  onClick={() => {
                    const confirmExit = window.confirm(
                      "Are you sure you want to exit? Your current quiz progress will be lost."
                    );

                    if (confirmExit) {
                      handleResetQuiz();
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-500 transition"
                >
                  Exit Quiz
                </button>
              )}
              <button onClick={handleLogoutUser} className="text-xs text-red-500 font-bold border border-red-200 px-3 py-1.5 rounded-lg bg-red-50/50 hover:bg-red-50">
                Change Identity
              </button>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 py-8">
            {questions ? (
              <div className="max-w-4xl mx-auto">
                <QuizPage 
                  questions={questions} 
                  quizTopic={selectedTopic} 
                  currentUserName={userName} 
                  onBack={handleResetQuiz} 
                  onQuizComplete={() => {
                    setActiveTab("dashboard");
                    setTimeout(() => { handleResetQuiz(); }, 120);
                  }} 
                />
              </div>
            ) : activeTab === "quiz" ? (
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
                      AI is evaluating dataset strings and compiling target schemas response matrix...
                    </p>
                  </div>
                ) : (
                  <div 
                    ref={workspaceRef} 
                    className="bg-white p-8 rounded-2xl border border-slate-150 shadow-md w-full max-w-md origin-top-left"
                  >
                    <h2 className="text-xl font-bold mb-1 text-slate-800">Upload PDF</h2>
                    <p className="text-slate-400 text-xs mb-6">Load study material documents to compile customized target metric boards.</p>
                    
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100/80 file:cursor-pointer cursor-pointer"
                    />
                    <button
                      onClick={handleUpload}
                      disabled={!file || uploading}
                      className={`mt-5 px-4 py-2.5 rounded-xl font-bold w-full transition-all duration-150 flex items-center justify-center gap-2 ${
                        !file || uploading
                          ? "bg-slate-300 text-white cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
                      }`}
                    >
                      {uploading ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>

                          Uploading...
                        </>
                      ) : (
                        "Upload File"
                      )}
                    </button>

                    {fileUploaded && (
                      <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in">
                        <div>
                          {/* <label htmlFor="topic" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                            Target Topic Focus
                          </label>
                          <input
                            type="text"
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="mt-2 block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g., Docker Setup, React States, SQL Joins"
                          /> */}
                          {loadingTopics ? (

                        <div className="mt-5 text-center">

                        <p className="font-semibold">
                        📄 Reading PDF...
                        </p>

                        <p className="text-sm text-gray-500">
                        AI is finding all available topics.
                        </p>

                        </div>

                        ) : (

                        <>

                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Choose a Topic
                        </p>

                        <div className="grid grid-cols-2 gap-3">

                        {topics.map((item) => (

                        <button
                        key={item}
                        type="button"
                        onClick={() => setSelectedTopic(item)}
                        className={`p-3 rounded-xl border transition

                        ${
                        selectedTopic===item
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white hover:bg-indigo-50"
                        }
                        `}
                        >

                        {item}

                        </button>

                        ))}

                        </div>

                        </>

                        )}
                        </div>

                        <button
                          onClick={handleStartQuiz}
                          disabled={!selectedTopic}
                          className={`mt-4 px-4 py-2.5 rounded-xl font-bold w-full transition-all duration-150 ${selectedTopic ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                        >
                          Start AI Quiz
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-fade-in-up duration-9000">
                <DashboardStats currentUserName={userName} />
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;