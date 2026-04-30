import * as d3 from "d3";
import { useEffect, useState, useRef } from "react";
import { TakeawayCarousel, Takeaway } from "../TakeawayCarousel";
import { API_BASE } from "../../../lib/api";

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
const MARGIN = { top: 5, right: 100, bottom: 50, left: 100 };

// Our hardcoded analysis of the viz
const TAKEAWAYS: Takeaway[] = [
  {
    heading: "Difference in Sample Sizes",
    body: "We have a lot less User data than Reddit data, which could contribute to sampling errors.",
  },
  {
    heading: "Influence from Others",
    body: "Before making a verdict, users on Reddit probably read others' comments to see how they react.",
  },
  {
    heading: "More Context",
    body: `
    Our app only provides players the posts title, and looking at the original's post remains optional.
    Future plans include recording if the player looks at the original post for more context, and observing the effect that might have on their verdicts.
    `,
  },
];


export function UserVsReddit() {
  const svgRef = useRef<SVGSVGElement>(null);

  // UseStates
  const [data, setData] = useState<PostSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verdictShift, setVerdictShift] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PostSummary[] | null>(null);
  const [numResults, setNumResults] = useState<number>();
  const [hasEntered, setHasEntered] = useState(false);

  const handleClear = async () => {
    setQuery("");
    setSearchResults(null);
    setNumResults(undefined);
    try {
      const res = await fetch(`${API_BASE}/api/posts/all`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: PostSummary[] = await res.json();
      setData(json);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    // only return 
      try {
        const params = new URLSearchParams({ q: query });
        const res = await fetch(`${API_BASE}/api/posts/all?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: PostSummary[] = await res.json();
        setData(json);
        setSearchResults(json.slice(0, 5));
        setNumResults(json.length);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    setIsSearching(false);
  };


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
        const res = await fetch(`${API_BASE}/api/posts/all`);
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
    if (!data) return;
    if (!svgRef.current || !hasEntered) return;

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

    // Data calculations
    const reddit_yta_percent = (totalReddit.yta / (totalReddit.nta+totalReddit.yta))*100
    const reddit_nta_percent = (totalReddit.nta / (totalReddit.nta+totalReddit.yta))*100
    const user_yta_percent = (totalUser.yta / (totalUser.nta+totalUser.yta))*100
    const user_nta_percent = (totalUser.nta / (totalUser.nta+totalUser.yta))*100

    const shift = user_yta_percent - reddit_yta_percent;
    setVerdictShift(shift);

    const redditTotal = totalReddit.yta + totalReddit.nta;
    const userTotal = totalUser.yta + totalUser.nta;

    // bar groups for clipping paths
    const redditBarGroup = g.append("g").attr("clip-path", `url(#bar-clip-r)`)
    const userBarGroup = g.append("g").attr("clip-path", `url(#bar-clip-u)`)

    // y-axis 
    const y = d3.scaleBand()
      .domain(["Reddit", "Users"])
      .range([0, barHeight])
      .paddingInner(0.1)   // gap between bars as a fraction of step size
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
      .attr("width", 0)
      .attr("height", thickness)
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
      })
      .transition().duration(800).ease(d3.easeCubicIn)
      .attr("width", x(reddit_yta_percent));
    redditBarGroup.append("rect")
      .attr("x", x(reddit_yta_percent)).attr("y", y("Reddit")! + offset)
      .attr("width", 0)
      .attr("height", thickness)
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
      })
      .transition().delay(800).duration(800).ease(d3.easeCubicOut)
      .attr("width", x(reddit_nta_percent));

    // User bar
    userBarGroup.append("rect")
      .attr("x", 0).attr("y", y("Users")! + offset)
      .attr("width", 0)
      .attr("height", thickness)
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
      })
      .transition().duration(800).ease(d3.easeCubicIn)
      .attr("width", x(user_yta_percent));
    userBarGroup.append("rect")
      .attr("x", x(user_yta_percent)).attr("y", y("Users")! + offset)
      .attr("width", 0)
      .attr("height", thickness)
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
      })
      .transition().delay(800).duration(800).ease(d3.easeCubicOut)
      .attr("width", x(user_nta_percent));


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

    // Making the comparison between Reddit and Users
    // Arrow head
    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8).attr("refY", 0)
      .attr("markerWidth", 6).attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#6b7280");

    // Locations of important landmarks
    const x1 = x(reddit_yta_percent);
    const y1 = y("Reddit")! + offset + thickness / 2;
    const x2 = x(user_yta_percent);
    const y2 = y("Users")! + offset + thickness / 2;
    const yAvg = (y1 + y2)/2

    // Only render comparison when data could be found for both
    if (redditTotal > 0 && userTotal > 0) {
      // Line pointing for the shift
      g.append("line")
        .attr("x1", x1).attr("y1", yAvg)
        .attr("x2", x1).attr("y2", yAvg)
        .attr("stroke", "#6b7280")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0)
        .attr("stroke-dasharray", "4 3")
        .attr("marker-end", "url(#arrow)")
        .transition().delay(800).duration(800).ease(d3.easeCubicOut)
          .attr("x2", x2)
          .attr("opacity", 1);

      // markers for the yta/nta junctions
      g.append("line")
        .attr("x1", x1).attr("y1", y1+thickness/2)
        .attr("x2", x1).attr("y2", y1+thickness/2)
        .attr("stroke", "#6b7280")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0)
        .transition().delay(800).duration(800).ease(d3.easeCubicOut)
          .attr("y2", y2-thickness/1.2)
          .attr("opacity", 1);;
      g.append("line")
        .attr("x1", x2).attr("y1", y2-thickness/2)
        .attr("x2", x2).attr("y2", y2-thickness/2)
        .attr("stroke", "#6b7280")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0)
        .transition().delay(800).duration(800).ease(d3.easeCubicOut)
          .attr("y1", y1+thickness/1.2)
          .attr("opacity", 1);
      g.append("text")
        .attr("x", (x1+x2)/2).attr("y", yAvg-20)
        .attr("dy", "0.35em").attr("text-anchor", "middle")
        .attr("opacity", 0)
        .text(`${verdictShift?.toFixed(2)}%`)
        .transition().delay(800).duration(800).ease(d3.easeCubicOut)
          .attr("opacity", 1);
    }

    // YTA/NTA Labels on bars
    // Labels only show with sufficient percent
    if (reddit_yta_percent > 0.1)
    g.append("text")
      .attr("x", x(reddit_yta_percent) / 2).attr("y", y1)
      .attr("dy", "0.35em").attr("text-anchor", "middle")
      .attr("fill", "#991b1b").attr("font-size", 16)
      .text(`YTA`)
      .attr("opacity", 0)
      .transition().delay(800).duration(800).ease(d3.easeCubicOut)
        .attr("opacity", 1);
    if (reddit_nta_percent > 0.1)
    g.append("text")
      .attr("x", x(reddit_yta_percent) + x(reddit_nta_percent) / 2).attr("y", y1)
      .attr("dy", "0.35em").attr("text-anchor", "middle")
      .attr("fill", "#166534").attr("font-size", 16)
      .text(`NTA`)
      .attr("opacity", 0)
      .transition().delay(800).duration(800).ease(d3.easeCubicOut)
        .attr("opacity", 1);

    if (user_yta_percent > 0.1)
    g.append("text")
      .attr("x", x(user_yta_percent) / 2).attr("y", y2)
      .attr("dy", "0.35em").attr("text-anchor", "middle")
      .attr("fill", "#991b1b").attr("font-size", 16)
      .text(`YTA`)
      .attr("opacity", 0)
      .transition().delay(800).duration(800).ease(d3.easeCubicOut)
        .attr("opacity", 1);
    if (user_nta_percent > 0.1)
    g.append("text")
      .attr("x", x(user_yta_percent) + x(user_nta_percent) / 2).attr("y", y2)
      .attr("dy", "0.35em").attr("text-anchor", "middle")
      .attr("fill", "#166534").attr("font-size", 16)
      .text(`NTA`)
      .attr("opacity", 0)
      .transition().delay(800).duration(800).ease(d3.easeCubicOut)
        .attr("opacity", 1);


    // Labels for if no data could be found
    if (redditTotal === 0) {
      svg.append("text")
        .attr("x", barWidth / 2 + MARGIN.left)
        .attr("y", y1)
        .attr("text-anchor", "middle")
        .attr("fill", "#9ca3af")
        .attr("font-size", 14)
        .text("No verdict data found for Reddit");
    }
    
    if (userTotal === 0) {
      svg.append("text")
        .attr("x", barWidth / 2 + MARGIN.left)
        .attr("y", y2)
        .attr("text-anchor", "middle")
        .attr("fill", "#9ca3af")
        .attr("font-size", 14)
        .text("No verdict data found for Users");
    }

    // Make sure to get rid of the tooltip
    return () => { tooltip.remove(); };
  }, [data, verdictShift, hasEntered]); // Data dependencies need to go here


  return (
  <div className="flex flex-col gap-2 h-full">
    <h1 className="text-center">
      {verdictShift !== null && (
        <>
          Our users voted YTA{" "}
          <span style={{ color: verdictShift > 0 ? "#991b1b" : "#166534" }}>
            {Math.abs(verdictShift).toFixed(1)}%{" "}
            {verdictShift > 0 ? "more" : "less"}
          </span>{" "}
          than Reddit Users
        </>
      )}
    </h1>

    <div className="pt-8 items-center justify-center flex flex-col gap-4">
      <p className="text-center text-gray-800">What might be causing the differences in verdicts?</p>
      <TakeawayCarousel takeaways={TAKEAWAYS} />
    </div>

    <svg ref={svgRef} className="w-full" style={{ height: "75%" }} />
    {/* Keyword filtering */}
    <div className="flex flex-col gap-2 px-2">
      <p className="text-center text-gray-900">Curious how your situation would be broken down? Describe it here to filter by similar posts:</p>
      <form onSubmit={handleSearch} className="flex flex-col gap-2">
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Describe your situation..."
          rows={3}
          className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="self-end px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSearching ? "Searching..." : "Find Similar Posts"}
        </button>
      </form>
      {searchResults && searchResults.length > 0 && (
        <>
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">We found {numResults} similar posts! Here are the five best matches:</p>
            {searchResults.map((post, i) => {
              const ytaPct = Math.round((post.reddit_verdicts.yta / (post.reddit_verdicts.yta + post.reddit_verdicts.nta)) * 100);
              const majority = ytaPct > 50 ? "YTA" : "NTA";
              return (
                <div key={post.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                  <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
                  <p className="flex-1 text-sm text-gray-800 truncate">{post.title}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    majority === "YTA" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}>{majority === "YTA" ? ytaPct : 100-ytaPct}% {majority}</span>
                  {post.permalink && (
                    <a href={`https://reddit.com${post.permalink}`} target="_blank" rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 text-xs shrink-0">↗</a>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="self-end px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700">
            Clear selection?
          </button>
        </>
      )}
    </div>
  </div>
  );
}
