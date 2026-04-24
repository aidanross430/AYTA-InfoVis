import * as d3 from "d3";
import { useEffect, useState, useRef } from "react";

type VerdictCounts = {
  yta: number;
  nta: number;
  esh: number;
  nah: number;
};

type PostDetail = {
  id: string;
  title: string;
  body: string;
  verdict: string | null;
  score: number | null;
  permalink: string | null;
  reddit_verdicts: VerdictCounts;
  user_verdicts: VerdictCounts;
};

// The frame of the svg element we make here
const WIDTH = 600;
const HEIGHT = 400;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };

export function UserVsReddit() {
  const svgRef = useRef<SVGSVGElement>(null);

  // UseStates
  const [data, setData] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load our data first
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/posts/xt1ksm");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: PostDetail = await res.json();
        setData(json);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Clear any previous render before redrawing
    svg.selectAll("*").remove();

    // Create graph g and append it to the svg element
    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
    g;

    // Start coding Visualization here!

  }, []); // Data dependencies need to go here

  console.log(data)

  return (
    <svg
      ref={svgRef}
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full h-auto"
    />
  );
}
