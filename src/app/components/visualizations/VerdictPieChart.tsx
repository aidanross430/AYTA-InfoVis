import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

type Scenario = {
  post_data: Post;
  user_verdict: string;
  yta_percentage: number;
  nta_percentage: number;
};

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

type VerdictPieChartProps = {
  ytaPercentage: number;
  ntaPercentage: number;
  scenario: Scenario;
};

// The frame of the svg element we make here
const WIDTH = 600;
const HEIGHT = 300;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };

export function VerdictPieChart({ ytaPercentage, ntaPercentage, scenario }: VerdictPieChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  console.log(scenario);
  const chartData = [
    { name: "YTA (You're The Asshole)", value: ytaPercentage, color: "#ef4444" },
    { name: "NTA (Not The Asshole)", value: ntaPercentage, color: "#22c55e" },
  ];

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
    
  
  }, [ytaPercentage, ntaPercentage]); // Data dependencies need to go here

  return (
    // 'recharts' pichart code from mockup
    <ResponsiveContainer width="100%" height={500}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ value }) => `${value}%`}
          outerRadius={200}
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
  );
}
