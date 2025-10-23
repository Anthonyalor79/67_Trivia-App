"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-700 to-indigo-900 text-white px-6">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-5xl font-extrabold mb-4 text-center drop-shadow-lg"
      >
        Tap Tap Trivia
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg text-gray-200 mb-10 text-center max-w-md"
      >
        Challenge your friends and test your knowledge in real time!
      </motion.p>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-yellow-400 text-black font-semibold px-8 py-3 rounded-2xl shadow-lg hover:bg-yellow-300 transition"
          onClick={() => router.push("/rooms")}
        >
          Start Game
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white text-indigo-700 font-semibold px-8 py-3 rounded-2xl shadow-lg hover:bg-gray-100 transition"
          onClick={() => router.push("/join")}
        >
          Join Game
        </motion.button>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-gray-300 text-sm">
        © {new Date().getFullYear()} Tap Tap Trivia
      </footer>
    </main>
  );
}
