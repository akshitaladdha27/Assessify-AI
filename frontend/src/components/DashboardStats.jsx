import React, { useEffect, useState } from "react";
import { fetchDashboardStats } from "../services/api.js";

const DashboardStats = () => {
  const [stats, setStats] = useState({ totalAttempts: 0, averageScore: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetchDashboardStats("Akshita Laddha");
        setStats(response.data.metrics);
        setHistory(response.data.history);
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return <div className="text-center py-10 text-gray-500 animate-pulse">Loading analytics...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-purple-50 rounded-2xl border-l-8 border-purple-600 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quizzes Attempted</h3>
          <p className="text-4xl font-extrabold text-purple-700 mt-2">{stats.totalAttempts}</p>
        </div>
        
        <div className="p-6 bg-sky-50 rounded-2xl border-l-8 border-sky-600 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Average Score</h3>
          <p className="text-4xl font-extrabold text-sky-700 mt-2">{stats.averageScore} pts</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Performance History</h3>
        
        {history.length === 0 ? (
          <p className="text-gray-400 italic text-center py-6">No records found. Take a quiz to log data!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-100 text-gray-400 text-sm font-semibold">
                  <th className="pb-3">Topic</th>
                  <th className="pb-3">Score Achieved</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-medium text-gray-700">{item.topic}</td>
                    <td className="py-4">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                        {item.score} / {item.total_questions}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-gray-400">
                      {new Date(item.attempted_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardStats;