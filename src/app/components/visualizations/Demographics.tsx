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
const MARGIN = { top: 20, right: 80, bottom: 50, left: 70 };

export function DemographicGraph() {
  const svgRef = useRef<SVGSVGElement>(null);

  // UseStates
  const [data, setData] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasEntered, setHasEntered] = useState(false);

  // Graph control usestates/toggles
  const [showMale, setShowMale] = useState(true);
  const [showFemale, setShowFemale] = useState(true);
  const [viewMode, setViewMode] = useState<"both" | "lines" | "bars">("both");
  const [totalPosts, setTotalPosts] = useState<number>(0);
  const hasAnimated = useRef(false);
  // Also need: Show/ no show bar graph

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

  // Only do graph stuff once the user has scrolled to this visualization
  useEffect(() => {
    if (!svgRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !hasEntered) return;

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

    // Sum the total posts
    const total = [...dataBySexAndAge.values()].flat().reduce((acc, d) => acc + d.count, 0);
    setTotalPosts(total);

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

    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + MARGIN.bottom - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .style("font-size", "14px")
      .text("Poster Age in Years");

    // Y axis for YTA percent ticks and label
    g.append("g")
      .call(d3.axisLeft(y).tickFormat(d => `${d}%`))
      .selectAll("text")
        .style("font-size", "16px");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -MARGIN.left + 14)
      .attr("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .style("font-size", "14px")
      .text("% YTA Verdicts (Lines)");

    // Right Y-axis shows the total count of posts in each of the bins
    const maxCount = d3.max([...dataBySexAndAge.values()].flat(), d => d.count) ?? 0;
    const yCount = d3.scaleLinear()
      .domain([0, maxCount])
      .range([innerHeight, 0]);

    g.append("g")
      .attr("transform", `translate(${innerWidth}, 0)`)
      .call(d3.axisRight(yCount).ticks(5))
      .selectAll("text")
        .style("font-size", "14px");

    g.append("text")
      .attr("transform", "rotate(90)")
      .attr("x", innerHeight / 2)
      .attr("y", -innerWidth - MARGIN.right + 16)
      .attr("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .style("font-size", "14px")
      .text("Post Count (Bars)");

    // Calculate the bar width from the bin sizes, with 2 pixels of padding on each side
    const binPx = x(MIN_AGE + BIN_SIZE) - x(MIN_AGE);
    const barW = (binPx - 4) / 2;

    // Draw bars per sex BEFORE lines so lines render on top
    for (const [sex, lineData] of dataBySexAndAge) {
      const xOffset = sex === "M" ? -barW - 1 : 1;

      g.selectAll(`.bar-${sex}`)
        .data(lineData)
        .join("rect")
        .attr("class", `bar-${sex}`)
        .attr("x", d => x(d.age) + xOffset)
        .attr("width", barW)
        .attr("fill", colorScale(sex))
        .attr("opacity", 0.40)
        .attr("y", innerHeight)
        .attr("height", 0)
        .on("mouseover", (event, d) => {
          tooltip.style("opacity", 1).style("border-color", colorScale(sex))
            .html(`
              <div style="font-weight:700;font-size:14px">Age ${d.age - 2.5}–${d.age + 2.5}</div>
              <div style="font-size:12px">YTA: ${d.ytaPct.toFixed(1)}%</div>
              <div style="font-size:12px">${d.count} posts</div>
            `);
          d3.select(event.currentTarget).attr("opacity", 0.8);
        })
        .on("mousemove", (event) => {
          const node = tooltip.node() as HTMLElement;
          tooltip
            .style("left", `${event.pageX - node.offsetWidth / 2}px`)
            .style("top", `${event.pageY - node.offsetHeight - 10}px`);
        })
        .on("mouseout", (event) => {
          tooltip.style("opacity", 0);
          d3.select(event.currentTarget).attr("opacity", 0.4);
        })
        .transition().duration(1000).ease(d3.easeCubicOut)
        .attr("y", d => yCount(d.count))
        .attr("height", d => innerHeight - yCount(d.count));
    }

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
      const path = g.append("path")
        .datum(lineData)
        .attr("class", `line-${sex}`) // for independently targetting the two lines, for animations
        .attr("fill", "none")
        .attr("stroke", colorScale(sex))
        .attr("stroke-width", 4)
        .attr("d", line);

      // Progressive draw animation on first entry
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition().duration(2000).ease(d3.easeCubicInOut)
        .attr("stroke-dashoffset", 0);

      // Dot markers for each data point, with tooltips on hover
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
        .transition().delay(1500).duration(800).ease(d3.easeCubicOut)
        .attr("opacity", 1)
        .on("end", (_, i) => { if (i === 0) hasAnimated.current = true; });
    }

    return () => { tooltip.remove(); };
  }, [data, hasEntered]);

  // Handle toggle visibility — each effect owns one sex, both sex toggle and viewMode feed in
  useEffect(() => {
    if (!svgRef.current || !hasAnimated.current) return;
    const svg = d3.select(svgRef.current);
    const t = (show: boolean) => (sel: d3.Selection<d3.BaseType, unknown, SVGSVGElement, unknown>) => {
      sel.interrupt().transition().duration(400).attr("opacity", show ? 1 : 0);
      sel.style("pointer-events", show ? "all" : "none")
    };
    svg.selectAll<d3.BaseType, unknown>(".line-M, .dot-M").call(t(showMale && viewMode !== "bars"));
    svg.selectAll<d3.BaseType, unknown>(".bar-M").call(t(showMale && viewMode !== "lines"));
  }, [showMale, viewMode]);

  useEffect(() => {
    if (!svgRef.current || !hasAnimated.current) return;
    const svg = d3.select(svgRef.current);
    const t = (show: boolean) => (sel: d3.Selection<d3.BaseType, unknown, SVGSVGElement, unknown>) => {
      sel.interrupt().transition().duration(400).attr("opacity", show ? 1 : 0);
      sel.style("pointer-events", show ? "all" : "none");
    };
    svg.selectAll<d3.BaseType, unknown>(".line-F, .dot-F").call(t(showFemale && viewMode !== "bars"));
    svg.selectAll<d3.BaseType, unknown>(".bar-F").call(t(showFemale && viewMode !== "lines"));
  }, [showFemale, viewMode]);

  return (
    <div className="flex flex-col py-12 items-center gap-4 w-full h-full">
      <h1 className="text-center">Post Distribution by Age and Sex</h1>
      {/* Graph Title and data label */}
      {totalPosts > 0 && (
      <p className="text-sm text-gray-500">
        Showing data from <span className="font-semibold text-gray-700">{totalPosts.toLocaleString()}</span> posts
      </p>
      )}

      <svg
        ref={svgRef}
        className="w-full h-auto"  style={{width: '90%', height: '60%'}}
      />
      {/* Graph control buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowMale(v => !v)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
            showMale
              ? "bg-blue-400 border-blue-400 text-white"
              : "bg-white border-blue-400 text-blue-400"
          }`}
        >
          Show Male
        </button>
        <button
          onClick={() => setShowFemale(v => !v)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
            showFemale
              ? "bg-pink-400 border-pink-400 text-white"
              : "bg-white border-pink-400 text-pink-400"
          }`}
        >
          Show Female
        </button>

        <div className="flex rounded-full border-2 border-orange-300 overflow-hidden text-sm font-semibold">
          {(["both", "lines", "bars"] as const).map((mode, i) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 transition-all capitalize ${
                i > 0 ? "border-l border-orange-300" : ""
              } ${viewMode === mode ? "bg-orange-600 text-white" : "bg-white text-orange-600 hover:bg-orange-100"}`}
            >
              {mode === "both" ? "Both" : mode === "lines" ? "Lines" : "Bars"}
            </button>
          ))}
        </div>

        {/* Carousel for data insights */}
      </div>
    </div>
  );
}
