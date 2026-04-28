import { RotateCcw, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";


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


function ScenarioCard({ scenario, index }: { scenario: Scenario; index: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  const scenario_majority = scenario.yta_percentage > 50 ? "YTA" : "NTA";
  const did_user_agree = scenario.user_verdict === scenario_majority;






  useEffect(() => {

    // Graph Dimensions
    if (!svgRef.current) return;
    const width = svgRef.current.getBoundingClientRect().width;
    const height = svgRef.current.getBoundingClientRect().height;
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };

    // Tooltip div
    const tooltip = d3.select("body").append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "2px solid transparent")
      .style("border-radius", "12px")
      .style("padding", "8px 14px")
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.10)")
      .style("font-family", "inherit")
      .style("pointer-events", "none")
      .style("opacity", 0);


    // Bar's dimensions
    const barWidth = width - margin.left - margin.right;
    const barHeight = height*0.80 - margin.top - margin.bottom;
    const ytaWidth = (scenario.yta_percentage / 100) * barWidth;
    const ntaWidth = (scenario.nta_percentage / 100) * barWidth;

    // Make the graph
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`)
    
    // Clip the ends of the bars into circles
    const clipId = `bar-clip-${index}`;

    // Define clip path with rounded corners
    g.append("clipPath").attr("id", clipId)
      .append("rect")
      .attr("width", barWidth).attr("height", barHeight)
      .attr("rx", 20);

    // Group both bars and clip them together
    const barGroup = g.append("g").attr("clip-path", `url(#${clipId})`)

    // YTA bar
    barGroup.append("rect")
      .attr("x", 0).attr("y", 0)
      .attr("width", ytaWidth).attr("height", barHeight)
      .attr("fill", "#fca5a5")
      .on("mouseover", (event) => {
        tooltip.style("opacity", 1).style("border-color", "#fca5a5")
        .html(`
          <div style="display:flex;align-items:center;gap:8px;">
            <div>
              <div style="font-weight:700;font-size:14px;color:#991b1b">You're The Asshole</div>
              <div style="font-size:12px;color:#991b1b">${scenario.post_data.yta_count} votes &mdash; ${scenario.yta_percentage}% of Reddit</div>
            </div>
          </div>
        `);
      })
      .on("mousemove", (event) => {
        const node = tooltip.node() as HTMLElement;
        tooltip
          .style("left", `${event.pageX - node.offsetWidth / 2}px`)
          .style("top", `${event.pageY - node.offsetHeight - 10}px`); // center the tooltip above the mouse
      })
      .on("mouseout", (event) => {
        tooltip.style("opacity", 0);
      });

    // NTA bar
    barGroup.append("rect")
      .attr("x", ytaWidth).attr("y", 0)
      .attr("width", ntaWidth).attr("height", barHeight)
      .attr("fill", "#86efac")
      .on("mouseover", (event) => {
        tooltip.style("opacity", 1).style("border-color", "#86efac")
        .html(`
          <div style="display:flex;align-items:center;gap:8px">
            <div>
              <div style="font-weight:700;font-size:14px;color:#166534">Not The Asshole</div>
              <div style="font-size:12px;color:#166534">${scenario.post_data.nta_count} votes &mdash; ${scenario.nta_percentage}% of Reddit</div>
            </div>
          </div>
        `);
      })
      .on("mousemove", (event) => {
        const node = tooltip.node() as HTMLElement;
        tooltip
          .style("left", `${event.pageX - node.offsetWidth / 2}px`)
          .style("top", `${event.pageY - node.offsetHeight - 10}px`); // center the tooltip above the mouse
      })
      .on("mouseout", (event) => {
        tooltip.style("opacity", 0);
      });

    // Full bar border
    g.append("rect")
      .attr("width", barWidth).attr("height", barHeight)
      .attr("rx", 20)
      .attr("fill", "none")
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 1.5);

    // Labels only show with sufficient percent
    if (scenario.yta_percentage > 0.1)
    g.append("text")
      .attr("x", ytaWidth / 2).attr("y", barHeight / 2)
      .attr("dy", "0.35em").attr("text-anchor", "middle")
      .attr("fill", "#991b1b").attr("font-size", 11)
      .text(`YTA`);

    if (scenario.nta_percentage > 0.1)
    g.append("text")
      .attr("x", ytaWidth + ntaWidth / 2).attr("y", barHeight / 2)
      .attr("dy", "0.35em").attr("text-anchor", "middle")
      .attr("fill", "#166534").attr("font-size", 11)
      .text(`NTA`);

  }, [scenario]);

  return (
    <div className="bg-white rounded-xl text-center border border-gray-200 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Scenario {index+1}</p>
      </div>
      <p className="text-lg font-bold text-gray-800 mb-1">{scenario.post_data.title}</p>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">You Voted:</p>
      <div className="flex text-center items-center justify-center">
        <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
          scenario.user_verdict === "YTA"
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-700"
        }`}>
          {scenario.user_verdict}
        </span>
      </div>
      {/* Graph */}
      <svg ref={svgRef} width="100%" height="160" className="w-full" />
      {/* User agreed? */}
      <span className={`text-xs font-semibold ${did_user_agree ? "text-green-600" : "text-orange-500"}`}>
        {did_user_agree ? "✓ Agreed with majority" : "✗ In the minority"}
      </span>
    </div>
  );
}

export function GameSummary({ scenarios, score, onRestart }: GameSummaryProps) {
  // Data processing

  score.correct
  score.total

  // Parts to achieve:
  // Aggegate scores - total correct over total asked
  // Per-scenario: title, users verdict, bar of split
  // Highlights: most/least controversial, worst disagreement

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Card 1 — Aggregate Score */}
      <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-200">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Times you voted with the majority:</p>
        {/* Displaying the user's final score: */}
        <p className="text-6xl font-bold text-gray-800 mb-1">
          {score.correct} / {score.total}
        </p>
      </div>

      {/* Card 2 — Per-Scenario Breakdown */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Round by Round</p>
        {/* Create a scrollable sub section */}
        <div className="flex flex-col gap-4 overflow-y-auto max-h-100 scrollbar-hide">
          {scenarios.map((scenario, index) => (
            <ScenarioCard key={scenario.post_data.id} scenario={scenario} index={index} />
          ))}
        </div>
      </div>

      {/* Restart */}
      <div className="text-center">
        <Button onClick={onRestart} size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-8">
          <RotateCcw className="w-5 h-5 mr-2" />
          Play Again
        </Button>
      </div>

    </div>
  );
}
