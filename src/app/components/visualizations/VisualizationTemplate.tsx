import * as d3 from "d3";
import { useEffect, useRef } from "react";

// The frame of the svg element we make here
const WIDTH = 1200;
const HEIGHT = 800;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };

export function VisualizationTemplate() {
  const svgRef = useRef<SVGSVGElement>(null);

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
