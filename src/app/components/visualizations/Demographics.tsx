import * as d3 from "d3";
import { useEffect, useState, useRef } from "react";

type VerdictCounts = {
  yta: number;
  nta: number;
  esh: number;
  nah: number;
};

type PostSummary = {
  id: string;
  title: string;
  verdict: string | null;
  reddit_verdicts: VerdictCounts;
  user_verdicts: VerdictCounts;
  poster_age: number | null;
  poster_sex: string | null;
  score: number | null;
  permalink: string | null;
};


// The frame of the svg element we make here
const WIDTH = 1200;
const HEIGHT = 800;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };

export function DemographicGraph() {
  const svgRef = useRef<SVGSVGElement>(null);

  // UseStates
  const [data, setData] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load our data first
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/posts/all");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: PostSummary[] = await res.json();
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
