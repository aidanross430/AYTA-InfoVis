import { RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useState, useRef } from "react";


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

type Scenario = {
  post_data: Post;
  user_verdict: string;
  yta_percentage: number;
  nta_percentage: number;
};

type GameSummaryProps = {
  scenarios: Scenario[];
  score: { correct: number; total: number };
  onRestart: () => void;
};

// The frame of the svg element we make here
const WIDTH = 600;
const HEIGHT = 400;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };

export function GameSummary({ scenarios, score, onRestart }: GameSummaryProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  // Data processing

  return (
    <div>
      <svg
        ref={svgRef}
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
      />
      <Button onClick={onRestart} size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-8">
        <RotateCcw className="w-5 h-5 mr-2" />
        Play Again
      </Button>
    </div>
  );
}
