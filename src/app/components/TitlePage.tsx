import { useNavigate } from "react-router";
import { Button } from "./ui/button";

export function TitlePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-400 via-pink-400 to-red-400 p-8">
      <div className="text-center space-y-8 max-w-2xl">
        <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-4">
          Are You The Asshole?
        </h1>
        <p className="text-xl md:text-2xl text-gray-800">
          Think you can judge who's in the wrong? Test your moral compass with real AITA scenarios!
        </p>
        <Button
          onClick={() => navigate("/game")}
          size="lg"
          className="bg-gray-900 hover:bg-gray-800 text-white text-xl px-12 py-6 rounded-full shadow-2xl transform transition-all hover:scale-105"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
