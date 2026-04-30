import { VisualizationTemplate } from "./visualizations/VisualizationTemplate";
import { UserVsReddit } from "./visualizations/UserVsReddit";
import { DemographicGraph } from "./visualizations/Demographics";
import { WelcomePage } from "./visualizations/WelcomePage";

export function VisualizationsSection() {
  return (
    // Each section snaps into GamePage's outer scroll container
    <>
      {/* This block defines each visualizations segment */}
      <section className="h-screen snap-start flex flex-col items-center justify-center px-4 py-6 md:py-10 md:px-10 overflow-hidden">
        <div className="max-w-5xl w-full flex flex-col gap-4">
          <div className="shrink-0">
            {/* Visualization's Title and Description */}
            <h1 className="text-4xl font-bold text-gray-900 text-center mb-1">Insights from the r/AmITheAsshole community.</h1>
          </div>
          <div className="bg-white justify-center shadow-2xl rounded-3xl p-8 flex flex-col overflow-hidden h-[45vh]">
            <WelcomePage />
          </div>
        </div>
      </section>

      <section className="h-screen snap-start flex flex-col px-4 py-6 md:py-10 md:px-10 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 gap-4 min-h-0">
          <div className="shrink-0">
            <h1 className="text-4xl font-bold text-gray-900 text-center mb-1">Are our Users More or Less Forgiving than Reddit?</h1>
            <p className="text-center text-gray-900">Userbase forgiveness analyzed through the total number of verdicts.</p>
          </div>
          <div className="bg-white shadow-2xl rounded-3xl p-8 flex-1 flex flex-col min-h-0 overflow-y-auto">
            <UserVsReddit />
          </div>
        </div>
      </section>

      <section className="h-screen snap-start flex flex-col px-4 py-6 md:py-10 md:px-10 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 gap-4 min-h-0">
          <div className="shrink-0">
            <h1 className="text-4xl font-bold text-gray-900 text-center mb-1">Does the Poster's Demographic Change How People Think of Them?</h1>
            <p className="text-center text-gray-900">A breakdown of who's posting to r/AmITheAsshole, and how people are responding.</p>
          </div>
          <div className="bg-white shadow-2xl rounded-3xl p-8 flex-1 flex flex-col min-h-0 overflow-y-auto">
            <DemographicGraph />
          </div>
        </div>
      </section>

      <section className="h-screen snap-start flex flex-col items-center justify-center px-4 py-6 md:py-10 md:px-10 overflow-hidden">
        <div className="max-w-5xl w-full flex flex-col gap-4">
          <div className="shrink-0">
            <h1 className="text-4xl font-bold text-gray-900 text-center mb-1">Thank you for playing!</h1>
          </div>
        </div>
      </section>
    </>
  );
}
