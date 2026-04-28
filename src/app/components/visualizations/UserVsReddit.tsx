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
const MARGIN = { top: 20, right: 100, bottom: 50, left: 100 };

export function UserVsReddit() {
  const svgRef = useRef<SVGSVGElement>(null);

  // UseStates
  const [data, setData] = useState<PostSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (!data) return;
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // SVG sizing
    const { width, height } = svgRef.current.getBoundingClientRect();
    const barWidth = width - MARGIN.left - MARGIN.right;
    const barHeight = height - MARGIN.top - MARGIN.bottom;

    // Clear any previous render before redrawing
    svg.selectAll("*").remove();

    // Create graph g and append it to the svg element
    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
    g;

    // Find total number of verdicts by each userbase
    const empty = (): VerdictCounts => ({ yta: 0, nta: 0, esh: 0, nah: 0 });

    // Aggregation of data
    const totalReddit = data.reduce((acc, post) => ({
      yta: acc.yta + post.reddit_verdicts.yta,
      nta: acc.nta + post.reddit_verdicts.nta,
      esh: acc.esh + post.reddit_verdicts.esh,
      nah: acc.nah + post.reddit_verdicts.nah,
    }), empty());

    const totalUser = data.reduce((acc, post) => ({
      yta: acc.yta + post.user_verdicts.yta,
      nta: acc.nta + post.user_verdicts.nta,
      esh: acc.esh + post.user_verdicts.esh,
      nah: acc.nah + post.user_verdicts.nah,
    }), empty());

    const reddit_yta_percent = (totalReddit.yta / (totalReddit.nta+totalReddit.yta))*100
    const reddit_nta_percent = (totalReddit.nta / (totalReddit.nta+totalReddit.yta))*100
    const user_yta_percent = (totalUser.yta / (totalUser.nta+totalUser.yta))*100
    const user_nta_percent = (totalUser.nta / (totalUser.nta+totalUser.yta))*100

    const redditBarGroup = g.append("g").attr("clip-path", `url(#bar-clip-r)`)
    const userBarGroup = g.append("g").attr("clip-path", `url(#bar-clip-u)`)

    // y-axis 
    const y = d3.scaleBand()
      .domain(["Reddit", "Users"])
      .range([0, barHeight])
      .paddingInner(0.1)   // gap between bars as a fraction of step size
      .paddingOuter(0.5)   // top/bottom margin — 0.5 centers the group
    ;

    // x-axis
    const x = d3.scaleLinear()
      .domain([0,100])
      .range([0,barWidth])

    const thickness = y.bandwidth() * 0.5; // 50% of the band — adjust to taste
    const offset = (y.bandwidth() - thickness) / 2;
      
    // Reddit clip path
    g.append("clipPath").attr("id", "bar-clip-r")
      .append("rect")
      .attr("x", 0).attr("y", y("Reddit")! + offset)
      .attr("width", barWidth).attr("height", thickness)
      .attr("rx", 20);

    // User clip path
    g.append("clipPath").attr("id", "bar-clip-u")
      .append("rect")
      .attr("x", 0).attr("y", y("Users")! + offset)
      .attr("width", barWidth).attr("height", thickness)
      .attr("rx", 20);


    // Reddit bar
    redditBarGroup.append("rect")
      .attr("x", 0).attr("y", y("Reddit")! + offset)
      .attr("width", x(reddit_yta_percent)).attr("height", thickness)
      .attr("fill", "#fca5a5")
      .on("mouseover", (event) => {
        tooltip.style("opacity", 1).style("border-color", "#fca5a5")
        .html(`
          <div style="display:flex;align-items:center;gap:8px;">
            <div>
              <div style="font-weight:700;font-size:14px;color:#991b1b">You're The Asshole</div>
              <div style="font-size:12px;color:#991b1b">${totalReddit.yta} Total Votes &mdash; ${reddit_yta_percent.toFixed(2)}% of Reddit</div>
            </div>
          </div>
        `);
        d3.select(event.currentTarget).transition().duration(150).attr("fill", "#f87171");
      })
      .on("mousemove", (event) => {
        const node = tooltip.node() as HTMLElement;
        tooltip
          .style("left", `${event.pageX - node.offsetWidth / 2}px`)
          .style("top", `${event.pageY - node.offsetHeight - 10}px`); // center the tooltip above the mouse
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).transition().duration(150).attr("fill", "#fca5a5");
        tooltip.style("opacity", 0);
      });
    redditBarGroup.append("rect")
      .attr("x", x(reddit_yta_percent)).attr("y", y("Reddit")! + offset)
      .attr("width", x(reddit_nta_percent)).attr("height", thickness)
      .attr("fill", "#86efac")
      .on("mouseover", (event) => {
        tooltip.style("opacity", 1).style("border-color", "#86efac")
        .html(`
          <div style="display:flex;align-items:center;gap:8px">
            <div>
              <div style="font-weight:700;font-size:14px;color:#166534">Not The Asshole</div>
              <div style="font-size:12px;color:#166534">${totalReddit.nta} Total Votes &mdash; ${reddit_nta_percent.toFixed(2)}% of Reddit</div>
            </div>
          </div>
        `);
        d3.select(event.currentTarget).transition().duration(150).attr("fill", "#5daa79");
      })
      .on("mousemove", (event) => {
        const node = tooltip.node() as HTMLElement;
        tooltip
          .style("left", `${event.pageX - node.offsetWidth / 2}px`)
          .style("top", `${event.pageY - node.offsetHeight - 10}px`); // center the tooltip above the mouse
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).transition().duration(150).attr("fill", "#86efac");
        tooltip.style("opacity", 0);
      });

    // User bar
    userBarGroup.append("rect")
      .attr("x", 0).attr("y", y("Users")! + offset)
      .attr("width", x(user_yta_percent)).attr("height", thickness)
      .attr("fill", "#fca5a5")
      .on("mouseover", (event) => {
        tooltip.style("opacity", 1).style("border-color", "#fca5a5")
        .html(`
          <div style="display:flex;align-items:center;gap:8px;">
            <div>
              <div style="font-weight:700;font-size:14px;color:#991b1b">You're The Asshole</div>
              <div style="font-size:12px;color:#991b1b">${totalUser.yta} Total Votes &mdash; ${user_yta_percent.toFixed(2)}% of Our Users</div>
            </div>
          </div>
        `);
        d3.select(event.currentTarget).transition().duration(150).attr("fill", "#f87171");
      })
      .on("mousemove", (event) => {
        const node = tooltip.node() as HTMLElement;
        tooltip
          .style("left", `${event.pageX - node.offsetWidth / 2}px`)
          .style("top", `${event.pageY - node.offsetHeight - 10}px`); // center the tooltip above the mouse
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).transition().duration(150).attr("fill", "#fca5a5");
        tooltip.style("opacity", 0);
      });
    userBarGroup.append("rect")
      .attr("x", x(user_yta_percent)).attr("y", y("Users")! + offset)
      .attr("width", x(user_nta_percent)).attr("height", thickness)
      .attr("fill", "#86efac")
      .on("mouseover", (event) => {
        tooltip.style("opacity", 1).style("border-color", "#86efac")
        .html(`
          <div style="display:flex;align-items:center;gap:8px">
            <div>
              <div style="font-weight:700;font-size:14px;color:#166534">Not The Asshole</div>
              <div style="font-size:12px;color:#166534">${totalUser.nta} Total Votes &mdash; ${user_nta_percent.toFixed(2)}% of Our Users</div>
            </div>
          </div>
        `);
        d3.select(event.currentTarget).transition().duration(150).attr("fill", "#5daa79");
      })
      .on("mousemove", (event) => {
        const node = tooltip.node() as HTMLElement;
        tooltip
          .style("left", `${event.pageX - node.offsetWidth / 2}px`)
          .style("top", `${event.pageY - node.offsetHeight - 10}px`); // center the tooltip above the mouse
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).transition().duration(150).attr("fill", "#86efac");
        tooltip.style("opacity", 0);
      });


    // Text Labels for each bar
    g.append("text")
      .attr("x", -8).attr("y", y("Reddit")! + y.bandwidth() / 2)
      .attr("dy", "0.35em").attr("text-anchor", "end")
      .text("Reddit")
    g.append("text")
      .attr("x", -8).attr("y", y("Users")! + y.bandwidth() / 2)
      .attr("dy", "0.35em").attr("text-anchor", "end")
      .text("Users")

    // X-axis percent labels
    const xAxisVerticalPosition = y("Users")! + offset + thickness + 40; 
    g.append("g")
      .attr("transform", `translate(0, ${xAxisVerticalPosition})`)
      .call(d3.axisBottom(x).tickFormat(d => `${d}%`))
      .selectAll("text")
        .style("font-size", "16px")

  }, [data]); // Data dependencies need to go here

  console.log(data)

  return (
    <svg
    ref={svgRef}
    className="w-full h-full"
    />
  );
}
