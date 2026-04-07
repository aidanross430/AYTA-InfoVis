import { useState } from "react";
import { ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { aitaScenarios } from "../data/aitaScenarios";
import { Button } from "./ui/button";

export function GamePage() {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [userVote, setUserVote] = useState<"YTA" | "NTA" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const currentScenario = aitaScenarios[currentScenarioIndex];

  const handleVote = (vote: "YTA" | "NTA") => {
    setUserVote(vote);
    
    // Determine if user's vote matches the majority
    const majority = currentScenario.ytaPercentage > 50 ? "YTA" : "NTA";
    if (vote === majority) {
      setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
    }
  };

  const handleNext = () => {
    if (currentScenarioIndex < aitaScenarios.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
      setUserVote(null);
    }
  };

  const handleRestart = () => {
    setCurrentScenarioIndex(0);
    setUserVote(null);
    setScore({ correct: 0, total: 0 });
  };

  const chartData = [
    { name: "YTA (You're The Asshole)", value: currentScenario.ytaPercentage, color: "#ef4444" },
    { name: "NTA (Not The Asshole)", value: currentScenario.ntaPercentage, color: "#22c55e" },
  ];

  const isGameComplete = currentScenarioIndex === aitaScenarios.length - 1 && userVote !== null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-400 via-pink-400 to-red-400 p-4 md:p-8">
      {/* Header with score */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-2">
          Are You The Asshole?
        </h1>
        <p className="text-lg text-gray-800">
          Score: {score.correct}/{score.total} correct
        </p>
      </div>

      {/* Main game area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-3xl bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
          {!userVote ? (
            <>
              {/* Question */}
              <div className="text-center mb-12">
                <p className="text-2xl md:text-4xl font-semibold text-gray-900 mb-8">
                  "{currentScenario.question}"
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Scenario {currentScenarioIndex + 1} of {aitaScenarios.length}
                </p>
              </div>

              {/* Vote buttons */}
              <div className="grid grid-cols-2 gap-6 md:gap-12">
                <button
                  onClick={() => handleVote("YTA")}
                  className="flex flex-col items-center justify-center p-8 bg-green-100 hover:bg-green-200 rounded-2xl transition-all transform hover:scale-105 border-4 border-green-400 hover:border-green-600"
                >
                  <ThumbsUp className="w-20 h-20 md:w-28 md:h-28 text-green-600 mb-4" strokeWidth={2.5} />
                  <span className="text-xl md:text-3xl font-bold text-gray-900">Yes</span>
                  <span className="text-sm md:text-base text-gray-700 mt-1">YTA</span>
                </button>

                <button
                  onClick={() => handleVote("NTA")}
                  className="flex flex-col items-center justify-center p-8 bg-red-100 hover:bg-red-200 rounded-2xl transition-all transform hover:scale-105 border-4 border-red-400 hover:border-red-600"
                >
                  <ThumbsDown className="w-20 h-20 md:w-28 md:h-28 text-red-600 mb-4" strokeWidth={2.5} />
                  <span className="text-xl md:text-3xl font-bold text-gray-900">No</span>
                  <span className="text-sm md:text-base text-gray-700 mt-1">NTA</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Results */}
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  You voted: {userVote}
                </h2>
                <p className="text-lg text-gray-700 mb-8">
                  Here's what everyone else thought:
                </p>
              </div>

              {/* Pie Chart */}
              <div className="mb-8">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Result message */}
              <div className="text-center mb-8">
                {((userVote === "YTA" && currentScenario.ytaPercentage > 50) ||
                  (userVote === "NTA" && currentScenario.ntaPercentage > 50)) && (
                  <p className="text-xl text-green-600 font-bold">
                    ✓ You agree with the majority!
                  </p>
                )}
                {((userVote === "YTA" && currentScenario.ytaPercentage <= 50) ||
                  (userVote === "NTA" && currentScenario.ntaPercentage <= 50)) && (
                  <p className="text-xl text-orange-600 font-bold">
                    You're in the minority on this one!
                  </p>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-4 justify-center">
                {!isGameComplete ? (
                  <Button
                    onClick={handleNext}
                    size="lg"
                    className="bg-gray-900 hover:bg-gray-800 text-white px-8"
                  >
                    Next Scenario
                  </Button>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-2xl font-bold text-gray-900">
                      Game Complete! 🎉
                    </p>
                    <p className="text-xl text-gray-700">
                      Final Score: {score.correct}/{score.total} (
                      {Math.round((score.correct / score.total) * 100)}%)
                    </p>
                    <Button
                      onClick={handleRestart}
                      size="lg"
                      className="bg-gray-900 hover:bg-gray-800 text-white px-8"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Play Again
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}