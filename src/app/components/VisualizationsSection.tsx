import { VisualizationTemplate } from "./visualizations/VisualizationTemplate";
import { UserVsReddit } from "./visualizations/UserVsReddit";
import { DemographicGraph } from "./visualizations/Demographics";
import { HelloWorld } from "./visualizations/WelcomePage";

export function VisualizationsSection() {
  return (
    // Each section snaps into GamePage's outer scroll container
    <>
      {/* This block defines each visualizations segment */}
      <section className="h-screen snap-start flex flex-col px-4 py-6 md:py-10 md:px-10">
        <div className="max-w-5xl mx-auto w-full flex flex-col flex-1 gap-4">
          <div>
            {/* Visualization's Title and Description */}
            <h1 className="text-4xl font-bold text-gray-900 text-center mb-1">By the Numbers</h1>
            <p className="text-center text-gray-900">Insights from the r/AmITheAsshole community.</p>
          </div>
          <div className="bg-white shadow-2xl rounded-3xl p-8 flex-1 flex flex-col">
            <HelloWorld />
          </div>
        </div>
      </section>

      <section className="h-screen snap-start flex flex-col px-4 py-6 md:py-10 md:px-10">
        <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 text-center mb-1">Are our Users More or Less Forgiving than Reddit?</h1>
            <p className="text-center text-gray-900">Userbase forgiveness analyzed through the total number of verdicts.</p>
          </div>
          <div className="bg-white shadow-2xl rounded-3xl p-8 flex-1 flex flex-col">
            <UserVsReddit />
          </div>
        </div>
      </section>

      <section className="h-screen snap-start flex flex-col px-4 py-6 md:py-10 md:px-10">
        <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 text-center mb-1">Does the Poster's Demographic Change How People Think of Them?</h1>
            <p className="text-center text-gray-900">A breakdown of who's posting to r/AmITheAsshole, and how people are responding.</p>
          </div>
          <div className="bg-white shadow-2xl rounded-3xl p-8 flex-1 flex flex-col">
            <DemographicGraph />
          </div>
        </div>
      </section>
    </>
  );
}
