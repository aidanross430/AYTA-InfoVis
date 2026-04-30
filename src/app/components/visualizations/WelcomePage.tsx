export function WelcomePage() {
  return (
    <div className="text-center py-[2vh] px-[3vw]">
      <h1
        className="font-semibold text-gray-900 mb-[2vh]"
        style={{ fontSize: "clamp(1rem, 2.5vh, 2.25rem)" }}
      >
        Analysis of the AmITheAsshole subreddit allows us to answer questions about
        what influences the online moral judgements people make.
      </h1>

      <p
        className="font-semibold text-gray-700 mb-[1.5vh]"
        style={{ fontSize: "clamp(0.875rem, 2vh, 1.875rem)" }}
      >
        These central questions include:
      </p>
      <ul
        className="text-left font-semibold text-gray-700 list-disc pl-5"
        style={{ fontSize: "clamp(0.75rem, 1.75vh, 1.5rem)" }}
      >
        <li>Do different user demographics make different judgements?</li>
        <li>Are there specific situations that people judge more or less harshly?</li>
        <li>How does the demographic information of the poster influence people's decisions?</li>
      </ul>
    </div>
  );
}
