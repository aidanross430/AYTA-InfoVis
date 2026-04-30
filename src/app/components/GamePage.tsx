import { useState, useEffect, useRef } from "react";
import { ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { API_BASE } from "../../lib/api";
import { VisualizationsSection } from "./VisualizationsSection";
import { VerdictPieChart } from "./visualizations/VerdictPieChart";
import { GameSummary } from "./visualizations/GameSummary";


// How many posts do we show the user?
const POST_LIMIT = 5;

type Post = {
  id: string;
  title: string;
  body: string;
  verdict: string | null;
  yta_count: number;
  nta_count: number;
  esh_count: number;
  nah_count: number;
  poster_age: number | null;
  poster_sex: string | null;
  score: number | null;
  permalink: string | null;
};

type VerdictSubmission = {
  post_id: string;
  session_id: string;
  verdict: string;
};

type Scenario = {
  post_data: Post;
  user_verdict: string;
  yta_percentage: number;
  nta_percentage: number;
};

function computePercentages(post: Post): { yta_percentage: number; nta_percentage: number } {
  const total = post.yta_count + post.nta_count;
  console.log("Post Id: " + post.id + " Title: " + post.title)
  console.log("YTA count: " + post.yta_count)
  console.log("NTA count: " + post.nta_count)

  if (total === 0) return { yta_percentage: 50, nta_percentage: 50 };
  return {
    yta_percentage: Math.round((post.yta_count / total) * 100),
    nta_percentage: Math.round((post.nta_count / total) * 100),
  };
}

export function GamePage() {
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [userVote, setUserVote] = useState<"YTA" | "NTA" | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const sessionId = useRef(crypto.randomUUID());

  // Function grabs a random post from the databse
  async function loadPost() {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_BASE}/api/posts/random`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Post = await res.json();
      setCurrentPost(data);
    } catch (err) {
      setFetchError(String(err));
      console.error("Backend fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }
  
  useEffect(() => {
    loadPost();
  }, []);

  // Handlevote does the following:
  //  Computes the yta/nta percentages on the current post
  //  Saves the user vote to score data and uploads it to the backend
  //  Handles setting the next posts information
  const handleVote = async (vote: "YTA" | "NTA") => {
    if (!currentPost) return;

    const { yta_percentage, nta_percentage } = computePercentages(currentPost);
    const majority = yta_percentage > 50 ? "YTA" : "NTA";

    setUserVote(vote);
    setScore(prev => ({
      correct: vote === majority ? prev.correct + 1 : prev.correct,
      total: prev.total + 1,
    }));
    setScenarios(prev => [
      ...prev,
      { post_data: currentPost, user_verdict: vote, yta_percentage, nta_percentage },
    ]);

    try {
      const submission: VerdictSubmission = {
        post_id: currentPost.id,
        session_id: sessionId.current,
        verdict: vote,
      };
      await fetch(`${API_BASE}/api/verdicts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });
    } catch (err) {
      console.error("Failed to submit verdict:", err);
    }
  };

  const handleNext = async () => {
    if (scenarios.length >= POST_LIMIT) {
      setIsGameOver(true);
      return;
    }
    await loadPost();
    setUserVote(null);
  };

  const handleRestart = () => {
    setUserVote(null);
    setScenarios([]);
    setScore({ correct: 0, total: 0 });
    setIsGameOver(false);
    loadPost();
  };

  const percentages = currentPost
    ? computePercentages(currentPost)
    : { yta_percentage: 50, nta_percentage: 50 };

  const chartData = [
    { name: "YTA (You're The Asshole)", value: percentages.yta_percentage, color: "#ef4444" },
    { name: "NTA (Not The Asshole)", value: percentages.nta_percentage, color: "#22c55e" },
  ];

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory bg-gradient-to-br from-orange-400 via-pink-400 to-red-400">

    {/* Game Page Section */}
    <section className="h-screen snap-start flex flex-col p-4 md:p-8">

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
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="w-full max-w-6xl bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 max-h-full overflow-y-auto">
          {isGameOver ? (
            <GameSummary scenarios={scenarios} score={score} onRestart={handleRestart} />
          ) : fetchError ? (
            <div className="text-center">
              <p className="text-red-600 mb-4">{fetchError}</p>
              <Button onClick={loadPost}>Retry</Button>
            </div>
          ) : !currentPost ? (
            <div className="text-center text-gray-500">Loading scenario...</div>
          ) : !userVote ? (
            <>
              {/* Question */}
              <div className="text-center mb-12">
                <p className="text-sm text-gray-600 mb-4">
                  Scenario {scenarios.length + 1}
                </p>
                <p className="text-2xl md:text-4xl font-semibold text-gray-900 mb-3">
                  "{currentPost.title}"
                </p>
                {/*  */}
                {currentPost.permalink && (
                  <a
                    href={`https://reddit.com${currentPost.permalink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:text-gray-600 underline"
                  >
                    View on Reddit
                  </a>
                )}
              </div>

              {/* Vote buttons */}
              <div className="grid grid-cols-2 gap-6 md:gap-12">
                <button
                  onClick={() => handleVote("YTA")}
                  className="flex flex-col items-center justify-center p-8 bg-red-100 hover:bg-red-200 rounded-2xl transition-all transform hover:scale-105 border-4 border-red-400 hover:border-red-600"
                >
                  <ThumbsUp className="w-20 h-20 md:w-28 md:h-28 text-red-600 mb-4" strokeWidth={2.5} />
                  <span className="text-xl md:text-3xl font-bold text-gray-900">Yes</span>
                  <span className="text-sm md:text-base text-gray-700 mt-1">YTA</span>
                </button>

                <button
                  onClick={() => handleVote("NTA")}
                  className="flex flex-col items-center justify-center p-8 bg-green-100 hover:bg-green-200 rounded-2xl transition-all transform hover:scale-105 border-4 border-green-400 hover:border-green-600"
                >
                  <ThumbsDown className="w-20 h-20 md:w-28 md:h-28 text-green-600 mb-4" strokeWidth={2.5} />
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
                <VerdictPieChart
                  ytaPercentage={percentages.yta_percentage}
                  ntaPercentage={percentages.nta_percentage}
                  scenario={scenarios[scenarios.length - 1]}
                />
              </div>

              {/* Result message */}
              <div className="text-center mb-8">
                {((userVote === "YTA" && percentages.yta_percentage > 50) ||
                  (userVote === "NTA" && percentages.nta_percentage > 50)) && (
                  <p className="text-xl text-green-600 font-bold">
                    ✓ You agree with the majority!
                  </p>
                )}
                {((userVote === "YTA" && percentages.yta_percentage <= 50) ||
                  (userVote === "NTA" && percentages.nta_percentage <= 50)) && (
                  <p className="text-xl text-orange-600 font-bold">
                    X You're in the minority on this one!
                  </p>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="bg-gray-900 hover:bg-gray-800 text-white px-8"
                >
                  {scenarios.length >= POST_LIMIT ? "See Results" : "Next Scenario"}
                </Button>
                <Button
                  onClick={handleRestart}
                  size="lg"
                  variant="outline"
                  className="px-8"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Restart
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>

    {/* Visualization sections snap into place after the game */}
    <VisualizationsSection />

    </div>
  );
}
