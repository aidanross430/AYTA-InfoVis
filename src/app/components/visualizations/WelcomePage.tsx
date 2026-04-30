import * as d3 from "d3";
import { useEffect, useRef } from "react";

export function WelcomePage() {

  useEffect(() => {


  }, []); // Data dependencies need to go here

  return (
    <div className="text-center mb-12 py-12 px-12">
      <h1 className="text-4xl font-semibold text-gray-900 mb-20">
        Analysis of the AmITheAsshole subreddit allows us to answer questions about
        what influences the online moral judgmenets people make.
      </h1>

      <p className="text-3xl font-semibold text-gray-700 mb-8">
        These central questions include:
      </p>
      <ul className="text-2xl text-left font-semibold text-gray-700 mb-4 list-disc pl-5">
        <li>Do different user demographics make different judgements?</li>
        <li>Are there specific situations that people judge more or less harshly?</li>
        <li>How does the demographic information of the poster influence people's decisions?</li>
      </ul>
    </div>
  );
}
