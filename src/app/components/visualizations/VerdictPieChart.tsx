import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { useEffect, useState } from "react";

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

export function VerdictPieChart({ ytaPercentage, ntaPercentage, scenario }: VerdictPieChartProps) {
  const [vh, setVh] = useState(window.innerHeight);

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const chartHeight = Math.round(vh * 0.32);
  const outerRadius = Math.round(vh * 0.10);

  console.log(scenario);
  const chartData = [
    { name: "YTA (You're The Asshole)", value: ytaPercentage, color: "#ef4444" },
    { name: "NTA (Not The Asshole)", value: ntaPercentage, color: "#22c55e" },
  ];

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ value }) => `${value}%`}
          outerRadius={outerRadius}
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
