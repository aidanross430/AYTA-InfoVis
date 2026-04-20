import { VerdictDistribution } from "./visualizations/VerdictDistribution";
import { UserVsReddit } from "./visualizations/UserVsReddit";
import { VerdictOverTime } from "./visualizations/VerdictOverTime";
import { VisualizationTemplate } from "./visualizations/VisualizationTemplate";

export function VisualizationsSection() {
  return (
    <section className="bg-gradient-to-br from-pink-400 via-red-400 to-orange-400 px-4 py-16 md:px-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-2">
          By the Numbers
        </h1>
        <p className="text-center text-gray-500 mb-16">
          Insights from the r/AmITheAsshole community.
        </p>

        <div className="space-y-20">

          {/* Heres what should be copied when creating new visualizations. Duplicate the Visualization template file to make your own. */}
          <div className="bg-white shadow-2xl rounded-3xl shadow p-8">
            <VisualizationTemplate />
          </div>

        </div>
      </div>
    </section>
  );
}
