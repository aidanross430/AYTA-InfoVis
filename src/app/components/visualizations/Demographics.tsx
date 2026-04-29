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
const MARGIN = { top: 20, right: 20, bottom: 50, left: 50 };

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

    // SVG sizing
    const { width, height } = svgRef.current.getBoundingClientRect();

    // Create graph g and append it to the svg element
    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
    g;

    // Start coding Visualization here!

    // Data Processing!
    // Filter out unfitting posts, aka posts with no age, sex, or verdict information
    const filteredPosts = data.filter(d =>
      d.poster_age !== null &&
      (d.reddit_verdicts.yta + d.reddit_verdicts.nta) > 0 &&
      (d.poster_sex === ("F") || d.poster_sex === ("M"))
    );

    // Bin posts by age, in bins of size five
    const MIN_AGE = 10
    const MAX_AGE = 67
    const BIN_SIZE = 5
    const MIN_POST_NUMBER = 15

    const binner = d3.bin<PostSummary, number>()
      .value(d => d.poster_age!)
      .thresholds(d3.range(MIN_AGE, MAX_AGE, BIN_SIZE));

    // Group posts by sex, M or F

    const postsBySex = d3.group(filteredPosts, d => d.poster_sex);

    // For each sex group, bin by age and compute percent for YTA
    const dataBySexAndAge = new Map<string, { age: number; ytaPct: number; count: number }[]>();

    for (const [sex, posts] of postsBySex) {
      const bins = binner(posts);
      const lineData = bins
        .map(bin => {
          const yta = bin.reduce((acc, p) => acc + p.reddit_verdicts.yta, 0);
          const total = bin.reduce((acc, p) => acc + p.reddit_verdicts.yta + p.reddit_verdicts.nta, 0);
          return {
            age: (bin.x0! + bin.x1!) / 2,
            ytaPct: total > 0 ? (yta / total) * 100 : null,
            count: bin.length,
          };
        })
        .filter((d): d is { age: number; ytaPct: number; count: number } => d.ytaPct !== null && d.count > MIN_POST_NUMBER);

      dataBySexAndAge.set(sex!, lineData);
    }

    console.log(dataBySexAndAge)

    // Line chart and bar chart sizing
    const innerWidth  = width  - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top  - MARGIN.bottom;

    // X-axis: poster age
    const x = d3.scaleLinear()
      .domain([MIN_AGE, MAX_AGE])
      .range([0, innerWidth]);

    // Y-axis: YTA percentage
    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Color per sex
    const colorScale = d3.scaleOrdinal<string>()
      .domain(["M", "F"])
      .range(["#60a5fa", "#f472b6"]); // blue for M, pink for F

    // X axis ticks and label
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(d => `${d}`))
      .selectAll("text")
        .style("font-size", "16px");

    // Y axis for YTA percent ticks and label
    g.append("g")
      .call(d3.axisLeft(y).tickFormat(d => `${d}%`))
      .selectAll("text")
        .style("font-size", "16px");

    // Line generator
    const line = d3.line<{ age: number; ytaPct: number }>()
      .defined(d => d.ytaPct !== null)
      .x(d => x(d.age))
      .y(d => y(d.ytaPct))
      .curve(d3.curveMonotoneX);

    // Tooltip html content
    // Why does this need to be placed here? the other tooltip didnt need to be placed here? Im so confused
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

    // Draw a line for M and F
    for (const [sex, lineData] of dataBySexAndAge) {
      // Build the line!
      const path = g.append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", colorScale(sex))
        .attr("stroke-width", 4)
        .attr("d", line);

      // Animate the line
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeCubicInOut)
        .attr("stroke-dashoffset", 0);

      // DMarkers for each data point, with tooltips on hover
      g.selectAll(`.dot-${sex}`)
        .data(lineData)
        .join("circle")
        .attr("class", `dot-${sex}`)
        .attr("cx", d => x(d.age))
        .attr("cy", d => y(d.ytaPct))
        .attr("r", 7)
        .attr("fill", colorScale(sex))
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("opacity", 0)
        .on("mouseover", (event, d) => {
          tooltip.style("opacity", 1).style("border-color", colorScale(sex))
            .html(`
              <div style="font-weight:700;font-size:14px">Age ${d.age - 2.5}–${d.age + 2.5}</div>
              <div style="font-size:12px">YTA: ${d.ytaPct.toFixed(1)}%</div>
              <div style="font-size:12px">${d.count} posts</div>
            `);
          d3.select(event.currentTarget).attr("r", 10);
        })
        .on("mousemove", (event) => {
          const node = tooltip.node() as HTMLElement;
          tooltip
            .style("left", `${event.pageX - node.offsetWidth / 2}px`)
            .style("top", `${event.pageY - node.offsetHeight - 10}px`);
        })
        .on("mouseout", (event) => {
          tooltip.style("opacity", 0);
          d3.select(event.currentTarget).attr("r", 7);
        })
        .transition().delay(1500).duration(800).ease(d3.easeCubicOut).attr("opacity", 1);
    }

    // Make sure to get rid of the tooltip
    return () => { tooltip.remove(); };
  }, [data]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-auto"  style={{height: '75%'}}
    />
  );
}
