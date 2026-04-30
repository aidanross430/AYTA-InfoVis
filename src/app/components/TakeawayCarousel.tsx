import { useState } from "react";

export type Takeaway = {
  heading: string;
  body: string;
};

type TakeawayCarouselProps = {
  takeaways: Takeaway[];
};

export function TakeawayCarousel({ takeaways }: TakeawayCarouselProps) {
  const [index, setIndex] = useState(0);
  const prev = () => setIndex(i => (i - 1 + takeaways.length) % takeaways.length);
  const next = () => setIndex(i => (i + 1) % takeaways.length);

  if (takeaways.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center gap-2" style={{width: "60%"}}>
      <div className="w-full bg-gray-50 border-2 border-gray-300 rounded-2xl px-12 py-8 text-center h-36 flex flex-col justify-center">
        <p className="text-base font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {takeaways[index].heading}
        </p>
        <p className="text-gray-700 text-base">{takeaways[index].body}</p>
      </div>

      <div className="flex items-center gap-6">
        <button onClick={prev} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex gap-2">
          {takeaways.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === index ? "bg-gray-700 scale-125" : "bg-gray-300"}`}
            />
          ))}
        </div>

        <button onClick={next} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
